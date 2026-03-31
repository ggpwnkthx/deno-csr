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
<script type="module" src="/client.js"></script>
</body>
</html>`;
  await Deno.writeTextFile(htmlPath, htmlContent);
}

Deno.test({
  name: "devClient injects live reload into served HTML",
  async fn() {
    await cleanupTestDir();

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(
      entryPath,
      `export const greeting = "hello world";`,
    );

    const outdir = resolve(TEST_DIR, ".dev");
    await createMinimalHTMLPage(outdir);

    const dev = await devClient({
      entryPoints: entryPath,
      outdir,
      port: 19993,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const rootResponse = await fetch(`http://localhost:${dev.port}/`);
    assertEquals(rootResponse.ok, true);
    assertEquals(rootResponse.headers.get("content-type"), "text/html");
    const rootHtml = await rootResponse.text();
    assertEquals(rootHtml.includes("EventSource"), true);
    assertEquals(rootHtml.includes("__csr_dev_live_reload__"), true);
    assertEquals(
      rootHtml.includes('<script type="module" src="/client.js"></script>'),
      true,
    );

    const indexResponse = await fetch(`http://localhost:${dev.port}/index.html`);
    assertEquals(indexResponse.ok, true);
    assertEquals(indexResponse.headers.get("content-type"), "text/html");
    const indexHtml = await indexResponse.text();
    assertEquals(indexHtml.includes("EventSource"), true);
    assertEquals(indexHtml.includes("__csr_dev_live_reload__"), true);

    await dev.stop();
  },
});

Deno.test({
  name: "devClient injects live reload before </body> tag",
  async fn() {
    await cleanupTestDir();

    const outdir = resolve(TEST_DIR, ".dev-no-body");
    await Deno.mkdir(outdir, { recursive: true });

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(entryPath, `export const value = 1;`);

    const htmlWithoutBody = `<!DOCTYPE html>
<html>
<head><title>No Body</title></head>
<script>console.log("test");</script>
</html>`;
    const htmlPath = resolve(outdir, "no-body.html");
    await Deno.writeTextFile(htmlPath, htmlWithoutBody);

    const dev = await devClient({
      entryPoints: resolve(TEST_DIR, "client.ts"),
      outdir,
      port: 19991,
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const response = await fetch(`http://localhost:${dev.port}/no-body.html`);
    const html = await response.text();
    assertEquals(html.includes("</body>"), false);
    assertEquals(html.includes("EventSource"), true);
    assertEquals(html.includes("__csr_dev_live_reload__"), true);
    assertEquals(html.includes('<script>console.log("test");</script>'), true);

    await dev.stop();
  },
});
