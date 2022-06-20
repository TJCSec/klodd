import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'

import config from '../config.js'

const auth = fp(async (fastify, _options) => {
  fastify.register(jwt, {
    secret: config.secretKey,
  })

  fastify.decorate('authenticate', async (req, res) => {
    try {
      await req.jwtVerify()
    } catch (err) {
      res.send(err)
    }
  })
})

export default auth
