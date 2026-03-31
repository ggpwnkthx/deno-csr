/**
 * Validates manifest entries and assets.
 * @module
 */

import { ASSET_TYPES, isPathTraversalSafe } from "@ggpwnkthx/csr-shared";
import { type ManifestEntry, ManifestError } from "./types.ts";

function isAbsolutePath(path: string): boolean {
  return path.startsWith("/") || path.includes("\\") || /^[a-z]:/i.test(path);
}

function isPathSafe(path: string): boolean {
  return isPathTraversalSafe(path) && !isAbsolutePath(path);
}

function validateAsset(
  asset: unknown,
  index: number,
): asserts asset is {
  outputFile: string;
  size: number;
  hash: string;
  type: typeof ASSET_TYPES[number];
  kind: "chunk" | "asset";
} {
  if (typeof asset !== "object" || asset === null) {
    throw new ManifestError(
      `Manifest asset at index ${index} must be an object, got ${typeof asset}.`,
    );
  }
  const a = asset as unknown as Record<string, unknown>;
  if (typeof a.outputFile !== "string" || a.outputFile === "") {
    throw new ManifestError(
      `Manifest asset at index ${index} has invalid outputFile: must be a non-empty string.`,
    );
  }
  if (typeof a.size !== "number" || a.size < 0 || !Number.isInteger(a.size)) {
    throw new ManifestError(
      `Manifest asset at index ${index} has invalid size: must be a non-negative integer.`,
    );
  }
  if (typeof a.hash !== "string" || !/^[a-f0-9]{64}$/i.test(a.hash)) {
    throw new ManifestError(
      `Manifest asset at index ${index} has invalid hash: must be a 64-character hex string.`,
    );
  }
  if (!ASSET_TYPES.includes(a.type as typeof ASSET_TYPES[number])) {
    throw new ManifestError(
      `Manifest asset at index ${index} has invalid type: must be "js", "css", or "asset".`,
    );
  }
  if (!["chunk", "asset"].includes(a.kind as string)) {
    throw new ManifestError(
      `Manifest asset at index ${index} has invalid kind: must be "chunk" or "asset".`,
    );
  }
  if (!isPathSafe(a.outputFile)) {
    throw new ManifestError(
      `Manifest asset at index ${index} has invalid outputFile: must be relative and safe from traversal.`,
    );
  }
}

/**
 * Validates an array of unkeyed output entries.
 * @param assets - The assets array to validate
 */
export function validateAssets(
  assets: unknown,
): asserts assets is {
  outputFile: string;
  size: number;
  hash: string;
  type: typeof ASSET_TYPES[number];
  kind: "chunk" | "asset";
}[] {
  if (!Array.isArray(assets)) {
    throw new ManifestError(
      `Manifest assets must be an array, got ${typeof assets}.`,
    );
  }
  for (let i = 0; i < assets.length; i++) {
    validateAsset(assets[i], i);
  }
}

/**
 * Validates a manifest entry.
 * @param key - The entry key (for error messages)
 * @param entry - The entry to validate
 */
export function validateManifestEntry(
  key: string,
  entry: unknown,
): asserts entry is ManifestEntry {
  if (typeof entry !== "object" || entry === null) {
    throw new ManifestError(
      `Manifest entry "${key}" must be an object, got ${typeof entry}.`,
    );
  }

  const e = entry as Record<string, unknown>;

  if (typeof e.originalPath !== "string" || e.originalPath === "") {
    throw new ManifestError(
      `Manifest entry "${key}" has invalid originalPath: must be a non-empty string.`,
    );
  }

  if (typeof e.outputFile !== "string" || e.outputFile === "") {
    throw new ManifestError(
      `Manifest entry "${key}" has invalid outputFile: must be a non-empty string.`,
    );
  }

  if (!isPathSafe(e.outputFile)) {
    throw new ManifestError(
      `Manifest entry "${key}" has invalid outputFile: must be relative and safe from traversal.`,
    );
  }

  if (!isPathSafe(e.originalPath)) {
    throw new ManifestError(
      `Manifest entry "${key}" has invalid originalPath: must be relative and safe from traversal.`,
    );
  }

  if (typeof e.size !== "number" || e.size < 0 || !Number.isInteger(e.size)) {
    throw new ManifestError(
      `Manifest entry "${key}" has invalid size: must be a non-negative integer.`,
    );
  }

  if (typeof e.hash !== "string" || !/^[a-f0-9]{64}$/i.test(e.hash)) {
    throw new ManifestError(
      `Manifest entry "${key}" has invalid hash: must be a 64-character hex string.`,
    );
  }

  if (!ASSET_TYPES.includes(e.type as typeof ASSET_TYPES[number])) {
    throw new ManifestError(
      `Manifest entry "${key}" has invalid type: must be "js", "css", or "asset".`,
    );
  }
}
