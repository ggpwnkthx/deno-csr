import { normalize, resolve } from "@std/path";

/**
 * Resolves a safe file path within the output directory.
 * @param pathname - The URL pathname to resolve
 * @param outdir - The output directory to restrict access to
 */
export function safeFilePath(pathname: string, outdir: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) {
    return null;
  }
  const normalized = normalize(decoded);
  if (normalized.startsWith("..") || normalized.includes("/..")) {
    return null;
  }
  const requestedPath = resolve(outdir, normalized.slice(1));
  const resolvedOutdir = resolve(outdir);
  if (!requestedPath.startsWith(resolvedOutdir)) {
    return null;
  }
  return requestedPath;
}
