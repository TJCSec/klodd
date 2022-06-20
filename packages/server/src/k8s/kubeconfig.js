import k8s from '@kubernetes/client-node'
import config from '../config.js'

export const kubeConfig = new k8s.KubeConfig()

if (config.kubeConfig === 'cluster') {
  kubeConfig.loadFromCluster()
} else {
  kubeConfig.loadFromDefault()
}
