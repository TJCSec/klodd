import { deleteNamespace, getNamespacesByLabel } from './util.js'
import {
  ANNOTATION_TTL,
  LABEL_MANAGED_BY,
  LABEL_MANAGED_BY_VALUE,
} from './const.js'

import fastify from '../app/fastify.js'

const log = fastify.log.child({ from: 'reaper' })

const scheduledDeletions = new Map()

export const clearDeletion = (namespace) => {
  if (scheduledDeletions.has(namespace)) {
    clearTimeout(scheduledDeletions.get(namespace))
    scheduledDeletions.delete(namespace)
  }
  log.debug({ namespace }, 'deletion cancelled')
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
  log.debug({ namespace, timeout }, 'deletion scheduled')
}

export const remainingTime = (creation, ttl) =>
  Math.max(0, creation + ttl - Date.now())

export const reaper = async () => {
  log.info('running reaper')
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
