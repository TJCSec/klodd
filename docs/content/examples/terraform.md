# Terraform

This example uses [Terraform](https://www.terraform.io/) to configure the [Fruit Store](./challenges.md#fruit-store) challenge.

```tf
resource "kubernetes_manifest" "klodd_fruit_store" {
  manifest = {
    apiVersion = "klodd.tjcsec.club/v1"
    kind       = "Challenge"
    metadata = {
      name      = "fruit-store"
      namespace = "ctf-system" # (1)
    }
    spec = {
      name    = "fruit-store"
      timeout = 60000
      pods = [
        {
          name = "Fruit Store"
          ports = [
            {
              port = 3000
            }
          ]
          spec = {
            containers = [
              {
                name  = "main"
                image = "fruit-store:latest"
                resources = {
                  requests = {
                    memory = "100Mi"
                    cpu    = "75m"
                  }
                  limits = {
                    memory = "250Mi"
                    cpu    = "100m"
                  }
                }
              }
            ]
            automountServiceAccountToken = false
          }
        }
      ]
      expose = {
        kind = "http"
        pod  = "fruit-store"
        port = 3000
      }
    }
  }
}
```

1. Any namespace is fine.
