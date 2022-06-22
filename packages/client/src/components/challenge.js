import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import useSWR from 'swr'
import produce from 'immer'

import MoonLoader from "react-spinners/MoonLoader"
import TimeAgo from 'react-timeago'

import config from '../config'

import Server from './server'
import './challenge.css'

const getState = () => Array.from(crypto.getRandomValues(new Uint8Array(16)))
  .map(v => v.toString(16).padStart(2, '0')).join('')

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
      authorization: `Bearer ${localStorage.getItem('token') ?? ''}`
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

const useChallenge = (challengeId) => useSWR(challengeId, apiRequest, {
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
    } else if (data.status === 'Terminating' ) {
      return 2000
    } else if (data.status === 'Running') {
      return (data.time.remaining < 5000) ? 1000 : 5000
    } else {
      return 0
    }
  }
})

const Challenge = () => {
  const { challengeId } = useParams()
  const { data, error, mutate } = useChallenge(challengeId)
  const [authState, setAuthState] = useState(null)

  // https://github.com/redpwn/rctf/blob/a9871cb313756beff4ea966800a5c5d7fcf9a6bd/client/src/util/ctftime.js
  const handleAuth = () => {
    const width = 600
    const height = 500
    const systemZoom = window.innerWidth / window.screen.availWidth
    const left = (window.innerWidth - width) / 2 / systemZoom + window.screenLeft
    const top = (window.innerHeight - height) / 2 / systemZoom + window.screenTop

    const state = getState()
    setAuthState(state)

    const url = new URL('/auth', config.rctfUrl)
    const redirect = new URL('/auth', config.publicUrl)
    url.searchParams.append('redirect_uri', redirect)
    url.searchParams.append('state', state)
    const popup = window.open(url, 'Authenticate', [
      `width=${width / systemZoom}`,
      `height=${height / systemZoom}`,
      `top=${top}`,
      `left=${left}`,
    ].join(','))
    popup.focus()
  }

  // https://github.com/redpwn/rctf/blob/a9871cb313756beff4ea966800a5c5d7fcf9a6bd/client/src/components/ctftime-button.js#L32-L53
  const handlePostMessage = async (evt) => {
    if (evt.origin !== window.location.origin) {
      return
    }

    if (evt.data.kind !== 'authToken') {
      return
    }

    if (authState === null || evt.data.state !== authState) {
      toast.error('Invalid authentication state')
      return
    }

    setAuthState(null)

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: evt.data.token })
    })

    if (!res.ok) {
      const { message } = await res.json()
      toast.error(message)
      return
    }

    const { token } = await res.json()
    localStorage.setItem('token', token)
    toast.success('Authenticated')
    mutate()
  }

  useEffect(() => {
    window.addEventListener('message', handlePostMessage)
    return () => { window.removeEventListener('message', handlePostMessage) }
  })

  const handleStart = () => {
    toast.promise(
      mutate(apiRequest(challengeId, 'POST'), {
        optimisticData: produce(data, (draft) => {
          draft.status = 'Pending'
        }),
        rollbackOnError: true,
        revalidate: false,
        populateCache: true,
      }),
      {
        pending: 'Starting instance',
        success: 'Instance started',
        error: {
          render({ data }) {
            return data.message
          }
        },
      }
    )
  }

  const handleStop = () => {
    toast.promise(
      mutate(apiRequest(challengeId, 'DELETE'), {
        optimisticData: produce(data, (draft) => {
          draft.status = 'Terminating'
          delete draft.server
          delete draft.time
        }),
        rollbackOnError: true,
        revalidate: true,
        populateCache: false,
      }),
      {
        pending: 'Stopping instance',
        success: 'Instance stopped',
        error: {
          render({ data }) {
            return data.message
          }
        }
      }
    )
  }

  if (!data) {
    if (error) {
      if (error.status === 401) {
        return (
          <>
            <h1>Unauthenticated</h1>
            <p>You are currently unauthenticated.</p>
            <button className="challenge-button auth" onClick={handleAuth}>Authenticate</button>
          </>
        )
      }
      return (
        <>
          <h1>{error.info.error}</h1>
          <p>{error.info.message}</p>
        </>
      )
    }

    return (
      <>
        <p>Loading...</p>
      </>
    )
  }

  return (
    <>
      <h1>{data.name}</h1>
      <p>Status: <span className={`challenge-status ${data.status.toLowerCase()}`}>{data.status}</span></p>
      {data.server &&
        <p>Server: <Server {...data.server} /></p>
      }
      {data.time &&
        <p>Stopping <TimeAgo date={data.time.stop} formatter={timeFmt} /></p>
      }
      {data.status === 'Stopped' &&
        <button className="challenge-button start" onClick={handleStart}>Start</button>
      }
      {data.status === 'Running' &&
        <button className="challenge-button stop" onClick={handleStop}>Stop</button>
      }
      {(data.status === 'Pending' || data.status === 'Terminating') &&
        <MoonLoader css="position: absolute; top: 1rem; right: 1rem;" size={20} color="black" />
      }
    </>
  )
}

export default Challenge
