/**
 * Types for the asset-manifest package.
 * @module
 */

import { type AssetType } from "@ggpwnkthx/csr-shared";

/**
 * Current manifest version.
 */
export const MANIFEST_VERSION = 1;

/**
 * A manifest entry mapping an original entry point to its build output.
 */
export interface ManifestEntry {
  originalPath: string;
  outputFile: string;
  size: number;
  hash: string;
  type: AssetType;
}

/**
 * An output entry that is not keyed by original path (chunks and assets).
 */
export interface UnkeyedOutputEntry {
  outputFile: string;
  size: number;
  hash: string;
  type: AssetType;
  kind: "chunk" | "asset";
}

/**
 * An entry in the esbuild metafile outputs.
 */
export interface MetafileOutputEntry {
  entryPoint?: string;
  cssBundle?: string;
  bytes: number;
  inputs?: Record<string, { bytesInOutput: number }>;
  kind?: "chunk" | "asset";
}

/**
 * Type guard for MetafileOutputEntry.
 */
export function isMetafileOutputEntry(
  value: unknown,
): value is MetafileOutputEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  if (typeof entry.bytes !== "number") return false;
  if (
    entry.entryPoint !== undefined
    && typeof entry.entryPoint !== "string"
  ) {
    return false;
  }
  if (entry.inputs !== undefined) {
    if (typeof entry.inputs !== "object") return false;
    for (const [, val] of Object.entries(entry.inputs as Record<string, unknown>)) {
      if (typeof val !== "object" || val === null) return false;
      const inputEntry = val as Record<string, unknown>;
      if (typeof inputEntry.bytesInOutput !== "number") return false;
    }
  }
  if (
    entry.kind !== undefined
    && !["chunk", "asset"].includes(entry.kind as string)
  ) {
    return false;
  }
  return true;
}

/**
 * Complete asset manifest structure.
 */
export interface AssetManifest {
  version: 1;
  timestamp: string;
  entries: Record<string, ManifestEntry>;
  assets?: UnkeyedOutputEntry[];
}

/**
 * Options for validating a manifest.
 */
export interface ValidateManifestOptions {
  timestamp?: string;
}

/**
 * Error thrown when manifest operations fail.
 */
export class ManifestError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "ManifestError";
  }
}
