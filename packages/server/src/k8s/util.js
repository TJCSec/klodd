import k8s from '@kubernetes/client-node'
import { coreV1Api } from './api.js'
import { clearDeletion } from './challenge/reaper.js'

export const getPodsByLabel = async (namespace, podLabel) => {
  const { body } = await coreV1Api.listNamespacedPod(
    namespace,
    undefined,
    undefined,
    undefined,
    undefined,
    podLabel
  )
  return body.items
}

export const getNamespacesByLabel = async (namespaceLabel) => {
  const { body } = await coreV1Api.listNamespace(
    undefined,
    undefined,
    undefined,
    undefined,
    namespaceLabel
  )
  return body.items
}

export const getNamespace = async (namespace) => {
  try {
    const { body } = await coreV1Api.readNamespace(namespace)
    return body
  } catch (err) {
    if (err instanceof k8s.HttpError && err.statusCode === 404) {
      return
    }
    throw err
  }
}

export const deleteNamespace = async (namespace) => {
  try {
    await coreV1Api.deleteNamespace(namespace)
    return true
  } catch (err) {
    if (err instanceof k8s.HttpError && err.statusCode === 404) {
      return false
    }
    throw err
  } finally {
    clearDeletion(namespace)
  }
}
