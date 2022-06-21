import crypto from 'crypto'

import config from '../../config.js'
import { appsV1Api, coreV1Api, customApi, networkingV1Api } from '../api.js'
import { ANNOTATION_TTL, LABEL_CHALLENGE, LABEL_EGRESS, LABEL_INSTANCE, LABEL_MANAGED_BY, LABEL_MANAGED_BY_VALUE, LABEL_POD, LABEL_TEAM } from '../const.js'
import { deleteNamespace, getNamespace, getPodsByLabel } from '../util.js'
import { remainingTime, scheduleDeletion } from './reaper.js'
import challengeResources from './resource.js'

const getId = () => crypto.randomBytes(8).toString('hex')
const getHost = (challengeId, instanceId) => `${challengeId}-${instanceId}.${config.challengeDomain}`
const getNamespaceName = (challengeId, teamId) => `klodd-${challengeId}-${teamId}`

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

  const pods = await getPodsByLabel(namespace.metadata.name, `${LABEL_POD}=${challengeConfig.expose.pod}`)
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
  const commonLabels = {
    [LABEL_CHALLENGE]: challengeId,
    [LABEL_TEAM]: teamId,
    [LABEL_INSTANCE]: instanceId,
    [LABEL_MANAGED_BY]: LABEL_MANAGED_BY_VALUE,
  }
  const namespaceManifest = {
    metadata: {
      name: getNamespaceName(challengeId, teamId),
      labels: commonLabels,
      annotations: { [ANNOTATION_TTL]: challengeConfig.timeout.toString() },
    },
  }

  const { body: namespace } = await coreV1Api.createNamespace(namespaceManifest)
  scheduleDeletion(namespace.metadata.name, challengeConfig.timeout)

  const networkPolicies = [
    {
      metadata: { name: 'isolate-network' },
      spec: {
        podSelector: {},
        policyTypes: ['Ingress', 'Egress'],
        ingress: [
          {
            from: [{ namespaceSelector: { matchLabels: commonLabels } }],
          },
        ],
        egress: [
          {
            to: [{ namespaceSelector: { matchLabels: commonLabels } }],
          },
          {
            to: [{ namespaceSelector: { matchLabels: { name: 'kube-system' } } }],
            ports: [
              {
                protocol: 'UDP',
                port: 53,
              },
            ],
          },
        ],
      }
    },
    {
      metadata: { name: 'allow-ingress' },
      spec: {
        podSelector: {
          matchLabels: { [LABEL_POD]: challengeConfig.expose.pod },
        },
        policyTypes: ['Ingress'],
        ingress: [{ from: [config.ingress] }],
      },
    },
    {
      metadata: { name: 'allow-egress' },
      spec: {
        podSelector: {
          matchLabels: { [LABEL_EGRESS]: 'true' },
        },
        policyTypes: ['Egress'],
        egress: [
          {
            to: [
              {
                ipBlock: {
                  cidr: '0.0.0.0/0',
                  except: ['10.0.0.0/8', '192.168.0.0/16', '172.16.0.0/20'],
                },
              },
            ],
          },
        ],
      },
    },
  ]

  await Promise.all(networkPolicies.map(policy => (
    networkingV1Api.createNamespacedNetworkPolicy(
      namespace.metadata.name, policy
    )
  )))

  const makeDeployment = ({ name, egress, spec }) => ({
    metadata: {
      name: `${challengeId}-${name}`,
      labels: {
        [LABEL_POD]: name,
        ...commonLabels,
      },
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          [LABEL_POD]: name,
          ...commonLabels,
        },
      },
      template: {
        metadata: {
          labels: {
            [LABEL_POD]: name,
            [LABEL_EGRESS]: (egress ?? false).toString(),
            ...commonLabels,
          },
        },
        spec
      }
    }
  })

  await Promise.all(challengeConfig.pods.map((pod) => (
    appsV1Api.createNamespacedDeployment(
      namespace.metadata.name, makeDeployment(pod)
    )
  )))

  const makeService = ({ name, ports }) => ({
    metadata: {
      name,
      labels: {
        [LABEL_POD]: name,
        ...commonLabels,
      },
    },
    spec: {
      selector: {
        [LABEL_POD]: name,
        ...commonLabels,
      },
      ports: ports.map(({ port, protocol }) => ({
        name: `port-${port}`,
        protocol: protocol ?? 'TCP',
        port,
      })),
    },
  })

  await Promise.all(challengeConfig.pods.map((pod) => (
    coreV1Api.createNamespacedService(
      namespace.metadata.name, makeService(pod)
    )
  )))

  if (challengeConfig.expose.kind === 'http') {
    const ingressRoute = {
      apiVersion: 'traefik.containo.us/v1alpha1',
      kind: 'IngressRoute',
      metadata: { name: 'ingress' },
      spec: {
        entryPoints: [config.traefik.httpEntrypoint],
        routes: [
          {
            kind: 'Rule',
            match: `Host(\`${getHost(challengeId, instanceId)}\`)`,
            services: [
              {
                kind: 'Service',
                name: challengeConfig.expose.pod,
                port: challengeConfig.expose.port,
              }
            ]
          }
        ],
        tls: {},
      },
    }
    await customApi.createNamespacedCustomObject(
      'traefik.containo.us', 'v1alpha1',
      namespace.metadata.name, 'ingressroutes',
      ingressRoute
    )
  } else { // challengeConfig.expose.kind === 'tcp'
    const ingressRoute = {
      apiVersion: 'traefik.containo.us/v1alpha1',
      kind: 'IngressRouteTCP',
      metadata: { name: 'ingress' },
      spec: {
        entryPoints: [config.traefik.tcpEntrypoint],
        routes: [
          {
            kind: 'Rule',
            match: `HostSNI(\`${getHost(challengeId, instanceId)}\`)`,
            services: [
              {
                kind: 'Service',
                name: challengeConfig.expose.pod,
                port: challengeConfig.expose.port,
              }
            ]
          }
        ],
        tls: {},
      },
    }
    await customApi.createNamespacedCustomObject(
      'traefik.containo.us', 'v1alpha1',
      namespace.metadata.name, 'ingressroutetcps',
      ingressRoute
    )
  }
}

export const stopInstance = async (challengeId, teamId) => {
  return deleteNamespace(getNamespaceName(challengeId, teamId))
}
