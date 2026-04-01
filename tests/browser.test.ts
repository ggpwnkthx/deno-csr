import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { launch } from "@astral/astral";
import { buildClient } from "@ggpwnkthx/csr-build";
import { devClient } from "@ggpwnkthx/csr-dev";
import { readManifest } from "@ggpwnkthx/csr-manifest";
import { stop } from "@ggpwnkthx/esbuild";
import {
  cleanupTestDir,
  createMinimalHTMLPage,
  createStaticFileServer,
  TEST_DIR,
  waitForServer,
} from "./helpers.ts";

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

    try {
      await waitForServer(`http://localhost:${dev.port}/index.html`);

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
      } finally {
        await browser.close();
      }
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

      const server = createStaticFileServer(outdir, 19990);

      try {
        const response = await fetch(`http://localhost:19990/${jsEntry.outputFile}`);
        assertEquals(response.ok, true);
        await response.arrayBuffer();

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
