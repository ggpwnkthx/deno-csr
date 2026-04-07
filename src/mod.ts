/**
 * @ggpwnkthx/csr - Client build and development workflow tooling.
 *
 * Wraps `@ggpwnkthx/esbuild` to provide:
 * - Production client bundle generation with content-hashed assets
 * - Development watch mode with live reload scaffolding
 * - Deterministic manifest generation for server/runtime consumption
 *
 * @module
 */

export {
  buildClient,
  generateBuildManifest,
  processMetafileOutputs,
} from "@ggpwnkthx/csr-build";
export type {
  BuildClientOptions,
  BuildResult,
  MetafileOutputEntry,
} from "@ggpwnkthx/csr-build";
export {
  esbuildModule,
  resetEsbuildModule,
  setEsbuildModule,
} from "@ggpwnkthx/csr-build";

export { devClient } from "@ggpwnkthx/csr-dev";
export type { DevClientOptions, DevResult } from "@ggpwnkthx/csr-dev";

export { readManifest, writeManifest } from "@ggpwnkthx/csr-manifest";
export type {
  AssetManifest,
  ManifestEntry,
  UnkeyedOutputEntry,
} from "@ggpwnkthx/csr-manifest";

export { BuildError, DevServerError, ValidationError } from "@ggpwnkthx/csr-shared";
export { FileTooLargeError } from "@ggpwnkthx/csr-dev";
