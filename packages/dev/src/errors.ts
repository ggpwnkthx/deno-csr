/**
 * Error classes for the dev package.
 * @module
 */

/**
 * Error thrown when an HTML file exceeds the maximum allowed size.
 */
export class FileTooLargeError extends Error {
  readonly statusCode = 413;

  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "FileTooLargeError";
  }
}
