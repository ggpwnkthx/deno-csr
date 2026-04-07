/**
 * Production client build orchestration.
 *
 * Production builds use the following managed settings:
 * - `platform: "browser"` - Browser-oriented output
 * - `splitting: true` - Code splitting enabled for shared chunk extraction
 * - `entryNames: "[dir]/[name].[hash]"` - Hashed filenames for entries
 * - `assetNames: "[dir]/[name].[hash]"` - Hashed filenames for assets
 * - `chunkNames: "[dir]/[name].[hash]"` - Hashed filenames for chunks
 *
 * @module
 *
 * @example
 * ```typescript
 * import { buildClient, BuildError } from "@ggpwnkthx/csr-build";
 *
 * try {
 *   const result = await buildClient({
 *     entryPoints: ["src/client.ts"],
 *     outdir: "dist",
 *   });
 *   console.log("Output files:", result.outputFiles);
 * } catch (err) {
 *   if (err instanceof BuildError) {
 *     console.error("Build failed:", err.diagnostics);
 *   }
 * }
 * ```
 */

export { buildClient } from "./client.ts";
export { esbuildModule, resetEsbuildModule, setEsbuildModule } from "./esbuild.ts";
export { generateBuildManifest } from "./manifest.ts";
export { processMetafileOutputs } from "./metafile.ts";
export type { BuildClientOptions, BuildDiagnostic, BuildResult } from "./types.ts";
export type { MetafileOutputEntry } from "./metafile.ts";
