const config = {
  challengeDomain: 'localhost.direct',
  kubeConfig: 'default',
  port: 5000,
  publicUrl: 'http://localhost:3000',
  rctfUrl: 'https://ctf.tjctf.org',
  recaptcha: {
    siteKey:
      process.env.KLODD_RECAPTCHA_SITE ||
      '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
    secretKey:
      process.env.KLODD_RECAPTCHA_SECRET ||
      '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
  },
  secretKey: 'asdfasdfasdfasdf',
  traefik: {
    httpEntrypoint: 'websecure',
    tcpEntrypoint: 'tcp',
    tcpPort: 1337,
  },
  ingress: {
    namespaceSelector: {
      matchLabels: {
        'kubernetes.io/metadata.name': 'traefik',
      },
    },
    podSelector: {
      matchLabels: {
        'app.kubernetes.io/name': 'traefik',
      },
    },
  },
  reapInterval: 30000,
}

export default config
