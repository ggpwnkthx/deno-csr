/**
 * Builds an asset manifest from entries.
 * @module
 */

import {
  type AssetManifest,
  MANIFEST_VERSION,
  type ManifestEntry,
  type UnkeyedOutputEntry,
  type ValidateManifestOptions,
} from "./types.ts";

/**
 * Builds a complete manifest from entries.
 * @param entries - Map of entry names to manifest entries
 * @param options - Optional manifest options
 * @param assets - Optional array of unkeyed assets
 */
export function buildManifest(
  entries: Record<string, ManifestEntry>,
  options?: ValidateManifestOptions,
  assets?: UnkeyedOutputEntry[],
): AssetManifest {
  const sortedKeys = Object.keys(entries).sort();
  const sortedEntries: Record<string, ManifestEntry> = {};
  for (const key of sortedKeys) {
    sortedEntries[key] = entries[key];
  }

  return {
    version: MANIFEST_VERSION,
    timestamp: options?.timestamp ?? new Date().toISOString(),
    entries: sortedEntries,
    ...(assets && assets.length > 0 ? { assets } : {}),
  };
}
