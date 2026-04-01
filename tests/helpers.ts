import { resolve } from "@std/path";

/**
 * Shared test utilities for E2E tests.
 * @module
 */

/**
 * Temporary directory for E2E tests, created once per test run.
 * Cleanup is delegated to the OS via /tmp lifecycle.
 */
export const TEST_DIR = await Deno.makeTempDir({ prefix: "csr-tooling-e2e-test-" });

/**
 * Removes all contents from TEST_DIR.
 * NotFound errors are ignored since cleanup should be idempotent.
 * Other errors are reported to stderr to avoid silent failures.
 */
export async function cleanupTestDir(): Promise<void> {
  try {
    for await (const entry of Deno.readDir(TEST_DIR)) {
      await Deno.remove(resolve(TEST_DIR, entry.name), { recursive: true });
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return;
    }
    console.error(`Warning: cleanupTestDir failed: ${err}`);
  }
}

/**
 * Creates a minimal HTML page in the specified outdir.
 * @param outdir - Directory to create the HTML file in
 * @param scriptSrc - Script source path, defaults to "/@entry/client"
 */
export async function createMinimalHTMLPage(
  outdir: string,
  scriptSrc = "/@entry/client",
): Promise<void> {
  await Deno.mkdir(outdir, { recursive: true });
  const htmlPath = resolve(outdir, "index.html");
  const htmlContent = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
<script type="module" src="${scriptSrc}"></script>
</body>
</html>`;
  await Deno.writeTextFile(htmlPath, htmlContent);
}

/**
 * Waits for a server to respond with 200 OK.
 * @param url - Server URL to poll
 * @param timeout - Max wait time in ms (default: 10s for slower CI)
 */
export async function waitForServer(url: string, timeout = 10000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      response.body?.cancel();
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timeout waiting for server at ${url}`);
}

/**
 * Waits for a file matching the given pattern to exist in a directory.
 * @param dir - Directory to watch
 * @param pattern - Predicate function to match file names
 * @param timeout - Max wait time in ms (default: 5s for responsiveness)
 */
export async function waitForFile(
  dir: string,
  pattern: (name: string) => boolean,
  timeout = 5000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      for await (const entry of Deno.readDir(dir)) {
        if (pattern(entry.name)) return;
      }
    } catch {
      // Directory might not exist yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timeout waiting for file matching pattern in ${dir}`);
}

type ServerHandle = {
  port: number;
  shutdown: () => Promise<void>;
};

/**
 * Creates a streaming static file server for the given directory.
 * @param outdir - Directory to serve files from
 * @param port - Port to listen on
 */
export function createStaticFileServer(
  outdir: string,
  port: number,
): ServerHandle {
  const server = Deno.serve(
    { port, hostname: "localhost" },
    (request) => {
      const url = new URL(request.url);
      const path = url.pathname === "/" ? "/index.html" : url.pathname;
      const filePath = resolve(outdir, path.slice(1));
      try {
        const file = Deno.openSync(filePath);
        const ext = filePath.split(".").pop()?.toLowerCase();
        const contentType = ext === "js"
          ? "application/javascript"
          : ext === "html"
          ? "text/html"
          : "application/octet-stream";
        return new Response(file.readable, {
          headers: { "Content-Type": contentType },
        });
      } catch {
        return new Response("Not found", { status: 404 });
      }
    },
  );

  return {
    port,
    shutdown: () => server.shutdown(),
  };
}
