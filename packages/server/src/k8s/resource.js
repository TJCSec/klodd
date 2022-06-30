import { coreV1Api, customApi, watch } from './api.js'
import { LABEL_CHALLENGE } from './const.js'
import { deleteNamespace } from './util.js'

import fastify from '../app/fastify.js'

const log = fastify.log.child({ from: 'resource' })

const challengeResources = new Map()

const saveApiObj = (apiObj) => {
  const challengeId = apiObj.metadata.name
  challengeResources.set(challengeId, apiObj.spec)
  log.debug({ spec: apiObj.spec }, 'saved challenge %s', challengeId)
}

const deleteApiObj = (apiObj) => {
  const challengeId = apiObj.metadata.name
  challengeResources.delete(challengeId)
  log.debug('deleted challenge %s', challengeId)
}

const stopAll = async (challengeId) => {
  const label = `${LABEL_CHALLENGE}=${challengeId}`
  const { body } = await coreV1Api.listNamespace(
    undefined,
    undefined,
    undefined,
    undefined,
    label
  )
  return Promise.all(
    body.items.map((namespace) => deleteNamespace(namespace.metadata.name))
  ).then((deleted) => {
    log.debug('stopped %d instances of %s', deleted.length, challengeId)
  })
}

const subscribeToCluster = async () => {
  const challengeList = (
    await customApi.listClusterCustomObject(
      'klodd.tjcsec.club',
      'v1',
      'challenges'
    )
  ).body
  challengeList.items.forEach(saveApiObj)

  log.debug(
    'loaded %d challenges, starting watch at %s',
    challengeList.items.length,
    challengeList.metadata.resourceVersion
  )

  return watch.watch(
    '/apis/klodd.tjcsec.club/v1/challenges',
    {
      resourceVersion: challengeList.metadata.resourceVersion,
    },
    (type, apiObj, _watchObj) => {
      if (type === 'ADDED' || type === 'MODIFIED') {
        saveApiObj(apiObj)
      } else if (type === 'DELETED') {
        deleteApiObj(apiObj)
      }
      stopAll(apiObj.metadata.name)
    },
    (err) => {
      if (err) {
        throw err
      }
      subscribeToCluster() // TODO: is this proper usage?
    }
  )
}
subscribeToCluster()

export default challengeResources
