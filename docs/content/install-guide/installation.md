# Installation

Once you have completed all the [prerequisites](./prerequisites.md), you are ready to install and run Klodd.

!!! summary "Deployment Steps"
    - Apply the Klodd challenge resource [definition](https://raw.githubusercontent.com/TJCSec/klodd/master/manifests/klodd-crd.yaml)
    - Apply the Klodd [ClusterRole](https://raw.githubusercontent.com/TJCSec/klodd/master/manifests/klodd-rbac.yaml) for RBAC
    - Deploy Klodd
    - Add challenges
!!! example "Applying CRD and ClusterRole"
    ```bash
    # Apply Klodd challenge CRD
    kubectl apply -f https://raw.githubusercontent.com/TJCSec/klodd/master/manifests/klodd-crd.yaml

    # Apply Klodd ClusterRole
    kubectl apply -f https://raw.githubusercontent.com/TJCSec/klodd/master/manifests/klodd-rbac.yaml
    ```

## Deployment

Klodd is available as a [Docker image](https://github.com/TJCSec/klodd/pkgs/container/klodd). Klodd can run outside of a cluster, as long as a kubeconfig is available. However, it is designed to run in the Kubernetes cluster where it will deploy challenges.

Create a ServiceAccount and bind the Klodd ClusterRole to it. Then, create a Deployment for Klodd, and expose it using a Service and Ingress. An example of this is provided [here](../examples/basic.md).

!!! warning "Ratelimiting is recommended"
    Serving Klodd requests can potentially be quite expensive. Though an effort is made to prevent automated requests (using reCAPTCHA), a strict ratelimit is still recommended. Configuring a RateLimit middleware using Traefik is very easy—you can learn how to do this [here](https://doc.traefik.io/traefik/middlewares/http/ratelimit/).

## Configuration

Klodd is configured using YAML files. You can store these in a Kubernetes Secret, then mount the secret to your deployment. More detailed instructions on configuration are provided [here](./configuration.md).

## Challenges

Each challenge is configured using a custom resource. You can apply these manually, but using a tool like [Terraform](https://www.terraform.io/) is highly recommended. More detailed instructions on challenge configuration are provided [here](./challenges.md).
