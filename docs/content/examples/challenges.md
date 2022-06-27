# Challenge Examples

This page includes several examples of challenges.

## Test Challenge

This "challenge" simply deploys `traefik/whoami`.

```yaml
apiVersion: "klodd.tjcsec.club/v1"
kind: Challenge
metadata:
  name: test
spec:
  name: Test Challenge
  timeout: 10000
  pods:
    - name: app
      ports:
        - port: 80
      spec:
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
    kind: http
    pod: app
    port: 80
```

## Fruit Store

This is `fruit-store` from TJCTF 2022. The source (including Dockerfile) can be found [here](https://github.com/TJCSec/tjctf-2022-challenges/tree/master/web/fruit-store).

```yaml
apiVersion: "klodd.tjcsec.club/v1"
kind: Challenge
metadata:
  name: fruit-store
spec:
  name: Fruit Store
  timeout: 60000
  pods:
    - name: app
      ports:
        - port: 3000
      spec:
        containers:
          - name: main
            image: fruit-store:latest
            resources:
              requests:
                memory: 100Mi
                cpu: 75m
              limits:
                memory: 250Mi
                cpu: 100m
        automountServiceAccountToken: false
  expose:
    kind: http
    pod: app
    port: 3000
```

## Analects

This is `analects` from TJCTF 2022. The source (including Dockerfile) can be found [here](https://github.com/TJCSec/tjctf-2022-challenges/tree/master/web/analects).

This challenge uses multiple pods, and also includes a startup probe. The `mysql` pod can take several minutes to fully initialize, and the startup probe for `app` will fail during this time, causing it to be unavailable. When the exposed pod is in an unavailable state, the status of the instance remains as "Starting" and the service is unavailable.

```yaml
apiVersion: "klodd.tjcsec.club/v1"
kind: Challenge
metadata:
  name: analects
spec:
  name: Analects
  timeout: 300000
  pods:
    - name: app
      ports:
        - port: 80
      spec:
        containers:
          - name: app
            image: analects-app:latest
            resources:
              requests:
                memory: 100Mi
                cpu: 50m
              limits:
                memory: 200Mi
                cpu: 100m
            startupProbe:
              httpGet:
                path: "/search.php?q=with%20two%20others"
                port: 80
              initialDelaySeconds: 0
              periodSeconds: 5
              failureThreshold: 30
        automountServiceAccountToken: false
    - name: mysql
      ports:
        - port: 3306
      spec:
        containers:
          - name: mysql
            image: analects-mysql:latest
            resources:
              requests:
                memory: 200Mi
                cpu: 50m
              limits:
                memory: 500Mi
                cpu: 100m
        automountServiceAccountToken: false
  expose:
    kind: http
    pod: app
    port: 80
```

## babyheapng

This is `babyheapng` from TJCTF 2022. The source (including Dockerfile) can be found [here](https://github.com/TJCSec/tjctf-2022-challenges/tree/master/pwn/babyheapng).

Note the use of `securityContext.privileged`. This is because this challenge uses [`redpwn/jail`](https://github.com/redpwn/jail).

```yaml
apiVersion: "klodd.tjcsec.club/v1"
kind: Challenge
metadata:
  name: babyheapng
spec:
  name: babyheapng
  timeout: 60000
  pods:
    - name: main
      ports:
        - port: 5000
      spec:
        containers:
          - name: main
            image: babyheapng:latest
            resources:
              requests:
                memory: 100Mi
                cpu: 50m
              limits:
                memory: 200Mi
                cpu: 100m
            securityContext:
              privileged: true
        automountServiceAccountToken: false
  expose:
    kind: tcp
    pod: main
    port: 5000
```
