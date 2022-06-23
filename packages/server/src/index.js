import fastify from './app/index.js'
import config from './config.js'
import { reaper } from './k8s/challenge/reaper.js'

fastify.listen(config.listen, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})

reaper()
setInterval(reaper, config.reapInterval)
