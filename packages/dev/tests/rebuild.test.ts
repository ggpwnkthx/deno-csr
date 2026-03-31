import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { devClient } from "@ggpwnkthx/csr-dev";

const TEST_DIR = await Deno.makeTempDir({ prefix: "csr-tooling-smoke-test-" });

async function cleanupTestDir() {
  try {
    for await (const entry of Deno.readDir(TEST_DIR)) {
      await Deno.remove(resolve(TEST_DIR, entry.name), { recursive: true });
    }
  } catch {
    // ignore
  }
}

async function createMinimalHTMLPage(outdir: string): Promise<void> {
  await Deno.mkdir(outdir, { recursive: true });
  const htmlPath = resolve(outdir, "index.html");
  const htmlContent = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
<script type="module" src="/@entry/client"></script>
</body>
</html>`;
  await Deno.writeTextFile(htmlPath, htmlContent);
}

async function findJsFile(outdir: string, baseName: string): Promise<string | null> {
  for await (const entry of Deno.readDir(outdir)) {
    if (entry.isFile && entry.name.startsWith(baseName) && entry.name.endsWith(".js")) {
      return entry.name;
    }
  }
  return null;
}

Deno.test({
  name: "devClient rebuilds when imported dependency changes",
  async fn() {
    await cleanupTestDir();

    const depPath = resolve(TEST_DIR, "utils.ts");
    await Deno.writeTextFile(depPath, `export const version = 1;`);

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(
      entryPath,
      `import { version } from "./utils.ts"; export const greeting = "hello v" + version;`,
    );

    const outdir = resolve(TEST_DIR, ".dev");
    await createMinimalHTMLPage(outdir);

    const dev = await devClient({
      entryPoints: entryPath,
      outdir,
      port: 19994,
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const jsFile = await findJsFile(outdir, "client");
    assertEquals(jsFile !== null, true);
    const jsPath = resolve(outdir, jsFile!);
    const initialContent = await Deno.readTextFile(jsPath);
    assertEquals(initialContent.includes("var version = 1"), true);

    await Deno.writeTextFile(depPath, `export const version = 2;`);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const updatedJsFile = await findJsFile(outdir, "client");
    assertEquals(updatedJsFile !== null, true);
    const updatedContent = await Deno.readTextFile(resolve(outdir, updatedJsFile!));
    assertEquals(updatedContent.includes("var version = 2"), true);

    await dev.stop();
  },
});
