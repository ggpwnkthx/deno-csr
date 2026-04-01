/**
 * Shared error classes for CSR tooling packages.
 * @module
 */

/**
 * Error thrown when a production build fails.
 */
export class BuildError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "BuildError";
  }
}

/**
 * Error thrown when the development server encounters an error.
 */
export class DevServerError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "DevServerError";
  }
}

/**
 * Error thrown when option validation fails.
 */
export class ValidationError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when entry point validation fails.
 */
export class EntryPointValidationError extends ValidationError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "EntryPointValidationError";
  }
}

/**
 * Error thrown when outdir validation fails.
 */
export class OutdirValidationError extends ValidationError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "OutdirValidationError";
  }
}

/**
 * Error thrown when port validation fails.
 */
export class PortValidationError extends ValidationError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "PortValidationError";
  }
}
