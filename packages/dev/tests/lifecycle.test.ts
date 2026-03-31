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

Deno.test({
  name: "devClient starts and stops cleanly",
  async fn() {
    await cleanupTestDir();

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(
      entryPath,
      `export const greeting = "hello world";`,
    );

    const dev = await devClient({
      entryPoints: entryPath,
      outdir: resolve(TEST_DIR, ".dev"),
      port: 19999,
    });

    assertEquals(typeof dev.port, "number");
    assertEquals(dev.port > 0, true);
    assertEquals(typeof dev.stop, "function");

    await dev.stop();
  },
});

Deno.test({
  name: "devClient creates output files on startup",
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
      port: 19998,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const outdirExists = await Deno.stat(outdir).catch(() => null);
    assertEquals(outdirExists !== null, true);

    const files = [];
    for await (const entry of Deno.readDir(outdir)) {
      if (!entry.name.startsWith(".")) {
        files.push(entry.name);
      }
    }
    assertEquals(files.length > 0, true);

    await dev.stop();
  },
});

Deno.test({
  name: "devClient can be stopped and restarted",
  async fn() {
    await cleanupTestDir();

    const entryPath = resolve(TEST_DIR, "client.ts");
    await Deno.writeTextFile(
      entryPath,
      `export const greeting = "hello world";`,
    );

    const outdir = resolve(TEST_DIR, ".dev");
    const dev1 = await devClient({
      entryPoints: entryPath,
      outdir,
      port: 19997,
    });

    const port1 = dev1.port;
    await dev1.stop();

    const dev2 = await devClient({
      entryPoints: entryPath,
      outdir,
      port: 19996,
    });

    assertEquals(dev2.port !== port1, true);

    await dev2.stop();
  },
});

Deno.test({
  name: "devClient handles multiple rapid start/stop cycles",
  async fn() {
    await cleanupTestDir();

    const entryPath = resolve(TEST_DIR, "rapid.ts");
    await Deno.writeTextFile(entryPath, `export const value = 1;`);

    const outdir = resolve(TEST_DIR, ".dev-rapid");
    const basePort = 19800;

    for (let i = 0; i < 3; i++) {
      const dev = await devClient({
        entryPoints: entryPath,
        outdir,
        port: basePort + i,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      await dev.stop();
    }

    await cleanupTestDir();
  },
});
