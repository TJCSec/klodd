import { deleteNamespace, getNamespacesByLabel } from '../util.js'
import {
  ANNOTATION_TTL,
  LABEL_MANAGED_BY,
  LABEL_MANAGED_BY_VALUE,
} from '../const.js'

const scheduledDeletions = new Map()

export const clearDeletion = (namespace) => {
  if (scheduledDeletions.has(namespace)) {
    clearTimeout(scheduledDeletions.get(namespace))
    scheduledDeletions.delete(namespace)
  }
}

export const scheduleDeletion = (namespace, timeout, update = false) => {
  if (scheduledDeletions.has(namespace)) {
    if (update) {
      clearDeletion(namespace)
    } else {
      return
    }
  }
  scheduledDeletions.set(
    namespace,
    setTimeout(async () => {
      await deleteNamespace(namespace)
      scheduledDeletions.delete(namespace)
    }, timeout)
  )
}

export const remainingTime = (creation, ttl) =>
  Math.max(0, creation + ttl - Date.now())

export const reaper = async () => {
  const namespaces = await getNamespacesByLabel(
    `${LABEL_MANAGED_BY}=${LABEL_MANAGED_BY_VALUE}`
  )
  namespaces.forEach((namespace) => {
    const creation = namespace.metadata.creationTimestamp.getTime()
    const ttl = parseInt(namespace.metadata.annotations[ANNOTATION_TTL], 10)
    scheduleDeletion(
      namespace.metadata.name,
      remainingTime(creation, ttl),
      true
    )
  })
}
