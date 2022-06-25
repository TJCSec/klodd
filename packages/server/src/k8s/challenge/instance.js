import k8s from '@kubernetes/client-node'

import config from '../../config.js'
import { InstanceCreationError } from '../../error.js'
import { appsV1Api, coreV1Api, customApi, networkingV1Api } from '../api.js'
import { LABEL_INSTANCE } from '../const.js'
import { deleteNamespace, getDeployment, getNamespace } from '../util.js'
import {
  getHost,
  getId,
  getNamespaceName,
  makeCommonLabels,
  makeDeploymentFactory,
  makeIngressRoute,
  makeIngressRouteTcp,
  makeNamespaceManifest,
  makeNetworkPolicies,
  makeServiceFactory,
} from './manifest.js'
import { remainingTime, scheduleDeletion } from './reaper.js'
import challengeResources from './resource.js'

export const getServer = (challengeId, instanceId, kind) => {
  const server = {
    kind,
    host: getHost(challengeId, instanceId),
  }
  if (kind === 'tcp') {
    server.port = config.traefik.tcpPort
  }
  return server
}

export const getInstance = async (challengeId, teamId) => {
  const challengeConfig = challengeResources.get(challengeId)
  const instance = {
    name: challengeConfig.name,
    status: '',
    timeout: challengeConfig.timeout,
  }

  const namespace = await getNamespace(getNamespaceName(challengeId, teamId))
  if (namespace === null) {
    instance.status = 'Stopped'
    return instance
  }

  if (namespace.status.phase === 'Terminating') {
    instance.status = 'Stopping'
    return instance
  }

  const deployment = await getDeployment(
    namespace.metadata.name,
    challengeConfig.expose.pod
  )
  if (deployment === null) {
    instance.status = 'Unknown'
    return instance
  }

  const status =
    (deployment.status.availableReplicas ?? 0) > 0 ? 'Running' : 'Starting'
  instance.status = status

  const instanceId = namespace.metadata.labels[LABEL_INSTANCE]
  const { kind } = challengeConfig.expose
  instance.server = getServer(challengeId, instanceId, kind)

  const creation = namespace.metadata.creationTimestamp.getTime()
  const ttl = challengeConfig.timeout
  const time = {
    start: creation,
    stop: creation + ttl,
    remaining: remainingTime(creation, ttl),
  }
  instance.time = time

  return instance
}

export const createInstance = async (challengeId, teamId) => {
  const challengeConfig = challengeResources.get(challengeId)

  const instanceId = getId()
  const commonLabels = makeCommonLabels({ challengeId, teamId, instanceId })
  const namespaceName = getNamespaceName(challengeId, teamId)
  const namespaceManifest = makeNamespaceManifest({
    name: namespaceName,
    labels: commonLabels,
    timeout: challengeConfig.timeout,
  })

  let apiResponse
  try {
    apiResponse = await coreV1Api.createNamespace(namespaceManifest)
  } catch (err) {
    if (err instanceof k8s.HttpError && err.statusCode === 409) {
      throw new InstanceCreationError('Instance is already running', err)
    }
    throw err
  }
  const namespace = apiResponse.body
  scheduleDeletion(namespace.metadata.name, challengeConfig.timeout)

  const networkPolicies = makeNetworkPolicies({
    commonLabels,
    exposedPod: challengeConfig.expose.pod,
    ingressSelector: config.ingress,
  })

  try {
    await Promise.all(
      networkPolicies.map((policy) =>
        networkingV1Api.createNamespacedNetworkPolicy(
          namespace.metadata.name,
          policy
        )
      )
    )
  } catch (err) {
    throw new InstanceCreationError('Could not create network policies', err)
  }

  const makeDeployment = makeDeploymentFactory(commonLabels)

  try {
    await Promise.all(
      challengeConfig.pods.map((pod) =>
        appsV1Api.createNamespacedDeployment(
          namespace.metadata.name,
          makeDeployment(pod)
        )
      )
    )
  } catch (err) {
    throw new InstanceCreationError('Could not create deployments', err)
  }

  const makeService = makeServiceFactory(commonLabels)

  try {
    await Promise.all(
      challengeConfig.pods.map((pod) =>
        coreV1Api.createNamespacedService(
          namespace.metadata.name,
          makeService(pod)
        )
      )
    )
  } catch (err) {
    throw new InstanceCreationError('Could not create services', err)
  }

  try {
    if (challengeConfig.expose.kind === 'http') {
      const ingressRoute = makeIngressRoute({
        host: getHost(challengeId, instanceId),
        entryPoint: config.traefik.httpEntrypoint,
        serviceName: challengeConfig.expose.pod,
        servicePort: challengeConfig.expose.port,
      })
      await customApi.createNamespacedCustomObject(
        'traefik.containo.us',
        'v1alpha1',
        namespace.metadata.name,
        'ingressroutes',
        ingressRoute
      )
    } else {
      // challengeConfig.expose.kind === 'tcp'
      const ingressRouteTcp = makeIngressRouteTcp({
        host: getHost(challengeId, instanceId),
        entryPoint: config.traefik.tcpEntrypoint,
        serviceName: challengeConfig.expose.pod,
        servicePort: challengeConfig.expose.port,
      })
      await customApi.createNamespacedCustomObject(
        'traefik.containo.us',
        'v1alpha1',
        namespace.metadata.name,
        'ingressroutetcps',
        ingressRouteTcp
      )
    }
  } catch (err) {
    throw new InstanceCreationError('Could not create ingress', err)
  }

  return {
    name: challengeConfig.name,
    status: 'Starting',
    timeout: challengeConfig.timeout,
    server: getServer(challengeId, instanceId, challengeConfig.expose.kind),
  }
}

export const deleteInstance = async (challengeId, teamId) => {
  const challengeConfig = challengeResources.get(challengeId)
  await deleteNamespace(getNamespaceName(challengeId, teamId))
  return {
    name: challengeConfig.name,
    status: 'Stopping',
    timeout: challengeConfig.timeout,
  }
}
