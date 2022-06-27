# Basic Deployment

The following set of Kubernetes manifests will deploy Klodd to a new namespace called `klodd`, using a sample configuration. Klodd will be deployed to `https://klodd.localhost.direct` which points to `127.0.0.1`, so ensure your ingress controller is accessible on localhost.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: klodd
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: klodd
  namespace: klodd
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: klodd
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: klodd # (1)
subjects:
  - kind: ServiceAccount
    name: klodd
    namespace: klodd
---
apiVersion: v1
kind: Secret
metadata:
  name: klodd
  namespace: klodd
type: Opaque
data: # (2)
  config.yaml: Y2hhbGxlbmdlRG9tYWluOiBsb2NhbGhvc3QuZGlyZWN0Cmt1YmVDb25maWc6IGNsdXN0ZXIKcHVibGljVXJsOiBodHRwczovL2tsb2RkLmxvY2FsaG9zdC5kaXJlY3QKcmN0ZlVybDogaHR0cHM6Ly9jdGYudGpjdGYub3JnCnRyYWVmaWs6CiAgaHR0cEVudHJ5cG9pbnQ6IHdlYnNlY3VyZQogIHRjcEVudHJ5cG9pbnQ6IHRjcAogIHRjcFBvcnQ6IDEzMzcKaW5ncmVzczoKICBuYW1lc3BhY2VTZWxlY3RvcjoKICAgIG1hdGNoTGFiZWxzOgogICAgICBrdWJlcm5ldGVzLmlvL21ldGFkYXRhLm5hbWU6IHRyYWVmaWsKICBwb2RTZWxlY3RvcjoKICAgIG1hdGNoTGFiZWxzOgogICAgICBhcHAua3ViZXJuZXRlcy5pby9uYW1lOiB0cmFlZmlrCnNlY3JldEtleTogInJhbmRvbWx5IGdlbmVyYXRlZCBzZWNyZXQga2V5IgpyZWNhcHRjaGE6CiAgc2l0ZUtleTogNkxlSXhBY1RBQUFBQUpjWlZScXlIaDcxVU1JRUdOUV9NWGppWktoSQogIHNlY3JldEtleTogNkxlSXhBY1RBQUFBQUdHLXZGSTFUblJXeE1aTkZ1b2pKNFdpZkpXZQo=
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: klodd
  namespace: klodd
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: klodd
  template:
    metadata:
      labels:
        app.kubernetes.io/name: klodd
    spec:
      serviceAccountName: klodd
      securityContext:
        runAsUser: 65534
        runAsGroup: 65534
      volumes:
        - name: config
          secret:
            secretName: klodd
      containers:
        - name: klodd
          image: ghcr.io/tjcsec/klodd:master
          imagePullPolicy: Always
          volumeMounts:
            - name: config
              mountPath: /app/config/
              readOnly: true
          ports:
            - name: public
              containerPort: 5000
          resources:
            limits:
              memory: 1000Mi
              cpu: 1000m
---
apiVersion: v1
kind: Service
metadata:
  name: klodd
  namespace: klodd
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: klodd
  ports:
    - name: public
      port: 5000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: klodd
  namespace: klodd
spec:
  rules:
    - host: klodd.localhost.direct
      http:
        paths:
          - backend:
              service:
                name: klodd
                port:
                  number: 5000
            path: /
            pathType: ImplementationSpecific
```

1. You must first apply the Klodd [ClusterRole](https://raw.githubusercontent.com/TJCSec/klodd/master/manifests/klodd-rbac.yaml)—instructions for how to do this are provided [here](../install-guide/installation.md).
2. The decoded contents are provided below.

Here are the contents of `config.yaml`:

```yaml
challengeDomain: localhost.direct # (1)
kubeConfig: cluster
publicUrl: https://klodd.localhost.direct
rctfUrl: https://ctf.tjctf.org # (2)
traefik: # (3)
  httpEntrypoint: websecure
  tcpEntrypoint: tcp
  tcpPort: 1337
ingress: # (4)
  namespaceSelector:
    matchLabels:
      kubernetes.io/metadata.name: traefik
  podSelector:
    matchLabels:
      app.kubernetes.io/name: traefik
secretKey: "randomly generated secret key"
recaptcha: # (5)
  siteKey: 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
  secretKey: 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

1. A wildcard TLS certificate for `localhost.direct` is publicly available [here](https://get.localhost.direct/).
2. At the time of writing, `https://ctf.tjctf.org/auth` allows redirecting to `https://klodd.localhost.direct/auth`, but this is subject to change in the future.
3. Ensure this configuration matches your Traefik installation. See [Configuration](../install-guide/configuration.md#traefik) for more information.
4. Ensure this configuration matches your Traefik installation. See [Configuration](../install-guide/configuration.md#traefik) for more information.
5. These are the [reCAPTCHA v2 test keys](https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do).
