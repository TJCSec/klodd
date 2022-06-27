const schema = {
  type: 'object',
  properties: {
    challengeDomain: { type: 'string' },
    kubeConfig: {
      type: 'string',
      enum: ['default', 'cluster'],
    },
    listen: {
      type: 'object',
    },
    publicUrl: { type: 'string' },
    rctfUrl: { type: 'string' },
    recaptcha: {
      type: 'object',
      properties: {
        siteKey: { type: 'string' },
        secretKey: { type: 'string' },
      },
      required: ['siteKey', 'secretKey'],
    },
    secretKey: { type: 'string' },
    traefik: {
      type: 'object',
      properties: {
        httpEntrypoint: { type: 'string' },
        tcpEntrypoint: { type: 'string' },
        tcpPort: { type: 'integer' },
      },
      required: ['httpEntrypoint', 'tcpEntrypoint', 'tcpPort'],
    },
    ingress: {
      type: 'object',
      properties: {
        ipBlock: {
          type: 'object',
          properties: {
            cidr: { type: 'string' },
            except: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['cidr'],
        },
        namespaceSelector: {
          type: 'object',
          properties: {
            matchExpressions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  operator: { type: 'string' },
                  values: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: ['key', 'operator'],
              },
            },
            matchLabels: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
          },
        },
        podSelector: {
          type: 'object',
          properties: {
            matchExpressions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  operator: { type: 'string' },
                  values: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: ['key', 'operator'],
              },
            },
            matchLabels: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
          },
        },
      },
    },
    reapInterval: { type: 'integer' },
  },
  required: [
    'challengeDomain',
    'kubeConfig',
    'listen',
    'publicUrl',
    'rctfUrl',
    'recaptcha',
    'secretKey',
    'traefik',
    'ingress',
    'reapInterval',
  ],
  additionalProperties: false,
}

export default schema
