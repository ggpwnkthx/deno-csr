import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { launch } from "@astral/astral";
import { buildClient } from "@ggpwnkthx/csr-build";
import { devClient } from "@ggpwnkthx/csr-dev";
import { readManifest } from "@ggpwnkthx/csr-manifest";
import { stop } from "@ggpwnkthx/esbuild";

const TEST_DIR = await Deno.makeTempDir({ prefix: "csr-tooling-e2e-test-" });

async function cleanupTestDir() {
  try {
    for await (const entry of Deno.readDir(TEST_DIR)) {
      await Deno.remove(resolve(TEST_DIR, entry.name), { recursive: true });
    }
  } catch {
    // ignore
  }
}

async function createMinimalHTMLPage(
  outdir: string,
  scriptSrc = "/@entry/client",
): Promise<string> {
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
  return htmlPath;
}

Deno.test({
  name: "e2e: dev page loads in browser with live reload",
  async fn() {
    await cleanupTestDir();

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(
      entryPath,
      `export const greeting = "hello v1"; document.body.textContent = greeting;`,
    );

    const outdir = resolve(TEST_DIR, ".dev");
    await createMinimalHTMLPage(outdir);

    const dev = await devClient({
      entryPoints: entryPath,
      outdir,
      port: 19991,
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const browser = await launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    try {
      const page = await browser.newPage();

      await page.goto(`http://localhost:${dev.port}/index.html`, {
        waitUntil: "networkidle2",
      });

      const initialText = await page.evaluate(() => document.body.textContent);
      assertEquals(initialText, "hello v1");

      await page.close();
      await browser.close();
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      await dev.stop();
    }
  },
});

Deno.test({
  name: "e2e: production manifest resolves asset and browser loads it",
  async fn() {
    await cleanupTestDir();

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(
      entryPath,
      `export const value = 42; document.body.textContent = "value=" + value;`,
    );

    const outdir = resolve(TEST_DIR, "dist");

    const result = await buildClient({
      entryPoints: entryPath,
      outdir,
      rootDir: TEST_DIR,
      manifest: true,
    });

    try {
      assertEquals(result.manifestPath !== null, true);

      const manifest = await readManifest(result.manifestPath!);
      const jsEntry = Object.values(manifest.entries).find(
        (entry) => entry.type === "js",
      );
      if (!jsEntry) {
        throw new Error("No JS entry in manifest");
      }
      assertEquals(jsEntry !== undefined, true);

      await createMinimalHTMLPage(outdir, `/${jsEntry.outputFile}`);

      const server = Deno.serve(
        { port: 19990, hostname: "localhost" },
        async (request) => {
          const url = new URL(request.url);
          const path = url.pathname === "/" ? "/index.html" : url.pathname;
          const filePath = resolve(outdir, path.slice(1));
          try {
            const content = await Deno.readFile(filePath);
            const ext = filePath.split(".").pop()?.toLowerCase();
            const contentType = ext === "js"
              ? "application/javascript"
              : ext === "html"
              ? "text/html"
              : "application/octet-stream";
            return new Response(content, { headers: { "Content-Type": contentType } });
          } catch {
            return new Response("Not found", { status: 404 });
          }
        },
      );

      try {
        const response = await fetch(`http://localhost:19990/${jsEntry.outputFile}`);
        assertEquals(response.ok, true);
        await response.body?.cancel();

        const browser = await launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        try {
          const page = await browser.newPage();

          await page.goto(`http://localhost:19990/index.html`, {
            waitUntil: "networkidle2",
          });

          const text = await page.evaluate(() => document.body.textContent);
          assertEquals(text, "value=42");

          await page.close();
        } finally {
          await browser.close();
        }
      } finally {
        await server.shutdown();
      }
    } finally {
      await stop();
    }
  },
});
