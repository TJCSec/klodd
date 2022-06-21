import { coreV1Api, customApi, watch } from '../api.js'
import { LABEL_CHALLENGE } from '../const.js'
import { deleteNamespace } from '../util.js'

const challengeResources = new Map()

const saveApiObj = (apiObj) => {
  const challengeId = apiObj.metadata.name
  challengeResources.set(challengeId, apiObj.spec)
}

const deleteApiObj = (apiObj) => {
  const challengeId = apiObj.metadata.name
  challengeResources.delete(challengeId)
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
  )
}

const subscribeToCluster = async () => {
  const challengeList = (
    await customApi.listClusterCustomObject(
      'klodd.tjcsec.club',
      'v1',
      'challenges'
    )
  ).body
  await Promise.all(challengeList.items.map(saveApiObj))

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
