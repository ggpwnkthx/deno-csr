import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { buildClient } from "@ggpwnkthx/csr-build";
import type { ManifestEntry } from "@ggpwnkthx/csr-manifest";

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
  scriptSrc = "/client.js",
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
  name: "e2e: production build produces loadable assets",
  async fn() {
    await cleanupTestDir();

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(
      entryPath,
      `export const greeting = "hello world"; console.log(greeting);`,
    );

    const outdir = resolve(TEST_DIR, "dist");
    await createMinimalHTMLPage(outdir);

    const result = await buildClient({
      entryPoints: entryPath,
      outdir,
      rootDir: TEST_DIR,
    });

    assertEquals(result.outputFiles.length > 0, true);

    const jsFile = result.outputFiles.find((f) => f.endsWith(".js"));
    assertEquals(jsFile !== undefined, true);

    const jsContent = await Deno.readTextFile(resolve(outdir, jsFile!));
    assertEquals(jsContent.includes("hello world"), true);
  },
});

Deno.test({
  name: "e2e: manifest drives asset lookup correctly",
  async fn() {
    await cleanupTestDir();

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(entryPath, `export const x = 1;`);

    const outdir = resolve(TEST_DIR, "dist");
    await createMinimalHTMLPage(outdir);

    const result = await buildClient({
      entryPoints: entryPath,
      outdir,
      rootDir: TEST_DIR,
    });

    assertEquals(result.manifestPath !== null, true);

    const manifestContent = await Deno.readTextFile(result.manifestPath!);
    const manifest = JSON.parse(manifestContent);

    assertEquals(manifest.version, 1);
    assertEquals(typeof manifest.timestamp, "string");
    assertEquals(Object.keys(manifest.entries).length > 0, true);

    const firstEntry = Object.values(manifest.entries)[0] as ManifestEntry;
    assertEquals(typeof firstEntry.originalPath, "string");
    assertEquals(typeof firstEntry.outputFile, "string");
    assertEquals(typeof firstEntry.size, "number");
    assertEquals(firstEntry.size > 0, true);
    assertEquals(typeof firstEntry.hash, "string");
    assertEquals(firstEntry.hash.length, 64);
    assertEquals(["js", "css", "asset"].includes(firstEntry.type), true);
  },
});
