import path from 'path'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'

import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import fastifyStatic from '@fastify/static'

import config from '../config.js'
import api from './api/index.js'
import jwt from './jwt.js'
import recaptcha from './recaptcha.js'

const production = process.env.NODE_ENV === 'production'

const fastify = Fastify({
  logger: {
    level: production ? 'info' : 'debug',
    transport: production
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
  },
  ignoreTrailingSlash: true,
})

fastify.register(sensible)
fastify.register(jwt)
fastify.register(recaptcha)
fastify.register(api, {
  prefix: '/api',
})

const clientConfig = JSON.stringify({
  publicUrl: config.publicUrl,
  recaptcha: config.recaptcha.siteKey,
  rctfUrl: config.rctfUrl,
})

if (process.env.NODE_ENV === 'production') {
  const dirname = path.dirname(fileURLToPath(import.meta.url))
  const buildPath = path.resolve(dirname, '../../../client/build')
  const indexHtml = path.join(buildPath, 'index.html')
  const indexTemplate = await fs.readFile(indexHtml, 'utf8')
  const rendered = indexTemplate.replace('{{ config }}', clientConfig)

  const handler = async (_req, res) => {
    res.type('text/html; charset=UTF-8')
    return res.send(rendered)
  }

  fastify.get('/', handler)
  fastify.get('/index.html', async (req, res) => res.redirect(301, '/'))
  fastify.setNotFoundHandler(handler)

  fastify.register(fastifyStatic, {
    root: buildPath,
  })
} else {
  fastify.get('/config.js', async (_req, res) => {
    res.type('text/javascript')
    return res.send(`window.config = ${clientConfig}`)
  })
}

export default fastify
