import challengeResources from '../../k8s/challenge/resource.js'
import {
  getInstance,
  startInstance,
  stopInstance,
} from '../../k8s/challenge/instance.js'

const routes = async (fastify, _options) => {
  fastify.addHook('preHandler', fastify.authenticate)
  fastify.addHook('preHandler', (req, res) => {
    if (!challengeResources.has(req.params.challengeId)) {
      res.notFound('Challenge does not exist.')
    }
  })

  fastify.route({
    method: 'GET',
    url: '/:challengeId',
    handler: async (req, _res) => {
      const { challengeId } = req.params
      const teamId = req.user.sub
      return getInstance(challengeId, teamId)
    },
  })

  fastify.route({
    method: 'POST',
    url: '/:challengeId/start',
    handler: async (req, _res) => {
      const { challengeId } = req.params
      const teamId = req.user.sub
      try {
        await startInstance(challengeId, teamId)
        return { success: true }
      } catch (err) {
        fastify.log.error(err)
        return { success: false }
      }
    },
  })

  fastify.route({
    method: 'POST',
    url: '/:challengeId/stop',
    handler: async (req, _res) => {
      const { challengeId } = req.params
      const teamId = req.user.sub
      try {
        await stopInstance(challengeId, teamId)
        return { success: true }
      } catch (err) {
        fastify.log.error(err)
        return { success: false }
      }
    },
  })
}

export default routes
