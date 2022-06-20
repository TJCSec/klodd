import Fastify from 'fastify'
import sensible from '@fastify/sensible'

import api from './api/index.js'
import rctfAuth from './rctf-auth.js'

const fastify = Fastify({
  logger: true,
  ignoreTrailingSlash: true,
})

fastify.register(sensible)
fastify.register(rctfAuth)
fastify.register(api, {
  prefix: '/api',
})

export default fastify
