/**
 * Normalizes path separators to forward slashes.
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

/**
 * Checks if a path is safe from directory traversal attacks.
 */
export function isPathTraversalSafe(path: string): boolean {
  return !(
    path.startsWith("..")
    || path.includes("/..")
    || path.includes("\\..")
  );
}
