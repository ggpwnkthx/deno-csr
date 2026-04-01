import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { devClient } from "@ggpwnkthx/csr-dev";
import {
  cleanupTestDir,
  createMinimalHTMLPage,
  TEST_DIR,
  waitForFile,
} from "./helpers.ts";

Deno.test({
  name: "e2e: dev server serves built assets",
  async fn() {
    await cleanupTestDir();

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(
      entryPath,
      `export const greeting = "hello from dev";`,
    );

    const outdir = resolve(TEST_DIR, ".dev");
    await createMinimalHTMLPage(outdir, "/client.js");

    const dev = await devClient({
      entryPoints: entryPath,
      outdir,
      port: 19994,
    });

    try {
      await waitForFile(outdir, (name) => name.endsWith(".js"));

      const response = await fetch(`http://localhost:${dev.port}/index.html`);
      assertEquals(response.ok, true);
      const html = await response.text();
      assertEquals(html.includes("index.html") || html.includes("Test"), true);
    } finally {
      await dev.stop();
    }
  },
});

Deno.test({
  name: "e2e: dev server rebuilds on file change",
  async fn() {
    await cleanupTestDir();

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(entryPath, `export const version = 1;`);

    const outdir = resolve(TEST_DIR, ".dev");
    await createMinimalHTMLPage(outdir, "/client.js");

    const dev = await devClient({
      entryPoints: entryPath,
      outdir,
      port: 19993,
    });

    try {
      await waitForFile(outdir, (name) => name.endsWith(".js"));

      const initialFiles: string[] = [];
      for await (const entry of Deno.readDir(outdir)) {
        if (entry.name.endsWith(".js")) {
          initialFiles.push(entry.name);
        }
      }
      assertEquals(initialFiles.length > 0, true);

      const firstFile = initialFiles[0];
      const initialMtime = (await Deno.stat(resolve(outdir, firstFile))).mtime;

      await Deno.writeTextFile(entryPath, `export const version = 2;`);

      let detected = false;
      const start = Date.now();
      while (Date.now() - start < 5000) {
        const afterFiles: string[] = [];
        for await (const entry of Deno.readDir(outdir)) {
          if (entry.name.endsWith(".js")) {
            afterFiles.push(entry.name);
          }
        }
        const newFiles = afterFiles.filter((f) => !initialFiles.includes(f));
        if (newFiles.length > 0) {
          const newFile = newFiles[0];
          const afterContent = await Deno.readTextFile(resolve(outdir, newFile));
          if (!afterContent.includes("version = 1")) {
            assertEquals(afterContent.includes("version = 2"), true);
            detected = true;
            break;
          }
        }
        const currentMtime = (await Deno.stat(resolve(outdir, firstFile))).mtime;
        if (currentMtime && initialMtime && currentMtime > initialMtime) {
          const afterContent = await Deno.readTextFile(resolve(outdir, firstFile));
          assertEquals(afterContent.includes("version = 2"), true);
          detected = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      assertEquals(detected, true, "Rebuild not detected within timeout");
    } finally {
      await dev.stop();
    }
  },
});
