import classnames from 'classnames'
import produce from 'immer'
import { useRef } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import TimeAgo from 'react-time-ago'

import AuthButton from '../components/authbutton'
import Server from '../components/server'
import Spinner from '../components/spinner'
import config from '../config'

import './challenge.css'

import { apiRequest, useChallenge } from '../util'

const Challenge = () => {
  const { challengeId } = useParams()
  const { data, error, mutate } = useChallenge(challengeId)
  const recaptchaRef = useRef(null)

  const handleAuth = (token) => {
    localStorage.setItem('token', token)
    mutate()
  }

  const execRecaptcha = async () => {
    const token = await recaptchaRef.current.executeAsync()
    recaptchaRef.current.reset()
    return token
  }

  const handleStart = async () => {
    const recaptcha = await execRecaptcha()
    const req = apiRequest('POST', `/api/challenge/${challengeId}/create`, {
      recaptcha,
    })
    const promise = toast.promise(req, {
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

  const handleStop = async () => {
    const recaptcha = await execRecaptcha()
    const req = apiRequest('POST', `/api/challenge/${challengeId}/delete`, {
      recaptcha,
    })
    const promise = toast.promise(req, {
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
        <AuthButton className="btn btn-auth" onAuthSuccess={handleAuth}>
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
          Stopping <TimeAgo future date={data.time.stop} />
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
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={config.recaptcha}
        badge="bottomright"
        size="invisible"
      />
    </>
  )
}

export default Challenge
