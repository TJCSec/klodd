import auth from './auth.js'
import challenge from './challenge.js'

const routes = async (fastify, _options) => {
  fastify.register(auth)
  fastify.register(challenge, {
    prefix: '/challenge',
  })
}

export default routes
