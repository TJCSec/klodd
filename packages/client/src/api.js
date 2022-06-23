import useSWR from 'swr'

const handleResponse = async (res) => {
  if (!res.ok) {
    const info = await res.json()
    const error = new Error(info.message)
    error.info = info
    error.status = res.status
    throw error
  }

  return res.json()
}

export const apiRequest = async (method, endpoint, data) => {
  let body = null
  let qs = ''

  if (method === 'GET' && data) {
    qs = '?' + new URLSearchParams(data).toString()
  } else {
    body = JSON.stringify(data)
  }

  const headers = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }

  if (body) {
    headers['Accept'] = 'application/json'
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(endpoint + qs, { method, headers, body })

  return handleResponse(res)
}

const fetcher = async (challengeId) =>
  apiRequest('GET', `/api/challenge/${challengeId}`)

export const useChallenge = (challengeId) =>
  useSWR(challengeId, fetcher, {
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
