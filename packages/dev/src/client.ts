import { basename, extname, resolve } from "@std/path";
import { context, stop } from "@ggpwnkthx/esbuild";
import { type MetafileOutputEntry, processMetafileOutputs } from "@ggpwnkthx/csr-build";
import { validateDevOptions } from "@ggpwnkthx/csr-shared";
import { DevServerError } from "@ggpwnkthx/csr-shared";
import { FileTooLargeError } from "./errors.ts";
import { generateDevManifest } from "./manifest.ts";
import {
  LIVE_RELOAD_SCRIPT,
  MAX_HTML_FILE_SIZE,
  MAX_LIVERELOAD_CONTROLLERS,
} from "./constants.ts";
import { injectLiveReload } from "./live-reload.ts";
import { getContentType } from "./content-type.ts";
import { safeFilePath } from "./path-utils.ts";
import type { DevClientOptions, DevResult } from "./types.ts";

const VALID_ENTRY_EXTS = [".js", ".mjs", ".ts", ".tsx", ".jsx"] as const;

interface EntryNameIndex {
  js: string;
  css?: string;
}

function buildEntryNameIndexFromMetafile(
  metafile: Record<string, MetafileOutputEntry | undefined>,
): Record<string, EntryNameIndex> {
  const index: Record<string, EntryNameIndex> = {};
  for (const [outputPath, info] of Object.entries(metafile)) {
    if (outputPath.endsWith(".map")) continue;
    if (!info) continue;
    const entryPoint = info["entryPoint"];
    if (typeof entryPoint !== "string") continue;
    const ext = extname(entryPoint);
    if (!VALID_ENTRY_EXTS.includes(ext as typeof VALID_ENTRY_EXTS[number])) {
      continue;
    }
    const name = basename(entryPoint, ext);
    if (!name) continue;
    const jsFile = basename(outputPath);
    const cssBundle = info["cssBundle"];
    index[name] = {
      js: jsFile,
      css: typeof cssBundle === "string" ? basename(cssBundle) : undefined,
    };
  }
  return index;
}

async function serveHtmlFile(filePath: string, fileSize: number): Promise<Response> {
  if (fileSize > MAX_HTML_FILE_SIZE) {
    throw new FileTooLargeError(
      `HTML file exceeds maximum size of ${MAX_HTML_FILE_SIZE} bytes: ${filePath}`,
    );
  }
  const file = await Deno.open(filePath, { read: true });
  const reader = file.readable.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let injected = false;

  const transformed = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        if (!injected) {
          controller.enqueue(encoder.encode(injectLiveReload(buffer)));
        }
        controller.close();
        file.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      if (!injected) {
        const bodyIdx = buffer.toLowerCase().indexOf("</body>");
        if (bodyIdx !== -1) {
          const beforeBody = buffer.slice(0, bodyIdx);
          const afterBody = buffer.slice(bodyIdx);
          controller.enqueue(encoder.encode(beforeBody));
          controller.enqueue(encoder.encode(LIVE_RELOAD_SCRIPT));
          controller.enqueue(encoder.encode(afterBody));
          injected = true;
          buffer = "";
        }
      }
    },
    cancel() {
      reader.cancel();
      file.close();
    },
  });

  return new Response(transformed, {
    headers: { "Content-Type": "text/html" },
  });
}

async function rebuildAndProcess(
  ctx: Awaited<ReturnType<typeof context>>,
  outdir: string,
  rootDir: string,
  generateManifest: boolean,
) {
  const result = await ctx.rebuild();
  if (!result.metafile) {
    return {
      entryNameIndex: {} as Record<string, EntryNameIndex>,
      manifestPath: null as string | null,
      manifestContent: null as string | null,
    };
  }
  const metafile = result.metafile as { outputs: Record<string, unknown> };
  if (Object.keys(metafile.outputs).length === 0) {
    return {
      entryNameIndex: {} as Record<string, EntryNameIndex>,
      manifestPath: null as string | null,
      manifestContent: null as string | null,
    };
  }
  const entryNameIndex = buildEntryNameIndexFromMetafile(
    metafile.outputs as Record<
      string,
      { entryPoint?: string; cssBundle?: string; bytes: number }
    >,
  );
  const { keyedEntries, unkeyedAssets } = await processMetafileOutputs({
    metafile: metafile.outputs as Record<
      string,
      {
        entryPoint?: string;
        bytes: number;
        inputs?: Record<string, { bytesInOutput: number }>;
        kind?: "chunk" | "asset";
      }
    >,
    outdir,
    rootDir,
  });
  const { manifestPath, manifestContent } = await generateDevManifest({
    keyedEntries,
    unkeyedAssets,
    outdir,
    generateManifest,
  });
  return { entryNameIndex, manifestPath, manifestContent };
}

export async function devClient(options: DevClientOptions): Promise<DevResult> {
  const validated = validateDevOptions(options);
  const { entryPoints, outdir, port, esbuildOptions, manifest: generateManifest } =
    validated;

  let httpServer: Deno.HttpServer | null = null;
  let ctx: Awaited<ReturnType<typeof context>> | null = null;
  const controllers = new Map<number, ReadableStreamDefaultController>();
  let nextControllerId = 0;
  let entryNameIndex: Record<string, EntryNameIndex> = {};
  let manifestPath: string | null = null;
  let manifestContent: string | null = null;

  try {
    ctx = await context({
      entryPoints,
      bundle: true,
      outdir,
      platform: "browser",
      format: "esm",
      splitting: true,
      sourcemap: true,
      metafile: true,
      entryNames: "[dir]/[name].[hash]",
      assetNames: "[dir]/[name].[hash]",
      chunkNames: "[dir]/[name].[hash]",
      define: {
        "process.env.NODE_ENV": '"development"',
      },
      write: true,
      ...esbuildOptions,
    });

    const serverPort = port;

    httpServer = Deno.serve(
      { port: serverPort, hostname: "localhost" },
      async (request) => {
        const url = new URL(request.url);

        if (url.pathname === "/~livereload") {
          if (controllers.size >= MAX_LIVERELOAD_CONTROLLERS) {
            return new Response("Too many livereload connections", {
              status: 503,
            });
          }
          let controllerId = 0;
          let controllerRegistered = false;
          let keepalive: number | undefined;
          const stream = new ReadableStream({
            start(controller) {
              controllerId = nextControllerId++;
              controllers.set(controllerId, controller);
              controllerRegistered = true;
              request.signal.addEventListener("abort", () => {
                if (controllerRegistered) {
                  controllers.delete(controllerId);
                  controllerRegistered = false;
                }
              });
            },
            cancel() {
              if (keepalive !== undefined) {
                clearInterval(keepalive);
                keepalive = undefined;
              }
              if (controllerRegistered) {
                controllers.delete(controllerId);
                controllerRegistered = false;
              }
            },
          });
          keepalive = setInterval(() => {
            for (const ctrl of controllers.values()) {
              try {
                ctrl.enqueue(`: keepalive\n\n`);
              } catch {
                // controller may already be closed
              }
            }
          }, 20_000);
          return new Response(stream, {
            headers: { "Content-Type": "text/event-stream" },
          });
        }

        if (url.pathname.startsWith("/@entry/")) {
          const entryName = url.pathname.slice("/@entry/".length);
          const entry = entryNameIndex[entryName];
          if (!entry) {
            return new Response("Entry not found", { status: 404 });
          }
          return Response.redirect(`${url.origin}/${entry.js}`, 302);
        }

        if (url.pathname.startsWith("/@style/")) {
          const entryName = url.pathname.slice("/@style/".length);
          const entry = entryNameIndex[entryName];
          if (!entry) {
            return new Response("Entry not found", { status: 404 });
          }
          if (!entry.css) {
            return new Response("No CSS for entry", { status: 404 });
          }
          return Response.redirect(`${url.origin}/${entry.css}`, 302);
        }

        if (url.pathname === "/@manifest") {
          if (!manifestContent) {
            return new Response("Manifest not available", { status: 404 });
          }
          return new Response(manifestContent, {
            headers: { "Content-Type": "application/json" },
          });
        }

        let pathname = url.pathname;
        if (pathname === "/") {
          pathname = "/index.html";
        }

        const safePath = safeFilePath(pathname, outdir);
        if (!safePath) {
          return new Response("Forbidden", { status: 403 });
        }

        try {
          const stat = await Deno.stat(safePath);
          if (stat.isDirectory) {
            const indexPath = safePath + "/index.html";
            const indexStat = await Deno.stat(indexPath);
            if (!indexStat.isFile) {
              return new Response("Forbidden", { status: 403 });
            }
            const contentType = getContentType(indexPath);
            if (contentType === "text/html") {
              return await serveHtmlFile(indexPath, indexStat.size);
            }
            const file = await Deno.open(indexPath, { read: true });
            return new Response(file.readable, {
              headers: { "Content-Type": contentType },
            });
          }
          const contentType = getContentType(safePath);
          if (contentType === "text/html") {
            return await serveHtmlFile(safePath, stat.size);
          }
          const file = await Deno.open(safePath, { read: true });
          return new Response(file.readable, {
            headers: { "Content-Type": contentType },
          });
        } catch (err) {
          if (err instanceof FileTooLargeError) {
            return new Response(err.message, { status: err.statusCode });
          }
          if (err instanceof Deno.errors.NotFound) {
            return new Response("Not found", { status: 404 });
          }
          if (
            err instanceof Deno.errors.PermissionDenied
            || err instanceof Deno.errors.IsADirectory
          ) {
            return new Response("Forbidden", { status: 403 });
          }
          const serverError = new DevServerError(
            `Unexpected request handler error: ${(err as Error).message}`,
            err,
          );
          console.error(`[csr-dev] ${serverError}`);
          return new Response("Internal Server Error", { status: 500 });
        }
      },
    );

    const rebuildAndNotify = () => {
      for (const [id, controller] of controllers.entries()) {
        try {
          controller.enqueue(`data: reload\n\n`);
        } catch {
          controllers.delete(id);
        }
      }
    };

    const sourceDirs = Array.from(
      new Set(validated.entryPoints.map((ep) => resolve(ep, ".."))),
    );

    const rootDir = validated.rootDir;

    const fsWatcher: Deno.FsWatcher = Deno.watchFs(sourceDirs, {
      recursive: true,
    });

    let debounceTimer: number | null = null;
    let stopped = false;

    const shutdown = async () => {
      if (stopped) return;
      stopped = true;

      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }

      for (const controller of controllers.values()) {
        try {
          controller.close();
        } catch {
          // ignore
        }
      }
      controllers.clear();

      try {
        fsWatcher.close();
      } catch {
        // ignore
      }

      try {
        await ctx?.dispose();
      } catch {
        // ignore
      }

      try {
        await httpServer?.shutdown();
      } catch {
        // ignore
      }

      try {
        await stop();
      } catch {
        // ignore
      }
    };

    Deno.addSignalListener("SIGINT", shutdown);
    Deno.addSignalListener("SIGTERM", shutdown);

    const debouncedRebuild = () => {
      if (stopped) return;
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(async () => {
        debounceTimer = null;
        if (!stopped && ctx) {
          const result = await rebuildAndProcess(
            ctx,
            outdir,
            rootDir,
            generateManifest,
          );
          entryNameIndex = result.entryNameIndex;
          manifestPath = result.manifestPath;
          manifestContent = result.manifestContent;
          rebuildAndNotify();
        }
      }, 100);
    };

    const watchLoop = async () => {
      try {
        for await (const event of fsWatcher) {
          if (stopped) break;
          if (
            event.kind === "modify" || event.kind === "create"
            || event.kind === "rename"
          ) {
            debouncedRebuild();
          }
        }
      } catch (err) {
        if (!stopped) {
          console.error(`[csr-dev] File watcher error: ${err}`);
        }
      }
    };

    const watchLoopPromise = watchLoop();

    console.log(`[csr-dev] Performing initial build...`);
    const initialResult = await rebuildAndProcess(
      ctx!,
      outdir,
      rootDir,
      generateManifest,
    );
    entryNameIndex = initialResult.entryNameIndex;
    manifestPath = initialResult.manifestPath;
    manifestContent = initialResult.manifestContent;
    rebuildAndNotify();
    console.log(`[csr-dev] Initial build complete.`);
    console.log(
      `[csr-dev] Watching source directories: ${sourceDirs.join(", ")}`,
    );
    console.log(
      `[csr-dev] Dev server running on http://localhost:${serverPort}`,
    );

    return {
      port: serverPort,
      outdir: resolve(outdir),
      manifestPath,
      stop: async () => {
        Deno.removeSignalListener("SIGINT", shutdown);
        Deno.removeSignalListener("SIGTERM", shutdown);
        await shutdown();
        await watchLoopPromise;
      },
    };
  } catch (err) {
    try {
      await httpServer?.shutdown();
    } catch {
      // ignore
    }
    try {
      await ctx?.dispose();
    } catch {
      // ignore
    }
    try {
      await stop();
    } catch {
      // ignore
    }
    throw new DevServerError(
      `Failed to start dev server: ${(err as Error).message}`,
      err,
    );
  }
}
