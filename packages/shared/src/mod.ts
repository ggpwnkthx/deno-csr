/**
 * Shared utilities for CSR tooling packages.
 *
 * Contains:
 * - File hashing utilities
 * - Option validation
 * - Error classes
 *
 * @module
 *
 * @example Using error classes
 * ```typescript
 * import { BuildError, ValidationError, hashFile } from "@ggpwnkthx/csr-shared";
 *
 * try {
 *   // ... operation that may fail
 * } catch (err) {
 *   if (err instanceof ValidationError) {
 *     console.error("Validation failed:", err.message);
 *   } else if (err instanceof BuildError) {
 *     console.error("Build error:", err.message);
 *   }
 * }
 *
 * const hash = await hashFile("path/to/file.txt");
 * ```
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
