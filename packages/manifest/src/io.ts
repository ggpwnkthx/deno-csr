/**
 * Manifest I/O operations.
 * @module
 */

import { resolve } from "@std/path";
import {
  type AssetManifest,
  MANIFEST_VERSION,
  ManifestError,
  type ValidateManifestOptions,
} from "./types.ts";
import { validateAssets, validateManifestEntry } from "./validate.ts";

const MANIFEST_FILENAME = "manifest.json";

export function resolveManifestPath(outdir: string): string {
  return resolve(outdir, MANIFEST_FILENAME);
}

export async function writeManifest(
  manifest: AssetManifest,
  outdir: string,
): Promise<string> {
  const manifestPath = resolve(outdir, MANIFEST_FILENAME);
  const manifestJson = JSON.stringify(manifest, null, 2);
  await Deno.writeTextFile(manifestPath, manifestJson);
  return manifestPath;
}

export async function readManifest(
  manifestPath: string,
  options?: ValidateManifestOptions,
): Promise<AssetManifest> {
  try {
    const content = await Deno.readTextFile(manifestPath);
    const manifest = JSON.parse(content) as AssetManifest;

    if (!manifest.version || manifest.version !== MANIFEST_VERSION) {
      throw new ManifestError(
        `Unsupported manifest version: ${manifest.version}. Expected ${MANIFEST_VERSION}.`,
      );
    }

    if (!manifest.entries || typeof manifest.entries !== "object") {
      throw new ManifestError("Manifest is missing valid entries object.");
    }

    for (const [key, entry] of Object.entries(manifest.entries)) {
      validateManifestEntry(key, entry);
    }

    if (manifest.assets) {
      validateAssets(manifest.assets);
    }

    if (options?.timestamp !== undefined) {
      if (manifest.timestamp !== options.timestamp) {
        throw new ManifestError(
          `Manifest timestamp mismatch: expected "${options.timestamp}", got "${manifest.timestamp}".`,
        );
      }
    }

    return manifest;
  } catch (err) {
    if (err instanceof ManifestError) throw err;
    if (err instanceof Deno.errors.NotFound) {
      throw new ManifestError(`Manifest not found at: ${manifestPath}`);
    }
    throw new ManifestError(`Failed to read manifest: ${(err as Error).message}`, err);
  }
}
