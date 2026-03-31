/**
 * Shared utilities for CSR tooling packages.
 *
 * Contains:
 * - File hashing utilities
 * - Option validation
 * - Error classes
 * @module
 */

export { ASSET_TYPES, detectAssetType } from "./detect-type.ts";
export type { AssetType } from "./detect-type.ts";

export {
  validateBuildOptions,
  type ValidatedBuildOptions,
  type ValidatedDevOptions,
  validateDevOptions,
} from "./validate.ts";

export type { BuildClientOptions, DevClientOptions } from "./options.ts";

export { hashFile } from "./hash.ts";

export { isPathTraversalSafe, normalizePath } from "./normalize.ts";

export {
  BuildError,
  DevServerError,
  EntryPointValidationError,
  OutdirValidationError,
  PortValidationError,
  ValidationError,
} from "./errors.ts";
