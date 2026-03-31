import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { hashFile } from "@ggpwnkthx/csr-shared";

const TEST_DIR = await Deno.makeTempDir({ prefix: "csr-tooling-hash-test-" });

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
  name: "hashFile produces correct SHA-256 for known input",
  async fn() {
    await cleanupTestDir();
    const testFile = resolve(TEST_DIR, "hello.txt");
    await Deno.writeTextFile(testFile, "hello");
    const hash = await hashFile(testFile);
    assertEquals(
      hash,
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  },
});

Deno.test({
  name: "hashFile returns 64-character hex string",
  async fn() {
    await cleanupTestDir();
    const testFile = resolve(TEST_DIR, "test.txt");
    await Deno.writeTextFile(testFile, "some content");
    const hash = await hashFile(testFile);
    assertEquals(hash.length, 64);
    assertEquals(/^[a-f0-9]{64}$/.test(hash), true);
  },
});

Deno.test({
  name: "hashFile produces same hash for identical content",
  async fn() {
    await cleanupTestDir();
    const file1 = resolve(TEST_DIR, "file1.txt");
    const file2 = resolve(TEST_DIR, "file2.txt");
    await Deno.writeTextFile(file1, "identical content");
    await Deno.writeTextFile(file2, "identical content");
    const hash1 = await hashFile(file1);
    const hash2 = await hashFile(file2);
    assertEquals(hash1, hash2);
  },
});

Deno.test({
  name: "hashFile produces different hashes for different content",
  async fn() {
    await cleanupTestDir();
    const file1 = resolve(TEST_DIR, "file1.txt");
    const file2 = resolve(TEST_DIR, "file2.txt");
    await Deno.writeTextFile(file1, "content a");
    await Deno.writeTextFile(file2, "content b");
    const hash1 = await hashFile(file1);
    const hash2 = await hashFile(file2);
    assertEquals(hash1 !== hash2, true);
  },
});

Deno.test({
  name: "hashFile handles binary content correctly",
  async fn() {
    await cleanupTestDir();
    const testFile = resolve(TEST_DIR, "binary.bin");
    const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    await Deno.writeFile(testFile, binaryData);
    const hash = await hashFile(testFile);
    assertEquals(hash.length, 64);
    assertEquals(/^[a-f0-9]{64}$/.test(hash), true);
  },
});

Deno.test({
  name: "hashFile produces correct SHA-256 for empty file",
  async fn() {
    await cleanupTestDir();
    const testFile = resolve(TEST_DIR, "empty.bin");
    await Deno.writeFile(testFile, new Uint8Array(0));
    const hash = await hashFile(testFile);
    assertEquals(
      hash,
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  },
});

Deno.test({
  name: "hashFile produces correct SHA-256 for 56-byte file (pre-padding boundary)",
  async fn() {
    await cleanupTestDir();
    const testFile = resolve(TEST_DIR, "56bytes.bin");
    const data = new Uint8Array(56);
    data.fill(0x61);
    await Deno.writeFile(testFile, data);
    const hash = await hashFile(testFile);
    assertEquals(hash.length, 64);
    assertEquals(/^[a-f0-9]{64}$/.test(hash), true);
  },
});

Deno.test({
  name: "hashFile produces correct SHA-256 for 64-byte file (exactly one block)",
  async fn() {
    await cleanupTestDir();
    const testFile = resolve(TEST_DIR, "64bytes.bin");
    const data = new Uint8Array(64);
    data.fill(0x62);
    await Deno.writeFile(testFile, data);
    const hash = await hashFile(testFile);
    assertEquals(hash.length, 64);
    assertEquals(/^[a-f0-9]{64}$/.test(hash), true);
  },
});

Deno.test({
  name: "hashFile produces correct SHA-256 for 128-byte file (two blocks)",
  async fn() {
    await cleanupTestDir();
    const testFile = resolve(TEST_DIR, "128bytes.bin");
    const data = new Uint8Array(128);
    data.fill(0x63);
    await Deno.writeFile(testFile, data);
    const hash = await hashFile(testFile);
    assertEquals(hash.length, 64);
    assertEquals(/^[a-f0-9]{64}$/.test(hash), true);
  },
});
