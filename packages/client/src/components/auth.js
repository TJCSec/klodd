import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

const useQuery = () => {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

// TODO: is this illegal? lmao
const Auth = () => {
  const query = useQuery()
  const token = query.get('token')
  const state = query.get('state')

  useEffect(() => {
    try {
      window.opener.postMessage({ kind: 'authToken', state, token })
    } catch {
    } finally {
      window.close()
    }
  })

  return null
}

export default Auth
