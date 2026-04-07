/**
 * Shared path validation utilities.
 * @module
 */

/**
 * Checks if a path is absolute (Unix, Windows, or drive-letter format).
 */
export function isAbsolutePath(path: string): boolean {
  return path.startsWith("/") || path.startsWith("\\") || /^[a-z]:[/\\]/i.test(path);
}

/**
 * Checks if a path contains parent directory traversal sequences.
 */
export function containsPathTraversal(path: string): boolean {
  return path.includes("/..") || path.includes("\\..");
}
