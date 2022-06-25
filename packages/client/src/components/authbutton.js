import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import Button from './button'
import config from '../config'

const getState = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')

const AuthButton = ({ onAuthSuccess, children, ...props }) => {
  const [authState, setAuthState] = useState(null)

  // https://github.com/redpwn/rctf/blob/a9871cb313756beff4ea966800a5c5d7fcf9a6bd/client/src/util/ctftime.js
  const handleAuth = () => {
    const width = 600
    const height = 500
    const systemZoom = window.innerWidth / window.screen.availWidth
    const left =
      (window.innerWidth - width) / 2 / systemZoom + window.screenLeft
    const top =
      (window.innerHeight - height) / 2 / systemZoom + window.screenTop

    const state = getState()
    setAuthState(state)

    const url = new URL('/auth', config.rctfUrl)
    const redirect = new URL('/auth', config.publicUrl)
    url.searchParams.append('redirect_uri', redirect)
    url.searchParams.append('state', state)
    const popup = window.open(
      url,
      'Authenticate',
      [
        `width=${width / systemZoom}`,
        `height=${height / systemZoom}`,
        `top=${top}`,
        `left=${left}`,
      ].join(',')
    )
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
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: evt.data.token }),
    })

    if (!res.ok) {
      const { message } = await res.json()
      toast.error(message)
      return
    }

    const { token } = await res.json()
    localStorage.setItem('token', token)
    toast.success('Authenticated')
    onAuthSuccess(token)
  }

  useEffect(() => {
    window.addEventListener('message', handlePostMessage)
    return () => {
      window.removeEventListener('message', handlePostMessage)
    }
  })

  return (
    <Button {...props} onClick={handleAuth}>
      {children}
    </Button>
  )
}

export default AuthButton
