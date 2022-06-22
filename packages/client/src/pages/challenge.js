import classnames from 'classnames'
import produce from 'immer'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import useSWR from 'swr'

import TimeAgo from 'react-timeago'

import AuthButton from '../components/authbutton'
import Server from '../components/server'
import Spinner from '../components/spinner'
import './challenge.css'

const timeFmt = (value, unit, suffix) => {
  if (suffix === 'from now') {
    return `in ${value} ${unit}${value > 1 ? 's' : ''}`
  } else {
    return 'now'
  }
}

const apiRequest = async (challengeId, method = 'GET') => {
  const res = await fetch(`/api/challenge/${challengeId}`, {
    method,
    headers: {
      authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
    },
  })

  if (!res.ok) {
    const info = await res.json()
    const error = new Error(info.message)
    error.info = info
    error.status = res.status
    throw error
  }

  if (res.status !== 204) {
    return res.json()
  } else {
    return null
  }
}

const useChallenge = (challengeId) =>
  useSWR(challengeId, apiRequest, {
    // https://github.com/vercel/swr/blob/790e044d9d7d58194c2493a24073f23272af99c2/_internal/utils/config.ts#L16-L38
    onErrorRetry: (error, _key, config, revalidate, opts) => {
      if (error.status === 401 || error.status === 404) {
        return
      }

      const maxRetryCount = config.errorRetryCount
      const currentRetryCount = opts.retryCount

      const timeout =
        ~~(
          (Math.random() + 0.5) *
          (1 << (currentRetryCount < 8 ? currentRetryCount : 8))
        ) * config.errorRetryInterval

      if (maxRetryCount !== undefined && currentRetryCount > maxRetryCount) {
        return
      }

      setTimeout(revalidate, timeout, opts)
    },
    refreshInterval: (data) => {
      if (data === undefined) {
        return 0
      }
      if (data.status === 'Pending') {
        return 1000
      } else if (data.status === 'Terminating') {
        return 2000
      } else if (data.status === 'Running') {
        return data.time.remaining < 5000 ? 1000 : 5000
      } else {
        return 0
      }
    },
  })

const Challenge = () => {
  const { challengeId } = useParams()
  const { data, error, mutate } = useChallenge(challengeId)

  const handleAuth = (token) => {
    localStorage.setItem('token', token)
    mutate()
  }

  const handleStart = () => {
    const promise = toast.promise(apiRequest(challengeId, 'POST'), {
      pending: 'Starting instance',
      success: 'Instance started',
      error: {
        render({ data }) {
          return data.message
        },
      },
    })
    mutate(promise, {
      optimisticData: produce(data, (draft) => {
        draft.status = 'Pending'
      }),
      rollbackOnError: true,
      revalidate: false,
      populateCache: true,
    })
  }

  const handleStop = () => {
    const promise = toast.promise(apiRequest(challengeId, 'DELETE'), {
      pending: 'Stopping instance',
      success: 'Instance stopped',
      error: {
        render({ data }) {
          return data.message
        },
      },
    })
    mutate(promise, {
      optimisticData: produce(data, (draft) => {
        draft.status = 'Terminating'
        delete draft.server
        delete draft.time
      }),
      rollbackOnError: true,
      revalidate: true,
      populateCache: false,
    })
  }

  if (error?.status === 401) {
    return (
      <>
        <h1>Unauthenticated</h1>
        <p>You are currently unauthenticated.</p>
        <AuthButton
          className="challenge-button auth"
          onAuthSuccess={handleAuth}
        >
          Authenticate
        </AuthButton>
      </>
    )
  }

  if (error?.status === 404) {
    return (
      <>
        <h1>{error.info.error}</h1>
        <p>{error.info.message}</p>
      </>
    )
  }

  if (!data) {
    return (
      <>
        <p>Loading...</p>
      </>
    )
  }

  return (
    <>
      <h1>{data.name}</h1>
      <p>
        Status:{' '}
        <span
          className={classnames(
            'status-text',
            'status-' + data.status.toLowerCase()
          )}
        >
          {data.status}
        </span>
      </p>
      {data.server && (
        <p>
          Server: <Server {...data.server} />
        </p>
      )}
      {data.time && (
        <p>
          Stopping <TimeAgo date={data.time.stop} formatter={timeFmt} />
        </p>
      )}
      {data.status === 'Stopped' && (
        <button className="btn btn-start" onClick={handleStart}>
          Start
        </button>
      )}
      {data.status === 'Running' && (
        <button className="btn btn-stop" onClick={handleStop}>
          Stop
        </button>
      )}
      {(data.status === 'Pending' || data.status === 'Terminating') && (
        <Spinner
          className={classnames(
            'status-spinner',
            'status-' + data.status.toLowerCase()
          )}
        />
      )}
    </>
  )
}

export default Challenge
