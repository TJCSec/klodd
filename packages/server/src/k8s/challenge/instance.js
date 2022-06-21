import config from '../../config.js'
import { appsV1Api, coreV1Api, customApi, networkingV1Api } from '../api.js'
import { ANNOTATION_TTL, LABEL_INSTANCE, LABEL_POD } from '../const.js'
import { deleteNamespace, getNamespace, getPodsByLabel } from '../util.js'
import challengeResources from './resource.js'
import { remainingTime, scheduleDeletion } from './reaper.js'
import {
  getId,
  getHost,
  getNamespaceName,
  makeCommonLabels,
  makeDeploymentFactory,
  makeNamespaceManifest,
  makeNetworkPolicies,
  makeServiceFactory,
  makeIngressRoute,
  makeIngressRouteTcp,
} from './manifest.js'

export const getInstance = async (challengeId, teamId) => {
  const challengeConfig = challengeResources.get(challengeId)
  const instance = {}

  const namespace = await getNamespace(getNamespaceName(challengeId, teamId))
  if (namespace === undefined) {
    instance.status = 'Stopped'
    return instance
  }

  if (namespace.status.phase === 'Terminating') {
    instance.status = 'Terminating'
    return instance
  }

  const pods = await getPodsByLabel(
    namespace.metadata.name,
    `${LABEL_POD}=${challengeConfig.expose.pod}`
  )
  if (pods === undefined || pods.length === 0) {
    instance.status = 'Unknown'
    return instance
  }

  const status = pods[0].status.phase
  instance.status = status
  const creation = namespace.metadata.creationTimestamp.getTime()
  const ttl = parseInt(namespace.metadata.annotations[ANNOTATION_TTL])
  instance.time = {
    start: creation,
    timeout: ttl,
    remaining: remainingTime(creation, ttl),
  }

  if (status === 'Running' || status === 'Pending') {
    const instanceId = namespace.metadata.labels[LABEL_INSTANCE]
    const kind = challengeConfig.expose.kind
    const host = getHost(challengeId, instanceId)
    instance.server = { kind, host }
    if (kind === 'tcp') {
      instance.server.port = config.traefik.tcpPort
    }
  }

  return instance
}

export const startInstance = async (challengeId, teamId) => {
  const challengeConfig = challengeResources.get(challengeId)

  const instanceId = getId()
  const commonLabels = makeCommonLabels({ challengeId, teamId, instanceId })
  const namespaceName = getNamespaceName(challengeId, teamId)
  const namespaceManifest = makeNamespaceManifest({
    name: namespaceName,
    labels: commonLabels,
    timeout: challengeConfig.timeout,
  })

  const { body: namespace } = await coreV1Api.createNamespace(namespaceManifest)
  scheduleDeletion(namespace.metadata.name, challengeConfig.timeout)

  const networkPolicies = makeNetworkPolicies({
    commonLabels,
    exposedPod: challengeConfig.expose.pod,
    ingressSelector: config.ingress,
  })

  await Promise.all(
    networkPolicies.map((policy) =>
      networkingV1Api.createNamespacedNetworkPolicy(
        namespace.metadata.name,
        policy
      )
    )
  )

  const makeDeployment = makeDeploymentFactory(commonLabels)

  await Promise.all(
    challengeConfig.pods.map((pod) =>
      appsV1Api.createNamespacedDeployment(
        namespace.metadata.name,
        makeDeployment(pod)
      )
    )
  )

  const makeService = makeServiceFactory(commonLabels)

  await Promise.all(
    challengeConfig.pods.map((pod) =>
      coreV1Api.createNamespacedService(
        namespace.metadata.name,
        makeService(pod)
      )
    )
  )

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
}

export const stopInstance = async (challengeId, teamId) => {
  return deleteNamespace(getNamespaceName(challengeId, teamId))
}
