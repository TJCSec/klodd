# Klodd

Klodd is a service that makes it easy to deploy per-team instances for CTF challenges. Simply create a challenge definition, and Klodd will allow each competitor to launch a new instance for their team on demand.

!!! tip "For Competitors"
    If you're competing in a CTF using Klodd, head over to the [how-to](./how-to.md) for help.

Some CTF challenges, particularly those involving prototype pollution and remote code execution, can potentially allow competitors to interfere with each other, whether out of malice or simply by solving the challenge. In these situations, it can be difficult to deploy challenges in a way that keeps CTFs fun and competitive for everyone. Klodd solves this problem, by giving each team their own deployment that is identical to everyone else's.

Klodd can also be used to save resources. Challenges are not deployed until requested, so there will be nothing running when traffic is low.

Each deployable challenge is represented using a Kubernetes [Custom Resource](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/). This means you can take advantage of the powerful Kubernetes API, and also use existing tools, like [Terraform](https://www.terraform.io/), to manage Klodd challenges.
