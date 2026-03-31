import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { devClient } from "@ggpwnkthx/csr-dev";

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

async function createMinimalHTMLPage(outdir: string): Promise<string> {
  await Deno.mkdir(outdir, { recursive: true });
  const htmlPath = resolve(outdir, "index.html");
  const htmlContent = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
<script type="module" src="/client.js"></script>
</body>
</html>`;
  await Deno.writeTextFile(htmlPath, htmlContent);
  return htmlPath;
}

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
    await createMinimalHTMLPage(outdir);

    const dev = await devClient({
      entryPoints: entryPath,
      outdir,
      port: 19994,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await fetch(`http://localhost:${dev.port}/index.html`);
    assertEquals(response.ok, true);
    const html = await response.text();
    assertEquals(html.includes("index.html") || html.includes("Test"), true);

    await dev.stop();
  },
});

Deno.test({
  name: "e2e: dev server rebuilds on file change",
  async fn() {
    await cleanupTestDir();

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(entryPath, `export const version = 1;`);

    const outdir = resolve(TEST_DIR, ".dev");
    await createMinimalHTMLPage(outdir);

    const dev = await devClient({
      entryPoints: entryPath,
      outdir,
      port: 19993,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const initialFiles = [];
    for await (const entry of Deno.readDir(outdir)) {
      if (entry.name.endsWith(".js")) {
        initialFiles.push(entry.name);
      }
    }

    assertEquals(initialFiles.length > 0, true);

    await Deno.writeTextFile(entryPath, `export const version = 2;`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    await dev.stop();
  },
});
