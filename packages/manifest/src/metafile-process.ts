/**
 * Esbuild metafile processing utilities.
 *
 * Processes esbuild metafile outputs into typed manifest entries
 * for use by build and dev packages.
 * @module
 */

import { relative, resolve } from "@std/path";
import {
  isMetafileOutputEntry,
  type ManifestEntry,
  ManifestError,
  type MetafileOutputEntry,
  type UnkeyedOutputEntry,
} from "./types.ts";
import {
  detectAssetType,
  hashFile,
  isPathTraversalSafe,
  normalizePath,
} from "@ggpwnkthx/csr-shared";

interface ProcessMetafileOptions {
  metafile: Record<string, MetafileOutputEntry | undefined>;
  outdir: string;
  rootDir: string;
}

interface ProcessedMetafileResult {
  keyedEntries: Record<string, ManifestEntry>;
  unkeyedAssets: UnkeyedOutputEntry[];
}

interface OutputFileInfo {
  outputPath: string;
  outputFile: string;
  size: number;
  hash: string;
  outputType: ReturnType<typeof detectAssetType>;
  sourcePath: string | null;
  kind: "chunk" | "asset";
}

async function processSingleOutput(
  outputPath: string,
  metaOutput: MetafileOutputEntry,
  outdir: string,
  rootDir: string,
): Promise<OutputFileInfo> {
  const absOutputPath = resolve(outputPath);
  const [fileInfo, hash] = await Promise.all([
    Deno.stat(absOutputPath),
    hashFile(absOutputPath),
  ]);
  const outputFile = normalizePath(relative(outdir, absOutputPath));
  const outputType = detectAssetType(outputPath);

  let sourcePath: string | null = null;

  if (metaOutput.entryPoint) {
    const absSource = metaOutput.entryPoint;
    const relSource = normalizePath(relative(rootDir, absSource));
    if (isPathTraversalSafe(relSource)) {
      sourcePath = relSource;
    }
  } else if (
    metaOutput.inputs
    && Object.keys(metaOutput.inputs).length === 1
  ) {
    const absSource = Object.keys(metaOutput.inputs)[0];
    const relSource = normalizePath(relative(rootDir, absSource));
    if (isPathTraversalSafe(relSource)) {
      sourcePath = relSource;
    }
  }

  return {
    outputPath,
    outputFile,
    size: fileInfo.size,
    hash,
    outputType,
    sourcePath,
    kind: (metaOutput.kind === "chunk" ? "chunk" : "asset") as "chunk" | "asset",
  };
}

/**
 * Processes esbuild metafile outputs into typed manifest entries.
 *
 * Each output is classified as either a "keyed entry" (has a source entry point)
 * or an "unkeyed asset" (no direct source mapping, e.g. extracted CSS chunks).
 */
export async function processMetafileOutputs(
  options: ProcessMetafileOptions,
): Promise<ProcessedMetafileResult> {
  const { metafile, outdir, rootDir } = options;

  if (!outdir) {
    throw new ManifestError("outdir must be a non-empty string");
  }
  if (!rootDir) {
    throw new ManifestError("rootDir must be a non-empty string");
  }

  const filteredEntries: Array<
    { outputPath: string; metaOutput: MetafileOutputEntry }
  > = [];

  for (
    const [outputPath, outputInfo] of Object.entries(metafile)
  ) {
    if (!outputInfo) continue;
    if (outputPath.endsWith(".map")) continue;
    if (!isMetafileOutputEntry(outputInfo)) continue;
    filteredEntries.push({ outputPath, metaOutput: outputInfo });
  }

  const results = await Promise.all(
    filteredEntries.map(({ outputPath, metaOutput }) =>
      processSingleOutput(outputPath, metaOutput, outdir, rootDir)
    ),
  );

  const keyedEntries: Record<string, ManifestEntry> = {};
  const unkeyedAssets: UnkeyedOutputEntry[] = [];

  for (const result of results) {
    if (result.sourcePath) {
      keyedEntries[result.sourcePath] = {
        originalPath: result.sourcePath,
        outputFile: result.outputFile,
        size: result.size,
        hash: result.hash,
        type: result.outputType,
      };
    } else {
      unkeyedAssets.push({
        outputFile: result.outputFile,
        size: result.size,
        hash: result.hash,
        type: result.outputType,
        kind: result.kind,
      });
    }
  }

  return { keyedEntries, unkeyedAssets };
}
