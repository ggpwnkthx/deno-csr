import { assertEquals, assertRejects } from "@std/assert";
import {
  buildClient,
  resetEsbuildModule,
  setEsbuildModule,
} from "@ggpwnkthx/csr-build";
import { BuildError } from "@ggpwnkthx/csr-shared";
import { resolve } from "@std/path";
import { withStop } from "./helpers.ts";

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
  name: "buildClient produces output files with manifest",
  async fn() {
    await withStop(async () => {
      await cleanupTestDir();

      const entryPath = resolve(TEST_DIR, "client.ts");
      await Deno.writeTextFile(
        entryPath,
        `export const greeting = "hello world";`,
      );

      const outdir = resolve(TEST_DIR, "dist");

      const result = await buildClient({
        entryPoints: entryPath,
        outdir,
        rootDir: TEST_DIR,
        sourcemap: false,
      });

      assertEquals(result.outputFiles.length, 1);
      assertEquals(result.outputFiles[0].endsWith(".js"), true);
      assertEquals(result.manifestPath !== null, true);

      const manifestContent = await Deno.readTextFile(result.manifestPath!);
      const manifest = JSON.parse(manifestContent);
      assertEquals(manifest.version, 1);
      assertEquals(typeof manifest.timestamp, "string");
      assertEquals(typeof manifest.entries, "object");
    });
  },
});

Deno.test({
  name: "buildClient produces normalized paths in manifest",
  async fn() {
    await withStop(async () => {
      await cleanupTestDir();

      const entryPath = resolve(TEST_DIR, "client.ts");
      await Deno.writeTextFile(entryPath, `export const x = 1;`);

      const outdir = resolve(TEST_DIR, "dist");

      const result = await buildClient({
        entryPoints: entryPath,
        outdir,
        rootDir: TEST_DIR,
        sourcemap: false,
      });

      const manifestContent = await Deno.readTextFile(result.manifestPath!);
      const manifest = JSON.parse(manifestContent);
      const entry = manifest.entries["client.ts"];

      assertEquals(entry !== undefined, true);
      assertEquals(entry.outputFile.startsWith("/"), false);
      assertEquals(entry.outputFile.includes("\\"), false);
      assertEquals(entry.outputFile.endsWith(".js"), true);
    });
  },
});

Deno.test({
  name: "buildClient respects outdir option",
  async fn() {
    await withStop(async () => {
      await cleanupTestDir();

      const entryPath = resolve(TEST_DIR, "client.ts");
      await Deno.writeTextFile(entryPath, `export const x = 1;`);

      const customOutdir = resolve(TEST_DIR, "custom-out");

      await buildClient({
        entryPoints: entryPath,
        outdir: customOutdir,
      });

      const outputExists = await Deno.stat(customOutdir).catch(() => null);
      assertEquals(outputExists !== null, true);
    });
  },
});

Deno.test({
  name: "buildClient can disable manifest generation",
  async fn() {
    await withStop(async () => {
      await cleanupTestDir();

      const entryPath = resolve(TEST_DIR, "client.ts");
      await Deno.writeTextFile(entryPath, `export const x = 1;`);

      const result = await buildClient({
        entryPoints: entryPath,
        outdir: resolve(TEST_DIR, "dist"),
        manifest: false,
      });

      assertEquals(result.manifestPath, null);
    });
  },
});

Deno.test({
  name: "buildClient handles multiple entry points",
  async fn() {
    await withStop(async () => {
      await cleanupTestDir();

      const entry1 = resolve(TEST_DIR, "a.ts");
      const entry2 = resolve(TEST_DIR, "b.ts");
      await Deno.writeTextFile(entry1, `export const a = 1;`);
      await Deno.writeTextFile(entry2, `export const b = 2;`);

      const result = await buildClient({
        entryPoints: [entry1, entry2],
        outdir: resolve(TEST_DIR, "dist"),
        rootDir: TEST_DIR,
      });

      assertEquals(result.outputFiles.length, 2);
    });
  },
});

Deno.test({
  name:
    "buildClient produces distinct manifest entries for same basename in different dirs",
  async fn() {
    await withStop(async () => {
      await cleanupTestDir();

      const dirA = resolve(TEST_DIR, "src", "a");
      const dirB = resolve(TEST_DIR, "src", "b");
      await Deno.mkdir(dirA, { recursive: true });
      await Deno.mkdir(dirB, { recursive: true });

      const clientA = resolve(dirA, "client.ts");
      const clientB = resolve(dirB, "client.ts");
      await Deno.writeTextFile(clientA, `export const a = "a";`);
      await Deno.writeTextFile(clientB, `export const b = "b";`);

      const result = await buildClient({
        entryPoints: [clientA, clientB],
        outdir: resolve(TEST_DIR, "dist"),
        rootDir: TEST_DIR,
      });

      const manifestContent = await Deno.readTextFile(result.manifestPath!);
      const manifest = JSON.parse(manifestContent);

      assertEquals(manifest.entries["src/a/client.ts"] !== undefined, true);
      assertEquals(manifest.entries["src/b/client.ts"] !== undefined, true);
      assertEquals(
        manifest.entries["src/a/client.ts"].outputFile
          !== manifest.entries["src/b/client.ts"].outputFile,
        true,
      );
    });
  },
});

Deno.test({
  name: "buildClient manifest keys use forward slashes regardless of OS",
  async fn() {
    await withStop(async () => {
      await cleanupTestDir();

      const entryPath = resolve(TEST_DIR, "client.ts");
      await Deno.writeTextFile(entryPath, `export const x = 1;`);

      const outdir = resolve(TEST_DIR, "dist");

      const result = await buildClient({
        entryPoints: entryPath,
        outdir,
        rootDir: TEST_DIR,
        sourcemap: false,
      });

      const manifestContent = await Deno.readTextFile(result.manifestPath!);
      const manifest = JSON.parse(manifestContent);

      for (const key of Object.keys(manifest.entries)) {
        assertEquals(
          key.includes("\\"),
          false,
          `Key "${key}" should not contain backslash`,
        );
      }
    });
  },
});

Deno.test({
  name: "buildClient merges esbuildOptions correctly",
  async fn() {
    await withStop(async () => {
      await cleanupTestDir();

      const entryPath = resolve(TEST_DIR, "client.ts");
      await Deno.writeTextFile(entryPath, `export const x = 1;`);

      await buildClient({
        entryPoints: entryPath,
        outdir: resolve(TEST_DIR, "dist"),
        esbuildOptions: {
          target: "es2020",
        },
      });
    });
  },
});

Deno.test({
  name: "buildClient emits source maps when sourcemap is true",
  async fn() {
    await withStop(async () => {
      await cleanupTestDir();

      const entryPath = resolve(TEST_DIR, "client.ts");
      await Deno.writeTextFile(entryPath, `export const x = 1;`);

      const outdir = resolve(TEST_DIR, "dist");

      const result = await buildClient({
        entryPoints: entryPath,
        outdir,
        rootDir: TEST_DIR,
        sourcemap: true,
      });

      assertEquals(result.outputFiles.length, 1);
      assertEquals(result.outputFiles[0].endsWith(".js"), true);

      const jsFileName = result.outputFiles[0];
      const mapFilePath = resolve(outdir, jsFileName + ".map");
      const mapFileExists = await Deno.stat(mapFilePath).catch(() => null);
      assertEquals(mapFileExists !== null, true);
    });
  },
});

Deno.test({
  name: "buildClient produces deterministic hashes for same content",
  async fn() {
    await withStop(async () => {
      await cleanupTestDir();

      const entryPath1 = resolve(TEST_DIR, "client1.ts");
      const entryPath2 = resolve(TEST_DIR, "client2.ts");
      await Deno.writeTextFile(entryPath1, `export const x = 1;`);
      await Deno.writeTextFile(entryPath2, `export const x = 1;`);

      const result1 = await buildClient({
        entryPoints: entryPath1,
        outdir: resolve(TEST_DIR, "dist1"),
      });

      const result2 = await buildClient({
        entryPoints: entryPath2,
        outdir: resolve(TEST_DIR, "dist2"),
      });

      const manifest1 = await Deno.readTextFile(result1.manifestPath!);
      const manifest2 = await Deno.readTextFile(result2.manifestPath!);

      const entries1 = JSON.parse(manifest1).entries as Record<
        string,
        { hash?: string }
      >;
      const entries2 = JSON.parse(manifest2).entries as Record<
        string,
        { hash?: string }
      >;

      const hash1 = Object.values(entries1)[0]?.hash;
      const hash2 = Object.values(entries2)[0]?.hash;

      assertEquals(hash1, hash2);
    });
  },
});

Deno.test({
  name: "BuildError is thrown on build failure",
  async fn() {
    const mockBuild = async (
      options: { entryPoints: string | string[]; [key: string]: unknown },
    ) => {
      const entryPoints = options.entryPoints;
      const eps = Array.isArray(entryPoints) ? entryPoints : [entryPoints];
      for (const ep of eps) {
        const content = await Deno.readTextFile(ep);
        if (content.includes("invalid syntax")) {
          return {
            errors: [{
              text: 'Expected identifier but found "="',
              location: {
                file: ep,
                line: 1,
                column: 13,
                lineText: "export const = invalid syntax;",
              },
            }],
            warnings: [],
            outputFiles: [],
            metafile: { outputs: {} },
          };
        }
      }
      return {
        errors: [],
        warnings: [],
        outputFiles: [],
        metafile: { outputs: {} },
      };
    };

    setEsbuildModule({
      build: mockBuild as unknown as typeof import("@ggpwnkthx/esbuild").build,
      formatMessages: (
        msgs: unknown[],
      ): Promise<string[]> =>
        Promise.resolve([
          `Build failed: ${(msgs as { text?: string }[])[0]?.text ?? "error"}`,
        ]),
      stop: async () => {},
    });

    try {
      await withStop(async () => {
        await cleanupTestDir();

        const entryPath = resolve(TEST_DIR, "syntax-error.ts");
        await Deno.writeTextFile(entryPath, `export const = invalid syntax;`);

        await assertRejects(
          async () => {
            await buildClient({
              entryPoints: entryPath,
              outdir: resolve(TEST_DIR, "dist"),
            });
          },
          BuildError,
        );
      });
    } finally {
      resetEsbuildModule();
    }
  },
});

Deno.test({
  name: "buildClient produces identical manifest on unchanged rebuild",
  async fn() {
    await withStop(async () => {
      await cleanupTestDir();

      const entryPath = resolve(TEST_DIR, "stable.ts");
      await Deno.writeTextFile(entryPath, `export const value = 42;`);

      const outdir1 = resolve(TEST_DIR, "dist1");
      const result1 = await buildClient({
        entryPoints: entryPath,
        outdir: outdir1,
      });

      const manifest1 = await Deno.readTextFile(result1.manifestPath!);
      const parsed1 = JSON.parse(manifest1);

      await cleanupTestDir();

      const entryPath2 = resolve(TEST_DIR, "stable2.ts");
      await Deno.writeTextFile(entryPath2, `export const value = 42;`);

      const outdir2 = resolve(TEST_DIR, "dist2");
      const result2 = await buildClient({
        entryPoints: entryPath2,
        outdir: outdir2,
      });

      const manifest2 = await Deno.readTextFile(result2.manifestPath!);
      const parsed2 = JSON.parse(manifest2);

      const hash1 = Object.values(
        parsed1.entries as Record<string, { hash?: string }>,
      )[0]?.hash;
      const hash2 = Object.values(
        parsed2.entries as Record<string, { hash?: string }>,
      )[0]?.hash;

      assertEquals(hash1, hash2);
    });
  },
});
