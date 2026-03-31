import { assertRejects } from "@std/assert";
import { buildClient } from "@ggpwnkthx/csr-build";
import { resolve } from "@std/path";

const TEST_DIR = await Deno.makeTempDir({ prefix: "csr-dev-build-test-" });

async function cleanupTestDir() {
  try {
    for await (const entry of Deno.readDir(TEST_DIR)) {
      await Deno.remove(resolve(TEST_DIR, entry.name), { recursive: true });
    }
  } catch {
    // ignore
  }
}

Deno.test({
  name: "buildClient throws ValidationError for empty entry points",
  async fn() {
    await cleanupTestDir();
    const entryPath = resolve(TEST_DIR, "entry.js");
    await Deno.writeTextFile(entryPath, "console.log('hello');");

    await assertRejects(
      async () => {
        await buildClient({
          entryPoints: [],
          outdir: resolve(TEST_DIR, "dist"),
        });
      },
      Error,
      "At least one entry point is required",
    );
  },
});

Deno.test({
  name: "buildClient throws ValidationError for missing entry file",
  async fn() {
    await cleanupTestDir();

    await assertRejects(
      async () => {
        await buildClient({
          entryPoints: resolve(TEST_DIR, "nonexistent.js"),
          outdir: resolve(TEST_DIR, "dist"),
        });
      },
      Error,
    );
  },
});
