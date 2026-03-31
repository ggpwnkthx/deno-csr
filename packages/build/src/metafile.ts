/**
 * Metafile output processing utilities.
 * @module
 */

import { relative, resolve } from "@std/path";
import { type ManifestEntry, type UnkeyedOutputEntry } from "@ggpwnkthx/csr-manifest";
import { detectAssetType, hashFile, normalizePath } from "@ggpwnkthx/csr-shared";

/**
 * An entry in the esbuild metafile outputs.
 */
export interface MetafileOutputEntry {
  entryPoint?: string;
  bytes: number;
  inputs?: Record<string, { bytesInOutput: number }>;
  kind?: "chunk" | "asset";
}

/**
 * Type guard for MetafileOutputEntry.
 */
export function isMetafileOutputEntry(
  value: unknown,
): value is MetafileOutputEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  if (typeof entry.bytes !== "number") return false;
  if (
    entry.entryPoint !== undefined
    && typeof entry.entryPoint !== "string"
  ) {
    return false;
  }
  if (entry.inputs !== undefined) {
    if (typeof entry.inputs !== "object") return false;
  }
  if (entry.kind !== undefined && !["chunk", "asset"].includes(entry.kind as string)) {
    return false;
  }
  return true;
}

interface MetafileOutput {
  [key: string]: MetafileOutputEntry | undefined;
}

/**
 * Options for processing esbuild metafile outputs.
 */
interface ProcessMetafileOptions {
  metafile: MetafileOutput;
  outdir: string;
  rootDir: string;
}

/**
 * Result of processing esbuild metafile outputs.
 */
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
    if (!relSource.startsWith("..") && !relSource.startsWith("/")) {
      sourcePath = relSource;
    }
  } else if (
    metaOutput.inputs
    && Object.keys(metaOutput.inputs).length === 1
  ) {
    const absSource = Object.keys(metaOutput.inputs)[0];
    const relSource = normalizePath(relative(rootDir, absSource));
    if (!relSource.startsWith("..") && !relSource.startsWith("/")) {
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
    kind: metaOutput.kind === "chunk" ? "chunk" : "asset",
  };
}

/**
 * Processes esbuild metafile outputs into manifest entries.
 */
export async function processMetafileOutputs(
  options: ProcessMetafileOptions,
): Promise<ProcessedMetafileResult> {
  const { metafile, outdir, rootDir } = options;

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
