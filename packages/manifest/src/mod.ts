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
 *
 * @example Reading a manifest
 * ```typescript
 * import { readManifest } from "@ggpwnkthx/csr-manifest";
 *
 * const manifest = await readManifest("dist/manifest.json");
 *
 * for (const [entryName, entry] of Object.entries(manifest.entries)) {
 *   console.log(`${entryName} -> ${entry.outputFile} (${entry.hash})`);
 * }
 * ```
 *
 * @example Building a manifest
 * ```typescript
 * import { buildManifest, generateManifestEntry, writeManifest } from "@ggpwnkthx/csr-manifest";
 *
 * const entry = await generateManifestEntry(
 *   "src/client.ts",
 *   "/path/to/dist/client.abc123.js",
 *   "/path/to/dist",
 * );
 *
 * const manifest = buildManifest({ "src/client.ts": entry });
 * const manifestPath = await writeManifest(manifest, "/path/to/dist");
 * ```
 */

export * from "./types.ts";
export * from "./generate.ts";
export * from "./build.ts";
export * from "./metafile-process.ts";
export * from "./validate.ts";
export * from "./io.ts";
