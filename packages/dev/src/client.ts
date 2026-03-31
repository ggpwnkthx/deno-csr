import { context, stop } from "@ggpwnkthx/esbuild";
import { resolve } from "@std/path";
import { validateDevOptions } from "@ggpwnkthx/csr-shared";
import { DevServerError } from "@ggpwnkthx/csr-shared";
import { FileTooLargeError } from "./errors.ts";
import { MAX_HTML_FILE_SIZE, MAX_LIVERELOAD_CONTROLLERS } from "./constants.ts";
import { injectLiveReload } from "./live-reload.ts";
import { getContentType } from "./content-type.ts";
import { safeFilePath } from "./path-utils.ts";
import { buildEntryMap } from "./entry-map.ts";
import type { EntryMap } from "./entry-map.ts";
import type { DevClientOptions, DevHandle } from "./types.ts";

async function serveHtmlFile(filePath: string, fileSize: number): Promise<Response> {
  if (fileSize > MAX_HTML_FILE_SIZE) {
    throw new FileTooLargeError(
      `HTML file exceeds maximum size of ${MAX_HTML_FILE_SIZE} bytes: ${filePath}`,
    );
  }
  const html = await Deno.readTextFile(filePath);
  return new Response(injectLiveReload(html), {
    headers: { "Content-Type": "text/html" },
  });
}

export async function devClient(options: DevClientOptions): Promise<DevHandle> {
  const validated = validateDevOptions(options);
  const { entryPoints, outdir, port, esbuildOptions } = validated;

  let httpServer: Deno.HttpServer | null = null;
  let ctx: Awaited<ReturnType<typeof context>> | null = null;
  const controllers = new Map<number, ReadableStreamDefaultController>();
  let nextControllerId = 0;
  let entryMap: Record<string, EntryMap> = {};

  try {
    ctx = await context({
      entryPoints,
      bundle: true,
      outdir,
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

    const hostname = "localhost";
    const serverPort = port;

    httpServer = Deno.serve({ port: serverPort, hostname }, async (request) => {
      const url = new URL(request.url);

      if (url.pathname === "/~livereload") {
        if (controllers.size >= MAX_LIVERELOAD_CONTROLLERS) {
          return new Response("Too many livereload connections", {
            status: 503,
          });
        }
        let controllerId: number;
        const stream = new ReadableStream({
          start(controller) {
            controllerId = nextControllerId++;
            controllers.set(controllerId, controller);
            request.signal.addEventListener("abort", () => {
              controllers.delete(controllerId);
            });
          },
          cancel() {
            clearInterval(keepalive);
            controllers.delete(controllerId);
          },
        });
        const keepalive = setInterval(() => {
          for (const ctrl of controllers.values()) {
            try {
              ctrl.enqueue(`: keepalive\n\n`);
            } catch {
              // controller may already be closed
            }
          }
        }, 20_000);
        request.signal.addEventListener("abort", () => clearInterval(keepalive));
        return new Response(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }

      if (url.pathname.startsWith("/@entry/")) {
        const entryName = url.pathname.slice("/@entry/".length);
        const entry = entryMap[entryName];
        if (!entry) {
          return new Response("Entry not found", { status: 404 });
        }
        return Response.redirect(`${url.origin}/${entry.js}`, 302);
      }

      if (url.pathname.startsWith("/@style/")) {
        const entryName = url.pathname.slice("/@style/".length);
        const entry = entryMap[entryName];
        if (!entry) {
          return new Response("Entry not found", { status: 404 });
        }
        if (!entry.css) {
          return new Response("No CSS for entry", { status: 404 });
        }
        return Response.redirect(`${url.origin}/${entry.css}`, 302);
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
        console.error(`[csr-tooling] ${serverError}`);
        return new Response("Internal Server Error", { status: 500 });
      }
    });

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
        if (!stopped) {
          const result = await ctx!.rebuild();
          if (result.metafile) {
            entryMap = buildEntryMap(result.metafile);
          }
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
          console.error(`[csr-tooling] File watcher error: ${err}`);
        }
      }
    };

    const watchLoopPromise = watchLoop();

    console.log(`[csr-tooling] Performing initial build...`);
    const initialResult = await ctx!.rebuild();
    if (initialResult.metafile) {
      entryMap = buildEntryMap(initialResult.metafile);
    }
    rebuildAndNotify();
    console.log(`[csr-tooling] Initial build complete.`);
    console.log(
      `[csr-tooling] Watching source directories: ${sourceDirs.join(", ")}`,
    );
    console.log(
      `[csr-tooling] Dev server running on http://${hostname}:${serverPort}`,
    );

    return {
      hostname,
      port: serverPort,
      outdir: resolve(outdir),
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
