export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

export function isPathTraversalSafe(path: string): boolean {
  return !(
    path.startsWith("..")
    || path.includes("/..")
    || path.includes("\\..")
  );
}
