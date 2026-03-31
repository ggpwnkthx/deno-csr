import { assertEquals } from "@std/assert";
import { buildManifest, type ManifestEntry } from "@ggpwnkthx/csr-manifest";

Deno.test({
  name: "buildManifest creates valid manifest structure",
  fn() {
    const entries: Record<string, ManifestEntry> = {
      "client.ts": {
        originalPath: "client.ts",
        outputFile: "client.a1b2c3d4.js",
        size: 1024,
        hash: "a".repeat(64),
        type: "js",
      },
    };

    const manifest = buildManifest(entries);

    assertEquals(manifest.version, 1);
    assertEquals(typeof manifest.timestamp, "string");
    assertEquals(Object.keys(manifest.entries).length, 1);
    assertEquals(manifest.entries["client.ts"].outputFile, "client.a1b2c3d4.js");
  },
});

Deno.test({
  name: "buildManifest handles multiple entries",
  fn() {
    const entries: Record<string, ManifestEntry> = {
      "a.ts": {
        originalPath: "a.ts",
        outputFile: "a.js",
        size: 100,
        hash: "a".repeat(64),
        type: "js",
      },
      "b.ts": {
        originalPath: "b.ts",
        outputFile: "b.js",
        size: 200,
        hash: "b".repeat(64),
        type: "js",
      },
      "style.css": {
        originalPath: "style.css",
        outputFile: "style.css",
        size: 50,
        hash: "c".repeat(64),
        type: "css",
      },
    };

    const manifest = buildManifest(entries);

    assertEquals(Object.keys(manifest.entries).length, 3);
    assertEquals(manifest.entries["a.ts"].hash, "a".repeat(64));
    assertEquals(manifest.entries["b.ts"].hash, "b".repeat(64));
    assertEquals(manifest.entries["style.css"].hash, "c".repeat(64));
    assertEquals(manifest.entries["style.css"].type, "css");
  },
});

Deno.test({
  name: "buildManifest auto-generates timestamp when not injected",
  fn() {
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

    assertEquals(typeof manifest.timestamp, "string");
    assertEquals(manifest.timestamp.length > 0, true);
  },
});

Deno.test({
  name: "buildManifest includes timestamp when injected",
  fn() {
    const entries: Record<string, ManifestEntry> = {
      "client.ts": {
        originalPath: "client.ts",
        outputFile: "client.js",
        size: 100,
        hash: "a".repeat(64),
        type: "js",
      },
    };

    const testTimestamp = "2026-03-28T12:00:00.000Z";
    const manifest = buildManifest(entries, { timestamp: testTimestamp });

    assertEquals(manifest.timestamp, testTimestamp);
  },
});

Deno.test({
  name: "buildManifest sorts entries by originalPath",
  fn() {
    const entries: Record<string, ManifestEntry> = {
      "z.ts": {
        originalPath: "z.ts",
        outputFile: "z.js",
        size: 100,
        hash: "z".repeat(64),
        type: "js",
      },
      "a.ts": {
        originalPath: "a.ts",
        outputFile: "a.js",
        size: 100,
        hash: "a".repeat(64),
        type: "js",
      },
      "m.ts": {
        originalPath: "m.ts",
        outputFile: "m.js",
        size: 100,
        hash: "m".repeat(64),
        type: "js",
      },
    };

    const manifest = buildManifest(entries);
    const keys = Object.keys(manifest.entries);

    assertEquals(keys, ["a.ts", "m.ts", "z.ts"]);
  },
});

Deno.test({
  name: "buildManifest preserves outputFile exactly as provided",
  fn() {
    const entries: Record<string, ManifestEntry> = {
      "client.ts": {
        originalPath: "client.ts",
        outputFile: "dist/client.a1b2c3d4.js",
        size: 100,
        hash: "a".repeat(64),
        type: "js",
      },
      "style.css": {
        originalPath: "style.css",
        outputFile: "dist/style.a1b2c3d4.css",
        size: 50,
        hash: "b".repeat(64),
        type: "css",
      },
    };

    const manifest = buildManifest(entries);

    assertEquals(
      manifest.entries["client.ts"].outputFile,
      "dist/client.a1b2c3d4.js",
    );
    assertEquals(
      manifest.entries["style.css"].outputFile,
      "dist/style.a1b2c3d4.css",
    );
  },
});

Deno.test({
  name: "buildManifest produces stable entry ordering",
  fn() {
    const entries: Record<string, ManifestEntry> = {
      "a.ts": {
        originalPath: "a.ts",
        outputFile: "a.js",
        size: 100,
        hash: "a".repeat(64),
        type: "js",
      },
      "b.ts": {
        originalPath: "b.ts",
        outputFile: "b.js",
        size: 100,
        hash: "b".repeat(64),
        type: "js",
      },
      "c.ts": {
        originalPath: "c.ts",
        outputFile: "c.js",
        size: 100,
        hash: "c".repeat(64),
        type: "js",
      },
    };

    const manifest1 = buildManifest(entries);
    const manifest2 = buildManifest(entries);

    const keys1 = Object.keys(manifest1.entries);
    const keys2 = Object.keys(manifest2.entries);

    assertEquals(keys1, keys2);
    assertEquals(keys1, ["a.ts", "b.ts", "c.ts"]);
  },
});

Deno.test({
  name: "buildManifest includes assets array when provided",
  fn() {
    const entries: Record<string, ManifestEntry> = {
      "client.ts": {
        originalPath: "client.ts",
        outputFile: "client.js",
        size: 100,
        hash: "a".repeat(64),
        type: "js",
      },
    };

    const assets = [
      {
        outputFile: "chunk.b2c3d4e5.js",
        size: 200,
        hash: "b".repeat(64),
        type: "js" as const,
        kind: "chunk" as const,
      },
      {
        outputFile: "assets/icon.c3d4e5f6.png",
        size: 50,
        hash: "c".repeat(64),
        type: "asset" as const,
        kind: "asset" as const,
      },
    ];

    const manifest = buildManifest(entries, undefined, assets);

    assertEquals(Object.keys(manifest.entries).length, 1);
    assertEquals(manifest.assets?.length, 2);
    assertEquals(manifest.assets?.[0].outputFile, "chunk.b2c3d4e5.js");
    assertEquals(manifest.assets?.[0].kind, "chunk");
    assertEquals(manifest.assets?.[1].outputFile, "assets/icon.c3d4e5f6.png");
    assertEquals(manifest.assets?.[1].kind, "asset");
  },
});
