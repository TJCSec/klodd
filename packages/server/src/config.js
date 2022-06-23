import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import yaml from 'yaml'
import deepmerge from 'deepmerge'

import Ajv from 'ajv'
import betterAjvErrors from 'better-ajv-errors'
import schema from './config.schema.js'

const ajv = new Ajv()
const validate = ajv.compile(schema)

const defaults = {
  kubeConfig: 'cluster',
  listen: {
    host: '0.0.0.0',
    port: 5000,
  },
  recaptcha: {
    siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
    secretKey: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
  },
  reapInterval: 30000,
}

const findConfig = () => {
  const dirname = path.dirname(fileURLToPath(import.meta.url))
  const configPath = path.resolve(dirname, '../../../config')
  if (fs.existsSync(configPath)) {
    return configPath
  }
  return null
}

const configPath = process.env.KLODD_CONFIG ?? findConfig()
let files = []
if (configPath) {
  files = fs
    .readdirSync(configPath)
    .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
    .sort((a, b) => a.localeCompare(b))
    .map((file) =>
      yaml.parse(fs.readFileSync(path.resolve(configPath, file), 'utf8'))
    )
    .filter((c) => c !== null)
}

const config = deepmerge.all([defaults, ...files])
if (!validate(config)) {
  const output = betterAjvErrors(schema, config, validate.errors, { indent: 2 })
  // eslint-disable-next-line no-console
  console.log(output)
  process.exit(1)
}

export default config
