# Prerequisites

There are a number of prerequisites that you must set up before using Klodd.

!!! summary "Before installing Klodd"
    - Add rCTF authentication
    - Obtain a domain name and wildcard TLS certificate
    - Configure a wildcard DNS record
    - Install Traefik

## rCTF

Klodd integrates with [rCTF](https://rctf.redpwn.net/), redpwn's CTF platform. Because [rCTF does not currently support OAuth](https://img.shields.io/badge/PRs-welcome-brightgreen), you must patch in "pseudo-OAuth" functionality. Consider using the following Cloudflare worker on your rCTF domain `/auth*`, replacing `[KLODD_URL]` with Klodd's public URL.

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

You may choose to implement this in a different way. All it needs to do is redirect to `https://[KLODD_URL]/auth` with an rCTF token and the given `state`.

!!! warning
    Be careful if you choose not to use this code. An improper implementation could lead to tokens being stolen.

## Ingress

You must use [Traefik](https://traefik.io/traefik/) as an ingress controller with the [Traefik CRDs](https://doc.traefik.io/traefik/reference/dynamic-configuration/kubernetes-crd/) installed.

Create one entrypoint for web challenges and another for TCP challenges. The web challenge entrypoint should be port 443—Klodd will still function if this is not the case, but the links provided on the frontend will not work properly. The TCP challenge entrypoint can be on any port you like.

A domain and corresponding wildcard TLS certificate are required. Klodd will serve individual instances on subdomains of this domain. You are responsible for properly configuring a wildcard DNS record to point these subdomains at your cluster. Ensure that TLS is properly configured in Traefik as well.
