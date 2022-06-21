# klodd
CTF challenge per-team instance runner

## klodd is a work in progress, do not use

## high priority
- [x] timeout
- [ ] better config method (yaml file?)
- [x] delete all instances when resource is modified/deleted
- [ ] design better api (response types maybe)
- [ ] more descriptive errors (better than success: true/false)
- [ ] frontend (use swr?)

## medium priority
- [ ] docker
- [ ] test in cluster (config.kubeConfig = 'cluster')
- [ ] better logging
- [ ] support middleware
- [ ] undo spaghetti
- [ ] babel, prettier, eslint maybe

## low priority
- [ ] typescript?
- [ ] clean up @fastify/jwt usage (documentation is very confusing??)
- [ ] better way to query for status than using the exposed pod
