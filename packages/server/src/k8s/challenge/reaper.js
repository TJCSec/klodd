import { deleteNamespace, getNamespacesByLabel } from '../util.js'
import {
  ANNOTATION_TTL,
  LABEL_MANAGED_BY,
  LABEL_MANAGED_BY_VALUE,
} from '../const.js'
import fastify from '../../app/index.js'

const scheduledDeletions = new Map()

export const clearDeletion = (namespace) => {
  if (scheduledDeletions.has(namespace)) {
    clearTimeout(scheduledDeletions.get(namespace))
    scheduledDeletions.delete(namespace)
  }
  fastify.log.debug({ namespace }, 'Deletion cancelled')
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
  fastify.log.debug({ namespace, timeout }, 'Deletion scheduled')
}

export const remainingTime = (creation, ttl) =>
  Math.max(0, creation + ttl - Date.now())

export const reaper = async () => {
  fastify.log.info('Running reaper')
  const namespaces = await getNamespacesByLabel(
    `${LABEL_MANAGED_BY}=${LABEL_MANAGED_BY_VALUE}`
  )
  namespaces.forEach((namespace) => {
    const creation = namespace.metadata.creationTimestamp.getTime()
    const ttl = parseInt(namespace.metadata.annotations[ANNOTATION_TTL], 10)
    const instance = namespace.metadata.name
    const seconds = remainingTime(creation, ttl)
    scheduleDeletion(instance, seconds, true)
  })
}
