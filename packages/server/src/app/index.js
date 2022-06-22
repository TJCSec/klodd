import Fastify from 'fastify'
import sensible from '@fastify/sensible'

import config from '../config.js'
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

const clientConfig = 'window.config = ' + JSON.stringify({
  publicUrl: config.publicUrl,
  recaptcha: config.recaptcha.siteKey,
  rctfUrl: config.rctfUrl,
})

fastify.route({
  method: 'GET',
  url: '/config.js',
  handler: (_req, res) => {
    res.type('text/javascript')
    return clientConfig
  }
})

export default fastify
