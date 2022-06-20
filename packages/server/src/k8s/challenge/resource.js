import { customApi, watch } from '../api.js'

const challengeResources = new Map()

const saveApiObj = (apiObj) => {
  const name = apiObj.metadata.name
  challengeResources.set(name, apiObj.spec)
}

const deleteApiObj = (apiObj) => {
  const name = apiObj.metadata.name
  challengeResources.delete(name)
}

const subscribeToCluster = async () => {
  const challengeList = (await customApi.listClusterCustomObject('klodd.tjcsec.club', 'v1', 'challenges')).body
  challengeList.items.forEach(saveApiObj)

  return watch.watch('/apis/klodd.tjcsec.club/v1/challenges',
    {
      resourceVersion: challengeList.metadata.resourceVersion,
    },
    (type, apiObj, _watchObj) => {
      if (type === 'ADDED' || type === 'MODIFIED') {
        saveApiObj(apiObj)
      } else if (type === 'DELETED') {
        deleteApiObj(apiObj)
      }
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
