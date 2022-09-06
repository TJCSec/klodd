# Challenges

Refer to the [examples](../examples/challenges.md) and [CRD schema](https://raw.githubusercontent.com/TJCSec/klodd/master/manifests/klodd-crd.yaml) for more information.

```yaml
apiVersion: "klodd.tjcsec.club/v1"
kind: Challenge
metadata:
  name: test # (1)
spec:
  name: Test Challenge # (2)
  timeout: 10000 # (3)
  pods:
    - name: app # (4)
      ports: # (5)
        - port: 80
      spec: # (6)
        containers:
          - name: main
            image: traefik/whoami:latest
            resources:
              requests:
                memory: 100Mi
                cpu: 75m
              limits:
                memory: 250Mi
                cpu: 100m
        automountServiceAccountToken: false
  expose:
    kind: http # (7)
    pod: app # (8)
    port: 80
  middlewares: # (9)
    - contentType:
        autoDetect: false
    - rateLimit:
        average: 5
        burst: 10
```

1. The name of the resource is also used in the challenge URL. For example, the page for this challenge is accessible at `/challenge/test`.
2. This is the name displayed on the frontend. It does not have to be related to `metadata.name` in any way.
3. Each instance will be stopped after this many milliseconds. This challenge will run for 10 seconds.
4. The name is used for Deployments and Services corresponding to this Pod.
5. The ports listed here are used to create Services. Each Pod must have at least one port.
6. This is a normal [PodSpec](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.24/#podspec-v1-core).
7. This must be either `http` or `tcp`.
8. This is the name of the Service that will be exposed, and it must match the name given in `spec.pods`.
9. Each object in this array will be turned into a [Middleware](https://doc.traefik.io/traefik/routing/providers/kubernetes-crd/#kind-middleware) or [MiddlewareTCP](https://doc.traefik.io/traefik/routing/providers/kubernetes-crd/#kind-middlewaretcp) if `expose.kind` is `http` or `tcp`, respectively. Refer to the Traefik documentation for instructions on configuring these.
