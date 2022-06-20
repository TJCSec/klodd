import k8s from '@kubernetes/client-node'
import { kubeConfig } from './kubeconfig.js'

export const coreV1Api = kubeConfig.makeApiClient(k8s.CoreV1Api)
export const appsV1Api = kubeConfig.makeApiClient(k8s.AppsV1Api)
export const networkingV1Api = kubeConfig.makeApiClient(k8s.NetworkingV1Api)
export const customApi = kubeConfig.makeApiClient(k8s.CustomObjectsApi)

export const watch = new k8s.Watch(kubeConfig)
