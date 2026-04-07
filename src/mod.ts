/**
 * @ggpwnkthx/csr - Client build and development workflow tooling.
 *
 * Wraps `@ggpwnkthx/esbuild` to provide:
 * - Production client bundle generation with content-hashed assets
 * - Development watch mode with live reload scaffolding
 * - Deterministic manifest generation for server/runtime consumption
 *
 * @module
 *
 * @example Basic usage
 * ```typescript
 * import { buildClient, devClient, readManifest } from "@ggpwnkthx/csr";
 *
 * // Production build
 * const result = await buildClient({
 *   entryPoints: ["src/client.ts"],
 *   outdir: "dist",
 * });
 * console.log("Built:", result.outputFiles);
 *
 * // Development server
 * const dev = await devClient({
 *   entryPoints: ["src/client.ts"],
 *   outdir: ".dev",
 *   port: 35729,
 * });
 * console.log(`Dev server running on ${dev.hostname}:${dev.port}`);
 * await dev.stop();
 *
 * // Read manifest for SSR
 * const manifest = await readManifest("dist/manifest.json");
 * ```
 */

export * from "@ggpwnkthx/csr-build";
export * from "@ggpwnkthx/csr-dev";
export * from "@ggpwnkthx/csr-manifest";
export * from "@ggpwnkthx/csr-shared";
