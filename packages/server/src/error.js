/* eslint-disable max-classes-per-file */

export class KloddError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = this.constructor.name
    this.cause = cause
  }
}

export class InstanceExistsError extends KloddError {}

export class InstanceCreationError extends KloddError {}
