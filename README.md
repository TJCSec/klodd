# klodd
CTF challenge per-team instance runner

# klodd is a work in progress, do not use

## high priority
- [x] timeout
- [ ] better config method (yaml file?)
- [x] delete all instances when resource is modified/deleted
- [x] more descriptive errors (better than success: true/false)
- [ ] ~~frontend (use swr?)~~ refactor frontend
- [ ] recaptcha
- [ ] docker
- [ ] test in cluster (config.kubeConfig = 'cluster')
- [ ] better logging

## medium priority
- [ ] design better api (response types maybe)
- [ ] support middleware
- [ ] undo spaghetti
- [ ] babel, ~~prettier, eslint~~ maybe
- [ ] testing lmao (jest probably)
- [ ] handle not ready status

## low priority
- [ ] typescript?
- [ ] clean up @fastify/jwt usage (documentation is very confusing??)
- [ ] better way to query for status than using the exposed pod
- [x] toasts?

## Installation

Klodd requires serveral components to function properly.

### rCTF
Klodd integrates with [rCTF](https://github.com/redpwn/rctf). Because rCTF does not currently support OAuth, you must patch in "pseudo-OAuth" functionality. Consider using the following Cloudflare worker on `/auth*`, replacing `[KLODD_URL]` with klodd's public URL. *thanks, ginkoid, for writing this*

```js
const renderAuthPage = uri => `<!doctype html>
<script>
const token = localStorage.token
const state = new URL(location).searchParams.get('state')
if (state && token) {
  location = \`${uri}?state=\${encodeURIComponent(state)}&token=\${encodeURIComponent(token)}\`
} else {
  location = '/login'
}
</script>
`

const redirectUris = ['https://[KLODD_URL]/auth']

const handle = req => {
  const url = new URL(req.url)
  const redirectUri = url.searchParams.get('redirect_uri')
  if (!redirectUris.includes(redirectUri)) {
    return new Response(null, { status: 400 })
  }
  return new Response(renderAuthPage(redirectUri), {
    headers: { 'content-type': 'text/html' }
  })
}

addEventListener('fetch', evt => evt.respondWith(handle(evt.request)))
```

### Domain
A domain for challenges is required. Create a wildcard DNS entry pointing to your ingress controller. You will also need a TLS certificate with this wildcard as its subject—consider issuing one with LetsEncrypt.

### Ingress
You must use [Traefik](https://traefik.io/traefik/) as an ingress controller with the [Traefik CRDs](https://doc.traefik.io/traefik/reference/dynamic-configuration/kubernetes-crd/) installed. Create one entrypoint for HTTP challenges and another for TCP challenges. We recommend 443 and 1337, respectively. Ensure that your TLS certificates are correctly configured.

### Custom Resource Definitions
Each challenge is configured using a custom resource. Before you can do this, you must apply the [definitions](manifests/klodd-crd.yaml).

### Running Klodd
**There is currently no Docker build available, and Klodd has not been tested in-cluster.**

## Configuration
**Configuration is currently not possible.** It will most likely be through YAML/JSON files mounted from secrets.

## Deploying Challenges
Each instanced challenge is stored as a custom resource. Refer to the schema in the resource definition. If you are using Terraform, you can use `kubernetes_manifest` for this.
