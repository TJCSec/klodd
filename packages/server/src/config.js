const config = {
  challengeDomain: 'tjc.tf',
  kubeConfig: 'default',
  port: 5000,
  rctfUrl: 'https://ctf.tjctf.org',
  recaptcha: {
    siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
    secretKey: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
  },
  secretKey: 'asdfasdfasdfasdf',
  traefik: {
    httpEntrypoint: 'websecure',
    tcpEntrypoint: 'tcp',
    tcpPort: 31337,
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
