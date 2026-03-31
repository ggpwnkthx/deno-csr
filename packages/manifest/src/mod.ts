/**
 * @ggpwnkthx/asset-manifest - Asset manifest types, generation, I/O, and validation.
 *
 * Provides a self-contained manifest solution for:
 * - SSR/server packages that need to read build manifests
 * - Deployment tooling that generates or consumes manifests
 * - Runtime asset lookup helpers
 * - Test harnesses that validate generated asset maps
 *
 * @module
 */

export * from "./types.ts";
export * from "./generate.ts";
export * from "./build.ts";
export * from "./validate.ts";
export * from "./io.ts";
