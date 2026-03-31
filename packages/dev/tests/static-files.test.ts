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

async function findJsFile(outdir: string, baseName: string): Promise<string | null> {
  for await (const entry of Deno.readDir(outdir)) {
    if (entry.isFile && entry.name.startsWith(baseName) && entry.name.endsWith(".js")) {
      return entry.name;
    }
  }
  return null;
}

Deno.test({
  name: "devClient serves static files",
  async fn() {
    await cleanupTestDir();

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(
      entryPath,
      `export const greeting = "hello world";`,
    );

    const outdir = resolve(TEST_DIR, ".dev");
    const dev = await devClient({
      entryPoints: entryPath,
      outdir,
      port: 19995,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const jsFile = await findJsFile(outdir, "client");
    assertEquals(jsFile !== null, true);

    const response = await fetch(`http://localhost:${dev.port}/${jsFile}`);
    assertEquals(response.ok, true);
    await response.body?.cancel();

    await dev.stop();
  },
});

Deno.test({
  name: "devClient serves static JS and CSS unchanged",
  async fn() {
    await cleanupTestDir();

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(
      entryPath,
      `export const greeting = "hello world";`,
    );

    const outdir = resolve(TEST_DIR, ".dev");
    await Deno.mkdir(outdir, { recursive: true });

    const cssPath = resolve(outdir, "style.css");
    await Deno.writeTextFile(cssPath, "body { color: red; }");

    const dev = await devClient({
      entryPoints: entryPath,
      outdir,
      port: 19992,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const cssResponse = await fetch(`http://localhost:${dev.port}/style.css`);
    assertEquals(cssResponse.ok, true);
    assertEquals(cssResponse.headers.get("content-type"), "text/css");
    const cssContent = await cssResponse.text();
    assertEquals(cssContent, "body { color: red; }");
    assertEquals(cssContent.includes("__csr_dev_live_reload__"), false);

    const jsFile = await findJsFile(outdir, "client");
    assertEquals(jsFile !== null, true);

    const jsResponse = await fetch(`http://localhost:${dev.port}/${jsFile}`);
    assertEquals(jsResponse.ok, true);
    assertEquals(jsResponse.headers.get("content-type"), "text/javascript");
    const jsContent = await jsResponse.text();
    assertEquals(jsContent.includes("__csr_dev_live_reload__"), false);

    await dev.stop();
  },
});
