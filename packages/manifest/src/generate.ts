/**
 * Generates a manifest entry for a single asset file.
 * @module
 */

import { relative, resolve } from "@std/path";
import { type ManifestEntry, ManifestError } from "./types.ts";
import { detectAssetType, hashFile, normalizePath } from "@ggpwnkthx/csr-shared";

/**
 * Generates a manifest entry for a build output file.
 * @param originalPath - The original entry point path (relative)
 * @param absOutputFile - The absolute path to the build output
 * @param outdir - The output directory
 */
export async function generateManifestEntry(
  originalPath: string,
  absOutputFile: string,
  outdir: string,
): Promise<ManifestEntry> {
  if (
    originalPath.startsWith("/")
    || originalPath.includes("\\")
    || /^[a-z]:/i.test(originalPath)
  ) {
    throw new ManifestError(
      "originalPath must be relative to project root, not absolute.",
    );
  }
  if (
    originalPath.startsWith("..")
    || originalPath.includes("/..")
    || originalPath.includes("\\..")
  ) {
    throw new ManifestError(
      'originalPath must not escape project root via ".." traversal.',
    );
  }

  const outputPath = resolve(absOutputFile);
  const fileInfo = await Deno.stat(outputPath);
  const hash = await hashFile(outputPath);
  const outputFile = normalizePath(relative(outdir, outputPath));

  return {
    originalPath,
    outputFile,
    size: fileInfo.size,
    hash,
    type: detectAssetType(absOutputFile),
  };
}
