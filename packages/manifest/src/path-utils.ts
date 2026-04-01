/**
 * Shared path validation utilities.
 * @module
 */

export function isAbsolutePath(path: string): boolean {
  return path.startsWith("/") || path.startsWith("\\") || /^[a-z]:[/\\]/i.test(path);
}

export function containsPathTraversal(path: string): boolean {
  return path.includes("/..") || path.includes("\\..");
}
