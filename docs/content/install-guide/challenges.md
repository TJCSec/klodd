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
```

1. The name of the resource is also used in the challenge URL. For example, the page for this challenge is accessible at `/challenge/test`.
2. This is the name displayed on the frontend. It does not have to be related to `metadata.name` in any way.
3. Each instance will be stopped after this many milliseconds. This challenge will run for 10 seconds.
4. The name is used for Deployments and Services corresponding to this Pod.
5. The ports listed here are used to create Services so that pods are accessible via DNS. If, as in this case, the challenge only contains one Pod, then this does not do anything.
6. This is a normal [PodSpec](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.24/#podspec-v1-core).
7. This must be either `http` or `tcp`.
8. This is the name of the Service that will be exposed, and it must match the name given in `spec.pods`.
