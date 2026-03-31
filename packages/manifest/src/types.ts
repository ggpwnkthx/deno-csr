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
