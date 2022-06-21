import { getTeam } from '../../rctf.js'

const routes = async (fastify, _options) => {
  fastify.route({
    method: 'POST',
    url: '/auth',
    schema: {
      body: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
          },
        },
        required: ['token'],
      },
    },
    handler: async (req, res) => {
      const { token } = req.body
      const team = await getTeam(token)
      if (team === undefined) {
        return res.unauthorized('Invalid rCTF token.')
      }
      const kloddToken = fastify.jwt.sign({ sub: team.id })
      return { token: kloddToken }
    },
  })
}

export default routes
