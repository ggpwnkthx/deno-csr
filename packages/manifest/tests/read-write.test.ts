import { assertEquals, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import {
  buildManifest,
  type ManifestEntry,
  readManifest,
  writeManifest,
} from "@ggpwnkthx/csr-manifest";

const TEST_DIR = await Deno.makeTempDir({ prefix: "csr-tooling-manifest-test-" });

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
  name: "writeManifest and readManifest roundtrip",
  async fn() {
    await cleanupTestDir();

    const entries: Record<string, ManifestEntry> = {
      "client.ts": {
        originalPath: "client.ts",
        outputFile: "client.js",
        size: 100,
        hash: "a".repeat(64),
        type: "js",
      },
    };

    const manifest = buildManifest(entries);
    const manifestPath = await writeManifest(manifest, TEST_DIR);

    assertEquals(manifestPath, resolve(TEST_DIR, "manifest.json"));

    const fileExists = await Deno.stat(manifestPath);
    assertEquals(fileExists.isFile, true);

    const readBack = await readManifest(manifestPath);
    assertEquals(readBack.version, manifest.version);
    assertEquals(readBack.entries["client.ts"].hash, "a".repeat(64));
  },
});

Deno.test({
  name: "manifest roundtrip works with normalized paths",
  async fn() {
    await cleanupTestDir();

    const entries: Record<string, ManifestEntry> = {
      "src/client.ts": {
        originalPath: "src/client.ts",
        outputFile: "dist/client.a1b2c3d4.js",
        size: 100,
        hash: "a".repeat(64),
        type: "js",
      },
    };

    const manifest = buildManifest(entries);
    const manifestPath = await writeManifest(manifest, TEST_DIR);
    const readBack = await readManifest(manifestPath);

    assertEquals(
      readBack.entries["src/client.ts"].outputFile,
      "dist/client.a1b2c3d4.js",
    );
    assertEquals(readBack.entries["src/client.ts"].originalPath, "src/client.ts");
  },
});

Deno.test({
  name: "readManifest validates timestamp when option provided",
  async fn() {
    await cleanupTestDir();

    const entries: Record<string, ManifestEntry> = {
      "client.ts": {
        originalPath: "client.ts",
        outputFile: "client.js",
        size: 100,
        hash: "a".repeat(64),
        type: "js",
      },
    };

    const manifest = buildManifest(entries, {
      timestamp: "2026-03-28T12:00:00.000Z",
    });
    const manifestPath = await writeManifest(manifest, TEST_DIR);

    await assertRejects(
      async () => {
        await readManifest(manifestPath, {
          timestamp: "2026-01-01T00:00:00.000Z",
        });
      },
      Error,
      "timestamp mismatch",
    );

    const validRead = await readManifest(manifestPath, {
      timestamp: "2026-03-28T12:00:00.000Z",
    });
    assertEquals(validRead.timestamp, "2026-03-28T12:00:00.000Z");
  },
});
