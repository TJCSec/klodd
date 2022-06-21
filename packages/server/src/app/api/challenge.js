import challengeResources from '../../k8s/challenge/resource.js'
import {
  getInstance,
  createInstance,
  deleteInstance,
} from '../../k8s/challenge/instance.js'
import { InstanceCreationError } from '../../error.js'

const routes = async (fastify, _options) => {
  fastify.addHook('preHandler', fastify.authenticate)
  fastify.addHook('preHandler', async (req, res) => {
    if (!challengeResources.has(req.params.challengeId)) {
      res.notFound('Challenge does not exist.')
    }
  })

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
            time: {
              type: 'object',
              properties: {
                start: { type: 'integer' },
                timeout: { type: 'integer' },
                remaining: { type: 'integer' },
              },
            },
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
          required: ['name', 'status', 'time'],
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
    url: '/:challengeId',
    handler: async (req, res) => {
      const { challengeId } = req.params
      const teamId = req.user.sub
      try {
        const instance = await createInstance(challengeId, teamId)
        res.code(201)
        return instance
      } catch (err) {
        if (err instanceof InstanceCreationError) {
          return res.conflict(err.message)
        }
        fastify.log.error(err)
        return res.internalServerError('Unknown error creating instance.')
      }
    },
  })

  fastify.route({
    method: 'DELETE',
    url: '/:challengeId',
    handler: async (req, res) => {
      const { challengeId } = req.params
      const teamId = req.user.sub
      try {
        await deleteInstance(challengeId, teamId)
        res.code(204)
        return undefined
      } catch (err) {
        fastify.log.error(err)
        return res.internalServerError('Unknown error deleting instance.')
      }
    },
  })
}

export default routes
