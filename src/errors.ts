
export class InvalidSchemeError extends Error {
  constructor() {
    super('Invalid Scheme');
    this.name = 'InvalidSchemeError'
  }
}

export class InvalidPathLengthError extends Error {
  constructor() {
    super('Invalid Path');
    this.name = 'InvalidPathLengthError'
  }
}

export class InvalidTypeError extends Error {
  constructor() {
    super('Invalid Type');
    this.name = 'InvalidTypeError'
  }
}

export class InvalidSequenceComponentError extends Error {
  constructor() {
    super('Invalid Sequence Component');
    this.name = 'InvalidSequenceComponentError'
  }
}

export class InvalidChecksumError extends Error {
  constructor() {
    super('Invalid Checksum');
    this.name = 'InvalidChecksumError'
  }
}
