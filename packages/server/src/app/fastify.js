import Fastify from 'fastify'

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

export default fastify
