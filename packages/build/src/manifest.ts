/**
 * Manifest building and writing utilities.
 * @module
 */

import {
  buildManifest,
  type ManifestEntry,
  type UnkeyedOutputEntry,
  writeManifest,
} from "@ggpwnkthx/csr-manifest";

/**
 * Options for generating the build manifest.
 */
interface GenerateManifestOptions {
  keyedEntries: Record<string, ManifestEntry>;
  unkeyedAssets: UnkeyedOutputEntry[];
  outdir: string;
  generateManifest: boolean;
}

/**
 * Result of generating the build manifest.
 */
interface ManifestResult {
  manifestPath: string | null;
  outputFiles: string[];
}

/**
 * Generates and writes the build manifest.
 */
export async function generateBuildManifest(
  options: GenerateManifestOptions,
): Promise<ManifestResult> {
  const { keyedEntries, unkeyedAssets, outdir, generateManifest } = options;

  let manifestPath: string | null = null;

  if (
    generateManifest
    && (Object.keys(keyedEntries).length > 0 || unkeyedAssets.length > 0)
  ) {
    const manifest = buildManifest(keyedEntries, undefined, unkeyedAssets);
    manifestPath = await writeManifest(manifest, outdir);
  }

  const outputFiles = Object.values(keyedEntries).map((e) => e.outputFile);

  return { manifestPath, outputFiles };
}
