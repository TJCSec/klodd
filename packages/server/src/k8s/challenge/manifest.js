import crypto from 'crypto'

import config from '../../config.js'
import {
  ANNOTATION_TTL,
  LABEL_CHALLENGE,
  LABEL_EGRESS,
  LABEL_INSTANCE,
  LABEL_MANAGED_BY,
  LABEL_MANAGED_BY_VALUE,
  LABEL_POD,
  LABEL_TEAM,
} from '../const.js'

export const getId = () => crypto.randomBytes(8).toString('hex')
export const getHost = (challengeId, instanceId) =>
  `${challengeId}-${instanceId}.${config.challengeDomain}`
export const getNamespaceName = (challengeId, teamId) =>
  `klodd-${challengeId}-${teamId}`

export const makeCommonLabels = ({ challengeId, teamId, instanceId }) => ({
  [LABEL_CHALLENGE]: challengeId,
  [LABEL_TEAM]: teamId,
  [LABEL_INSTANCE]: instanceId,
  [LABEL_MANAGED_BY]: LABEL_MANAGED_BY_VALUE,
})

export const makeNamespaceManifest = ({ name, labels, timeout }) => ({
  metadata: {
    name,
    labels,
    annotations: { [ANNOTATION_TTL]: timeout.toString() },
  },
})

export const makeNetworkPolicies = ({
  commonLabels,
  exposedPod,
  ingressSelector,
}) => [
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
    },
  },
  {
    metadata: { name: 'allow-ingress' },
    spec: {
      podSelector: {
        matchLabels: { [LABEL_POD]: exposedPod },
      },
      policyTypes: ['Ingress'],
      ingress: [{ from: [ingressSelector] }],
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

export const makeDeploymentFactory =
  (commonLabels) =>
  ({ name, egress, spec }) => ({
    metadata: {
      name,
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
        spec,
      },
    },
  })

export const makeServiceFactory =
  (commonLabels) =>
  ({ name, ports }) => ({
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

export const makeIngressRoute = ({
  host,
  entryPoint,
  serviceName,
  servicePort,
}) => ({
  apiVersion: 'traefik.containo.us/v1alpha1',
  kind: 'IngressRoute',
  metadata: { name: 'ingress' },
  spec: {
    entryPoints: [entryPoint],
    routes: [
      {
        kind: 'Rule',
        match: `Host(\`${host}\`)`,
        services: [
          {
            kind: 'Service',
            name: serviceName,
            port: servicePort,
          },
        ],
      },
    ],
    tls: {},
  },
})

export const makeIngressRouteTcp = ({
  host,
  entryPoint,
  serviceName,
  servicePort,
}) => ({
  apiVersion: 'traefik.containo.us/v1alpha1',
  kind: 'IngressRouteTCP',
  metadata: { name: 'ingress' },
  spec: {
    entryPoints: [entryPoint],
    routes: [
      {
        kind: 'Rule',
        match: `HostSNI(\`${host}\`)`,
        services: [
          {
            kind: 'Service',
            name: serviceName,
            port: servicePort,
          },
        ],
      },
    ],
    tls: {},
  },
})
