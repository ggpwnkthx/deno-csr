import { assertEquals, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import {
  buildManifest,
  type ManifestEntry,
  ManifestError,
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
  name: "readManifest throws ManifestError for non-existent file",
  async fn() {
    await cleanupTestDir();

    const nonExistentPath = resolve(TEST_DIR, "nonexistent.json");

    await assertRejects(
      async () => {
        await readManifest(nonExistentPath);
      },
      ManifestError,
      "Manifest not found",
    );
  },
});

Deno.test({
  name: "readManifest throws ManifestError for invalid version",
  async fn() {
    await cleanupTestDir();

    const invalidManifest = {
      version: 999,
      timestamp: new Date().toISOString(),
      entries: {},
    };

    const manifestPath = resolve(TEST_DIR, "invalid-manifest.json");
    await Deno.writeTextFile(manifestPath, JSON.stringify(invalidManifest));

    await assertRejects(
      async () => {
        await readManifest(manifestPath);
      },
      ManifestError,
      "Unsupported manifest version",
    );
  },
});

Deno.test({
  name: "readManifest throws ManifestError for missing entries",
  async fn() {
    await cleanupTestDir();

    const invalidManifest = {
      version: 1,
      timestamp: new Date().toISOString(),
    };

    const manifestPath = resolve(TEST_DIR, "invalid-manifest.json");
    await Deno.writeTextFile(manifestPath, JSON.stringify(invalidManifest));

    await assertRejects(
      async () => {
        await readManifest(manifestPath);
      },
      ManifestError,
      "missing valid entries",
    );
  },
});

Deno.test({
  name: "readManifest rejects malformed entry with invalid hash",
  async fn() {
    await cleanupTestDir();

    const invalidManifest = {
      version: 1,
      entries: {
        "client.ts": {
          originalPath: "client.ts",
          outputFile: "client.js",
          size: 100,
          hash: "short",
          type: "js",
        },
      },
    };

    const manifestPath = resolve(TEST_DIR, "invalid-manifest.json");
    await Deno.writeTextFile(manifestPath, JSON.stringify(invalidManifest));

    await assertRejects(
      async () => {
        await readManifest(manifestPath);
      },
      ManifestError,
      "invalid hash",
    );
  },
});

Deno.test({
  name: "readManifest rejects malformed entry with invalid type",
  async fn() {
    await cleanupTestDir();

    const invalidManifest = {
      version: 1,
      entries: {
        "client.ts": {
          originalPath: "client.ts",
          outputFile: "client.js",
          size: 100,
          hash: "a".repeat(64),
          type: "invalid",
        },
      },
    };

    const manifestPath = resolve(TEST_DIR, "invalid-manifest.json");
    await Deno.writeTextFile(manifestPath, JSON.stringify(invalidManifest));

    await assertRejects(
      async () => {
        await readManifest(manifestPath);
      },
      ManifestError,
      "invalid type",
    );
  },
});

Deno.test({
  name: "readManifest rejects malformed entry with absolute outputFile",
  async fn() {
    await cleanupTestDir();

    const invalidManifest = {
      version: 1,
      entries: {
        "client.ts": {
          originalPath: "client.ts",
          outputFile: "/absolute/path/client.js",
          size: 100,
          hash: "a".repeat(64),
          type: "js",
        },
      },
    };

    const manifestPath = resolve(TEST_DIR, "invalid-manifest.json");
    await Deno.writeTextFile(manifestPath, JSON.stringify(invalidManifest));

    await assertRejects(
      async () => {
        await readManifest(manifestPath);
      },
      ManifestError,
      "must be relative",
    );
  },
});

Deno.test({
  name: "readManifest rejects malformed entry with missing fields",
  async fn() {
    await cleanupTestDir();

    const invalidManifest = {
      version: 1,
      entries: {
        "client.ts": {
          originalPath: "client.ts",
          outputFile: "client.js",
        },
      },
    };

    const manifestPath = resolve(TEST_DIR, "invalid-manifest.json");
    await Deno.writeTextFile(manifestPath, JSON.stringify(invalidManifest));

    await assertRejects(
      async () => {
        await readManifest(manifestPath);
      },
      ManifestError,
      "invalid size",
    );
  },
});

Deno.test({
  name: "readManifest accepts valid manifest with object entries",
  async fn() {
    await cleanupTestDir();

    const validManifest = {
      version: 1,
      entries: {
        "client.ts": {
          originalPath: "client.ts",
          outputFile: "client.js",
          size: 100,
          hash: "a".repeat(64),
          type: "js",
        },
      },
    };

    const manifestPath = resolve(TEST_DIR, "valid-manifest.json");
    await Deno.writeTextFile(manifestPath, JSON.stringify(validManifest));

    const readBack = await readManifest(manifestPath);
    assertEquals(readBack.entries["client.ts"].hash, "a".repeat(64));
  },
});

Deno.test({
  name: "readManifest rejects empty entry",
  async fn() {
    await cleanupTestDir();

    const invalidManifest = {
      version: 1,
      entries: {
        "client.ts": {},
      },
    };

    const manifestPath = resolve(TEST_DIR, "invalid-manifest.json");
    await Deno.writeTextFile(manifestPath, JSON.stringify(invalidManifest));

    await assertRejects(
      async () => {
        await readManifest(manifestPath);
      },
      ManifestError,
      "invalid originalPath",
    );
  },
});

Deno.test({
  name: "buildManifest outputFile with backslashes fails validation",
  async fn() {
    await cleanupTestDir();

    const entries: Record<string, ManifestEntry> = {
      "client.ts": {
        originalPath: "client.ts",
        outputFile: "dist\\client.js",
        size: 100,
        hash: "a".repeat(64),
        type: "js",
      },
    };

    const manifest = buildManifest(entries);
    const manifestPath = await writeManifest(manifest, TEST_DIR);

    await assertRejects(
      async () => {
        await readManifest(manifestPath);
      },
      ManifestError,
      "must be relative to outdir",
    );
  },
});

Deno.test({
  name: "readManifest rejects entry with mid-path /../ traversal in outputFile",
  async fn() {
    await cleanupTestDir();

    const entries: Record<string, ManifestEntry> = {
      "client.ts": {
        originalPath: "client.ts",
        outputFile: "dist/foo/../bar/client.js",
        size: 100,
        hash: "a".repeat(64),
        type: "js",
      },
    };

    const manifest = buildManifest(entries);
    const manifestPath = await writeManifest(manifest, TEST_DIR);

    await assertRejects(
      async () => {
        await readManifest(manifestPath);
      },
      ManifestError,
      "must not escape outdir",
    );
  },
});

Deno.test({
  name: "readManifest rejects entry with mid-path /../ traversal in originalPath",
  async fn() {
    await cleanupTestDir();

    const entries: Record<string, ManifestEntry> = {
      "foo/../client.ts": {
        originalPath: "foo/../client.ts",
        outputFile: "client.js",
        size: 100,
        hash: "a".repeat(64),
        type: "js",
      },
    };

    const manifest = buildManifest(entries);
    const manifestPath = await writeManifest(manifest, TEST_DIR);

    await assertRejects(
      async () => {
        await readManifest(manifestPath);
      },
      ManifestError,
      "must not escape project root",
    );
  },
});

Deno.test({
  name: "readManifest rejects entry with mid-path \\..\\ traversal in outputFile",
  async fn() {
    await cleanupTestDir();

    const entries: Record<string, ManifestEntry> = {
      "client.ts": {
        originalPath: "client.ts",
        outputFile: "foo\\..\\bar\\client.js",
        size: 100,
        hash: "a".repeat(64),
        type: "js",
      },
    };

    const manifest = buildManifest(entries);
    const manifestPath = await writeManifest(manifest, TEST_DIR);

    await assertRejects(
      async () => {
        await readManifest(manifestPath);
      },
      ManifestError,
      "must not escape outdir",
    );
  },
});
