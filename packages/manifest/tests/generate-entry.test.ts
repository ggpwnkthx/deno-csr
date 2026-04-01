import { assertEquals, assertRejects } from "@std/assert";
import { resolve } from "@std/path";
import { generateManifestEntry, ManifestError } from "@ggpwnkthx/csr-manifest";

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
  name: "generateManifestEntry creates valid manifest entry",
  async fn() {
    await cleanupTestDir();

    const testFile = resolve(TEST_DIR, "test.js");
    await Deno.writeTextFile(testFile, `console.log("hello");`);

    const entry = await generateManifestEntry("test.js", testFile, TEST_DIR);

    assertEquals(entry.originalPath, "test.js");
    assertEquals(entry.outputFile, "test.js");
    assertEquals(entry.type, "js");
    assertEquals(entry.size > 0, true);
    assertEquals(entry.hash.length, 64);
  },
});

Deno.test({
  name: "generateManifestEntry returns outputFile as provided",
  async fn() {
    await cleanupTestDir();

    const testFile = resolve(TEST_DIR, "test.js");
    await Deno.writeTextFile(testFile, `console.log("hello");`);

    const entry = await generateManifestEntry("test.js", testFile, TEST_DIR);

    assertEquals(entry.outputFile, "test.js");
    assertEquals(entry.originalPath, "test.js");
  },
});

Deno.test({
  name: "generateManifestEntry detects CSS type correctly",
  async fn() {
    await cleanupTestDir();

    const testFile = resolve(TEST_DIR, "style.css");
    await Deno.writeTextFile(testFile, `body { color: red; }`);

    const entry = await generateManifestEntry("style.css", testFile, TEST_DIR);

    assertEquals(entry.type, "css");
  },
});

Deno.test({
  name: "generateManifestEntry detects asset type for unknown extensions",
  async fn() {
    await cleanupTestDir();

    const testFile = resolve(TEST_DIR, "image.png");
    await Deno.writeFile(testFile, new Uint8Array([0x89, 0x50, 0x4e, 0x47]));

    const entry = await generateManifestEntry("image.png", testFile, TEST_DIR);

    assertEquals(entry.type, "asset");
  },
});

Deno.test({
  name: "generateManifestEntry normalizes outputFile to forward slashes",
  async fn() {
    await cleanupTestDir();

    const testFile = resolve(TEST_DIR, "subdir", "test.js");
    await Deno.mkdir(resolve(TEST_DIR, "subdir"), { recursive: true });
    await Deno.writeTextFile(testFile, `console.log("hello");`);

    const entry = await generateManifestEntry("test.js", testFile, TEST_DIR);

    assertEquals(entry.outputFile, "subdir/test.js");
    assertEquals(entry.outputFile.includes("\\"), false);
  },
});

Deno.test({
  name: "generateManifestEntry throws ManifestError for absolute originalPath",
  async fn() {
    await cleanupTestDir();

    const testFile = resolve(TEST_DIR, "test.js");
    await Deno.writeTextFile(testFile, `console.log("hello");`);

    await assertRejects(
      async () => {
        await generateManifestEntry("/absolute/path/test.js", testFile, TEST_DIR);
      },
      ManifestError,
      "must be relative to project root",
    );
  },
});

Deno.test({
  name:
    "generateManifestEntry throws ManifestError for parent traversal at start of originalPath",
  async fn() {
    await cleanupTestDir();

    const testFile = resolve(TEST_DIR, "test.js");
    await Deno.writeTextFile(testFile, `console.log("hello");`);

    await assertRejects(
      async () => {
        await generateManifestEntry("../test.js", testFile, TEST_DIR);
      },
      ManifestError,
      "must not escape project root",
    );
  },
});

Deno.test({
  name:
    "generateManifestEntry throws ManifestError for parent traversal in middle of originalPath",
  async fn() {
    await cleanupTestDir();

    const testFile = resolve(TEST_DIR, "test.js");
    await Deno.writeTextFile(testFile, `console.log("hello");`);

    await assertRejects(
      async () => {
        await generateManifestEntry("foo/../test.js", testFile, TEST_DIR);
      },
      ManifestError,
      "must not escape project root",
    );
  },
});

Deno.test({
  name: "generateManifestEntry throws ManifestError for UNC path in originalPath",
  async fn() {
    await cleanupTestDir();

    const testFile = resolve(TEST_DIR, "test.js");
    await Deno.writeTextFile(testFile, `console.log("hello");`);

    await assertRejects(
      async () => {
        await generateManifestEntry("\\\\server\\share\\test.js", testFile, TEST_DIR);
      },
      ManifestError,
      "must be relative to project root",
    );
  },
});
