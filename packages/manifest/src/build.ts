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
