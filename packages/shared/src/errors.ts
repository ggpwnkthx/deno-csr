/**
 * Shared error classes for CSR tooling packages.
 * @module
 */

export class BuildError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "BuildError";
  }
}

export class DevServerError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "DevServerError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "ValidationError";
  }
}

export class EntryPointValidationError extends ValidationError {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "EntryPointValidationError";
  }
}

export class OutdirValidationError extends ValidationError {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "OutdirValidationError";
  }
}

export class PortValidationError extends ValidationError {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "PortValidationError";
  }
}
