import k8s from '@kubernetes/client-node'
import { appsV1Api, coreV1Api } from './api.js'

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

export const getDeployment = async (namespace, deployment) => {
  try {
    const { body } = await appsV1Api.readNamespacedDeployment(
      deployment,
      namespace
    )
    return body
  } catch (err) {
    if (err instanceof k8s.HttpError && err.statusCode === 404) {
      return null
    }
    throw err
  }
}

export const getNamespace = async (namespace) => {
  try {
    const { body } = await coreV1Api.readNamespace(namespace)
    return body
  } catch (err) {
    if (err instanceof k8s.HttpError && err.statusCode === 404) {
      return null
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
  }
}
