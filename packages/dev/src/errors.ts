/**
 * Error classes for the dev package.
 * @module
 */

export class FileTooLargeError extends Error {
  readonly statusCode = 413;

  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "FileTooLargeError";
  }
}
