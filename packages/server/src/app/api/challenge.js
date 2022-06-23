import challengeResources from '../../k8s/challenge/resource.js'
import {
  getInstance,
  createInstance,
  deleteInstance,
} from '../../k8s/challenge/instance.js'
import { InstanceCreationError } from '../../error.js'

const routes = async (fastify, _options) => {
  fastify.addHook('preHandler', async (req, res) => {
    if (!challengeResources.has(req.params.challengeId)) {
      res.notFound('Challenge does not exist')
    }
  })
  fastify.addHook('preHandler', fastify.authenticate)

  fastify.route({
    method: 'GET',
    url: '/:challengeId',
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            status: { type: 'string' },
            timeout: { type: 'integer' },
            server: {
              type: 'object',
              properties: {
                kind: { type: 'string' },
                host: { type: 'string' },
                port: { type: 'integer' },
              },
              required: ['kind', 'host'],
            },
            time: {
              type: 'object',
              properties: {
                start: { type: 'integer' },
                stop: { type: 'integer' },
                remaining: { type: 'integer' },
              },
              required: ['start', 'stop', 'remaining'],
            },
          },
          required: ['name', 'status', 'timeout'],
        },
      },
    },
    handler: async (req, _res) => {
      const { challengeId } = req.params
      const teamId = req.user.sub
      return getInstance(challengeId, teamId)
    },
  })

  fastify.route({
    method: 'POST',
    url: '/:challengeId/create',
    schema: {
      body: {
        type: 'object',
        properties: {
          recaptcha: { type: 'string' },
        },
        required: ['recaptcha'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            status: { type: 'string' },
            timeout: { type: 'integer' },
            server: {
              type: 'object',
              properties: {
                kind: { type: 'string' },
                host: { type: 'string' },
                port: { type: 'integer' },
              },
              required: ['kind', 'host'],
            },
          },
          required: ['name', 'status', 'timeout', 'server'],
        },
      },
    },
    preHandler: [fastify.recaptcha],
    handler: async (req, res) => {
      const { challengeId } = req.params
      const teamId = req.user.sub

      try {
        const instance = await createInstance(challengeId, teamId)
        return instance
      } catch (err) {
        if (err instanceof InstanceCreationError) {
          await deleteInstance(challengeId, teamId)
          return res.conflict(err.message)
        }
        fastify.log.error(err)
        return res.internalServerError('Unknown error creating instance')
      }
    },
  })

  fastify.route({
    method: 'POST',
    url: '/:challengeId/delete',
    schema: {
      body: {
        type: 'object',
        properties: {
          recaptcha: { type: 'string' },
        },
        required: ['recaptcha'],
      },
      response: {
        200: {
          type: 'object',
        },
      },
    },
    preHandler: [fastify.recaptcha],
    handler: async (req, res) => {
      const { challengeId } = req.params
      const teamId = req.user.sub
      try {
        await deleteInstance(challengeId, teamId)
        return {}
      } catch (err) {
        fastify.log.error(err)
        return res.internalServerError('Unknown error deleting instance')
      }
    },
  })
}

export default routes
