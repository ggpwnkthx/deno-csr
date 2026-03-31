import { basename, extname } from "@std/path";

const VALID_ENTRY_EXTS = [".js", ".mjs", ".ts", ".tsx", ".jsx"] as const;

/**
 * Maps entry names to their output files.
 */
export interface EntryMap {
  js: string;
  css?: string;
}

/**
 * Builds an entry map from esbuild metafile outputs.
 */
export function buildEntryMap(
  metafile: {
    outputs: Record<
      string,
      { entryPoint?: string; cssBundle?: string; bytes: number }
    >;
  },
): Record<string, EntryMap> {
  const entryMap: Record<string, EntryMap> = {};
  for (const [outputPath, info] of Object.entries(metafile.outputs)) {
    if (outputPath.endsWith(".map")) continue;
    const entryPoint = info.entryPoint;
    if (entryPoint) {
      const ext = extname(entryPoint);
      if (!VALID_ENTRY_EXTS.includes(ext as typeof VALID_ENTRY_EXTS[number])) continue;
      const name = basename(entryPoint, ext);
      if (!name) continue;
      const jsFile = basename(outputPath);
      entryMap[name] = {
        js: jsFile,
        css: info.cssBundle ? basename(info.cssBundle) : undefined,
      };
    }
  }
  return entryMap;
}
