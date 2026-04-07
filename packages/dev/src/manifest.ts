/**
 * Development manifest generation utilities.
 *
 * Wraps `generateBuildManifest` from `csr-build` and adds `manifestContent`
 * caching so the JSON string does not need to be re-read from disk on each
 * `GET /@manifest` request.
 * @module
 */

import { generateBuildManifest } from "@ggpwnkthx/csr-build";
import { buildManifest } from "@ggpwnkthx/csr-manifest";
import type { ManifestEntry, UnkeyedOutputEntry } from "@ggpwnkthx/csr-manifest";

interface GenerateManifestOptions {
  keyedEntries: Record<string, ManifestEntry>;
  unkeyedAssets: UnkeyedOutputEntry[];
  outdir: string;
  generateManifest: boolean;
}

interface ManifestResult {
  manifestPath: string | null;
  manifestContent: string | null;
}

export async function generateDevManifest(
  options: GenerateManifestOptions,
): Promise<ManifestResult> {
  const { keyedEntries, unkeyedAssets, outdir, generateManifest } = options;

  let manifestPath: string | null = null;
  let manifestContent: string | null = null;

  if (
    generateManifest
    && (Object.keys(keyedEntries).length > 0 || unkeyedAssets.length > 0)
  ) {
    const manifest = buildManifest(keyedEntries, undefined, unkeyedAssets);
    const { manifestPath: path } = await generateBuildManifest({
      keyedEntries,
      unkeyedAssets,
      outdir,
      generateManifest: true,
    });
    manifestPath = path;
    manifestContent = JSON.stringify(manifest, null, 2);
  }

  return { manifestPath, manifestContent };
}
