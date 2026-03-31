/**
 * Main build client orchestration.
 * @module
 */

import { esbuildModule } from "./esbuild.ts";
import { buildErrorsToStructured } from "./errors.ts";
import { processMetafileOutputs } from "./metafile.ts";
import { generateBuildManifest } from "./manifest.ts";
import { BuildError, validateBuildOptions } from "@ggpwnkthx/csr-shared";
import type { BuildClientOptions, BuildResult } from "./types.ts";

export async function buildClient(
  options: BuildClientOptions,
): Promise<BuildResult> {
  const validated = validateBuildOptions(options);
  const {
    entryPoints,
    outdir,
    rootDir,
    esbuildOptions,
    manifest: generateManifest,
    sourcemap,
  } = validated;

  const result = await esbuildModule.build({
    ...esbuildOptions,
    entryPoints,
    bundle: true,
    outdir,
    platform: "browser",
    format: "esm",
    entryNames: "[dir]/[name].[hash]",
    assetNames: "[dir]/[name].[hash]",
    chunkNames: "[dir]/[name].[hash]",
    splitting: true,
    minify: true,
    sourcemap,
    metafile: true,
    write: true,
  });

  try {
    await esbuildModule.stop();
  } catch {
    // ignore if already stopped
  }

  const warnings = buildErrorsToStructured(result.warnings ?? []);
  const errors = buildErrorsToStructured(result.errors ?? []);

  if (errors.length > 0) {
    const formatted = await esbuildModule.formatMessages(errors, {
      kind: "error",
    });
    throw new BuildError(`Build failed:\n${formatted.join("\n")}`, errors);
  }

  const { keyedEntries, unkeyedAssets } = await processMetafileOutputs({
    metafile: result.metafile?.outputs ?? {},
    outdir,
    rootDir,
  });

  const { manifestPath, outputFiles } = await generateBuildManifest({
    keyedEntries,
    unkeyedAssets,
    outdir,
    generateManifest,
  });

  return {
    outputFiles,
    manifestPath,
    warnings,
  };
}
