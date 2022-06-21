import Fastify from 'fastify'
import sensible from '@fastify/sensible'

import api from './api/index.js'
import jwt from './jwt.js'

const fastify = Fastify({
  logger: true,
  ignoreTrailingSlash: true,
})

fastify.register(sensible)
fastify.register(jwt)
fastify.register(api, {
  prefix: '/api',
})

export default fastify
