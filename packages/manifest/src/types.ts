/**
 * Types for the asset-manifest package.
 * @module
 */

import { type AssetType } from "@ggpwnkthx/csr-shared";

export const MANIFEST_VERSION = 1;

export interface ManifestEntry {
  originalPath: string;
  outputFile: string;
  size: number;
  hash: string;
  type: AssetType;
}

export interface UnkeyedOutputEntry {
  outputFile: string;
  size: number;
  hash: string;
  type: AssetType;
  kind: "chunk" | "asset";
}

export interface AssetManifest {
  version: 1;
  timestamp: string;
  entries: Record<string, ManifestEntry>;
  assets?: UnkeyedOutputEntry[];
}

export interface ValidateManifestOptions {
  timestamp?: string;
}

export class ManifestError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "ManifestError";
  }
}
