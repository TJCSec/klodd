import got from 'got'

import config from '../config.js'

const getTeam = async (token) => {
  const { kind, data } = await got({
    prefixUrl: config.rctfUrl,
    url: 'api/v1/users/me',
    headers: {
      authorization: `Bearer ${token}`,
    },
    responseType: 'json',
    resolveBodyOnly: true,
    throwHttpErrors: false,
  })
  if (kind !== 'goodUserData') {
    return null
  }
  return data
}

export default getTeam
