import fp from 'fastify-plugin'
import got from 'got'

import config from '../config.js'

const verifyRecaptcha = async (token) =>
  got({
    url: 'https://www.google.com/recaptcha/api/siteverify',
    method: 'POST',
    responseType: 'json',
    resolveBodyOnly: true,
    throwHttpErrors: false,
    form: {
      secret: config.recaptcha.secretKey,
      response: token,
    },
  })

const plugin = fp(async (fastify, _options) => {
  fastify.decorate('recaptcha', async (req, res) => {
    const result = await verifyRecaptcha(req.body.recaptcha)
    if (result.hostname === 'testkey.google.com') {
      req.log.warn('using reCAPTCHA test keys, reCAPTCHA not verified!')
    }
    if (!result.success) {
      res.forbidden('Invalid reCAPTCHA')
    }
  })
})

export default plugin
