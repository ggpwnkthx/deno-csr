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
 */

export { buildClient } from "./client.ts";
export { esbuildModule, resetEsbuildModule, setEsbuildModule } from "./esbuild.ts";
export type { BuildClientOptions, BuildDiagnostic, BuildResult } from "./types.ts";
