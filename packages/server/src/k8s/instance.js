import k8s from '@kubernetes/client-node'

import config from '../config.js'
import { InstanceCreationError, InstanceExistsError } from '../error.js'
import { appsV1Api, coreV1Api, customApi, networkingV1Api } from './api.js'
import { LABEL_INSTANCE } from './const.js'
import { deleteNamespace, getDeployment, getNamespace } from './util.js'
import {
  getHost,
  getId,
  getNamespaceName,
  makeCommonLabels,
  makeDeploymentFactory,
  makeIngressRouteFactory,
  makeMiddlewareFactory,
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

  instance.status =
    (deployment.status.availableReplicas ?? 0) > 0 ? 'Running' : 'Starting'

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

export const createInstance = async (challengeId, teamId, log) => {
  const challengeConfig = challengeResources.get(challengeId)

  const instanceId = getId()
  const commonLabels = makeCommonLabels({ challengeId, teamId, instanceId })
  const namespace = getNamespaceName(challengeId, teamId)
  const namespaceManifest = makeNamespaceManifest({
    name: namespace,
    labels: commonLabels,
    timeout: challengeConfig.timeout,
  })

  try {
    await coreV1Api.createNamespace(namespaceManifest).then(({ body }) => {
      log.debug({ body }, 'created Namespace')
    })
  } catch (err) {
    if (err instanceof k8s.HttpError && err.statusCode === 409) {
      throw new InstanceExistsError('Instance is already running', err)
    }
    throw err
  }
  scheduleDeletion(namespace, challengeConfig.timeout)

  const networkPolicies = makeNetworkPolicies({
    commonLabels,
    exposedPod: challengeConfig.expose.pod,
    ingressSelector: config.ingress,
  })

  try {
    await Promise.all(
      networkPolicies.map((policy) =>
        networkingV1Api
          .createNamespacedNetworkPolicy(namespace, policy)
          .then(({ body }) => {
            log.debug({ namespace, body }, 'created NetworkPolicy')
          })
      )
    )
  } catch (err) {
    throw new InstanceCreationError('Could not create network policies', err)
  }

  const makeDeployment = makeDeploymentFactory(commonLabels)

  try {
    await Promise.all(
      challengeConfig.pods.map(makeDeployment).map((deployment) =>
        appsV1Api
          .createNamespacedDeployment(namespace, deployment)
          .then(({ body }) => {
            log.debug({ namespace, body }, 'created Deployment')
          })
      )
    )
  } catch (err) {
    throw new InstanceCreationError('Could not create deployments', err)
  }

  const makeService = makeServiceFactory(commonLabels)

  try {
    await Promise.all(
      challengeConfig.pods.map(makeService).map((service) =>
        coreV1Api
          .createNamespacedService(namespace, service)
          .then(({ body }) => {
            log.debug({ namespace, body }, 'created Service')
          })
      )
    )
  } catch (err) {
    throw new InstanceCreationError('Could not create services', err)
  }

  const makeMiddleware = makeMiddlewareFactory(challengeConfig.expose.kind)
  const middlewarePlural =
    challengeConfig.expose.kind === 'http' ? 'middlewares' : 'middlewaretcps'

  try {
    if (challengeConfig.middlewares?.length > 0) {
      await Promise.all(
        challengeConfig.middlewares.map(makeMiddleware).map((middleware) =>
          customApi
            .createNamespacedCustomObject(
              'traefik.io',
              'v1alpha1',
              namespace,
              middlewarePlural,
              middleware
            )
            .then(({ body }) => {
              log.debug({ namespace, body }, 'created Middleware')
            })
        )
      )
    }
  } catch (err) {
    throw new InstanceCreationError('Could not create middlewares', err)
  }

  const makeIngress = makeIngressRouteFactory(challengeConfig.expose.kind)
  const ingressPlural =
    challengeConfig.expose.kind === 'http'
      ? 'ingressroutes'
      : 'ingressroutetcps'

  try {
    const ingressRoute = makeIngress({
      host: getHost(challengeId, instanceId),
      serviceName: challengeConfig.expose.pod,
      servicePort: challengeConfig.expose.port,
      numMiddlewares: challengeConfig.middlewares?.length ?? 0,
    })
    await customApi
      .createNamespacedCustomObject(
        'traefik.io',
        'v1alpha1',
        namespace,
        ingressPlural,
        ingressRoute
      )
      .then(({ body }) => {
        log.debug({ namespace, body }, 'created IngressRoute')
      })
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

export const deleteInstance = async (challengeId, teamId, log) => {
  const challengeConfig = challengeResources.get(challengeId)
  const namespace = getNamespaceName(challengeId, teamId)
  await deleteNamespace(namespace)
  log.debug({ namespace }, 'deleted Namespace')
  return {
    name: challengeConfig.name,
    status: 'Stopping',
    timeout: challengeConfig.timeout,
  }
}
