# klodd
CTF challenge per-team instance runner

## klodd is a work in progress, do not use

## high priority
- [ ] timeout
- [ ] better config method (yaml file?)
- [ ] delete all instances when resource is modified/deleted
- [ ] design better api (response types maybe)
- [ ] frontend (use swr?)

## medium priority
- [ ] docker
- [ ] test in cluster (config.kubeConfig = 'cluster')
- [ ] support middleware
- [ ] undo spaghetti
- [ ] babel, prettier, eslint maybe

## low priority
- [ ] typescript?
- [ ] clean up @fastify/jwt usage (documentation is very confusing??)
- [ ] better way to query for status than using the exposed pod
