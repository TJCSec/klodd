import Fastify from 'fastify'
import hyperid from 'hyperid'

const production = process.env.NODE_ENV === 'production'

const fastify = Fastify({
  logger: {
    level: config.logLevel ?? (production ? 'info' : 'debug'),
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
  genReqId: hyperid(),
})

export default fastify
