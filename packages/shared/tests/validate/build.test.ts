import { assertEquals, assertThrows } from "@std/assert";
import type { BuildClientOptions } from "@ggpwnkthx/csr";
import {
  EntryPointValidationError,
  OutdirValidationError,
  ValidationError,
} from "@ggpwnkthx/csr-shared";
import { validateBuildOptions } from "@ggpwnkthx/csr-shared";
import { resolve } from "@std/path";

const TEST_DIR = await Deno.makeTempDir({ prefix: "csr-tooling-validate-test-" });

const VALID_ENTRY = resolve(TEST_DIR, "valid-entry.js");

Deno.test({
  name: "validateBuildOptions throws EntryPointValidationError for empty array",
  fn() {
    assertThrows(
      () => validateBuildOptions({ entryPoints: [] }),
      EntryPointValidationError,
      "At least one entry point is required.",
    );
  },
});

Deno.test({
  name: "validateBuildOptions throws EntryPointValidationError for missing entry file",
  fn() {
    assertThrows(
      () => validateBuildOptions({ entryPoints: resolve(TEST_DIR, "nonexistent.js") }),
      EntryPointValidationError,
      "Entry point does not exist or is not a file",
    );
  },
});

Deno.test({
  name: "validateBuildOptions throws OutdirValidationError for empty outdir",
  fn() {
    Deno.writeFileSync(VALID_ENTRY, new Uint8Array());
    assertThrows(
      () => validateBuildOptions({ entryPoints: VALID_ENTRY, outdir: "" }),
      OutdirValidationError,
      "outdir cannot be empty.",
    );
  },
});

Deno.test({
  name: "validateBuildOptions throws OutdirValidationError for whitespace-only outdir",
  fn() {
    assertThrows(
      () =>
        validateBuildOptions({
          entryPoints: VALID_ENTRY,
          outdir: "   ",
        }),
      OutdirValidationError,
      "outdir cannot be empty.",
    );
  },
});

Deno.test({
  name:
    "validateBuildOptions throws ValidationError for esbuildOptions with owned fields",
  fn() {
    assertThrows(
      () =>
        validateBuildOptions({
          entryPoints: VALID_ENTRY,
          esbuildOptions: { bundle: true, format: "esm" },
        }),
      ValidationError,
      "esbuildOptions contains package-owned fields that cannot be overridden",
    );
  },
});

Deno.test({
  name: "validateBuildOptions throws ValidationError for function in esbuildOptions",
  fn() {
    assertThrows(
      () =>
        validateBuildOptions({
          entryPoints: VALID_ENTRY,
          esbuildOptions: {
            onResolve: () => {},
          } as BuildClientOptions["esbuildOptions"],
        }),
      ValidationError,
      "function value",
    );
  },
});

Deno.test({
  name: "validateBuildOptions throws for platform in esbuildOptions",
  fn() {
    assertThrows(
      () =>
        validateBuildOptions({
          entryPoints: VALID_ENTRY,
          esbuildOptions: { platform: "browser" },
        }),
      ValidationError,
      "platform",
    );
  },
});

Deno.test({
  name: "validateBuildOptions throws for splitting in esbuildOptions",
  fn() {
    assertThrows(
      () =>
        validateBuildOptions({
          entryPoints: VALID_ENTRY,
          esbuildOptions: { splitting: true },
        }),
      ValidationError,
      "splitting",
    );
  },
});

Deno.test({
  name: "validateBuildOptions throws for minify in esbuildOptions",
  fn() {
    assertThrows(
      () =>
        validateBuildOptions({
          entryPoints: VALID_ENTRY,
          esbuildOptions: { minify: true },
        }),
      ValidationError,
      "minify",
    );
  },
});

Deno.test({
  name: "validateBuildOptions throws for entryNames in esbuildOptions",
  fn() {
    assertThrows(
      () =>
        validateBuildOptions({
          entryPoints: VALID_ENTRY,
          esbuildOptions: {
            entryNames: "[name]",
          } as BuildClientOptions["esbuildOptions"],
        }),
      ValidationError,
      "entryNames",
    );
  },
});

Deno.test({
  name: "validateBuildOptions throws for assetNames in esbuildOptions",
  fn() {
    assertThrows(
      () =>
        validateBuildOptions({
          entryPoints: VALID_ENTRY,
          esbuildOptions: {
            assetNames: "[name]",
          } as BuildClientOptions["esbuildOptions"],
        }),
      ValidationError,
      "assetNames",
    );
  },
});

Deno.test({
  name: "validateBuildOptions throws for chunkNames in esbuildOptions",
  fn() {
    assertThrows(
      () =>
        validateBuildOptions({
          entryPoints: VALID_ENTRY,
          esbuildOptions: {
            chunkNames: "[name]",
          } as BuildClientOptions["esbuildOptions"],
        }),
      ValidationError,
      "chunkNames",
    );
  },
});

Deno.test({
  name: "validateBuildOptions accepts valid options",
  fn() {
    const result = validateBuildOptions({
      entryPoints: VALID_ENTRY,
      outdir: "custom-out",
      esbuildOptions: { target: "es2020" },
    });

    assertEquals(result.entryPoints.length, 1);
    assertEquals(result.outdir.includes("custom-out"), true);
    assertEquals(result.manifest, true);
    assertEquals(result.sourcemap, false);
  },
});

Deno.test({
  name: "validateBuildOptions accepts valid esbuildOptions",
  fn() {
    const result = validateBuildOptions({
      entryPoints: VALID_ENTRY,
      esbuildOptions: {
        target: "es2020",
        loader: { ".svg": "dataurl" },
      },
    });

    assertEquals(result.esbuildOptions, {
      target: "es2020",
      loader: { ".svg": "dataurl" },
    });
  },
});

Deno.test({
  name: "validateBuildOptions uses cwd when rootDir is not provided",
  fn() {
    const result = validateBuildOptions({
      entryPoints: VALID_ENTRY,
    });

    assertEquals(result.rootDir, Deno.cwd());
  },
});

Deno.test({
  name: "validateBuildOptions accepts valid rootDir",
  fn() {
    const result = validateBuildOptions({
      entryPoints: VALID_ENTRY,
      rootDir: TEST_DIR,
    });

    assertEquals(result.rootDir, TEST_DIR);
  },
});

Deno.test({
  name: "validateBuildOptions throws ValidationError for non-existent rootDir",
  fn() {
    assertThrows(
      () =>
        validateBuildOptions({
          entryPoints: VALID_ENTRY,
          rootDir: resolve(TEST_DIR, "nonexistent"),
        }),
      ValidationError,
      "rootDir does not exist",
    );
  },
});

Deno.test({
  name: "validateBuildOptions throws ValidationError when rootDir is not a directory",
  fn() {
    assertThrows(
      () =>
        validateBuildOptions({
          entryPoints: VALID_ENTRY,
          rootDir: VALID_ENTRY,
        }),
      ValidationError,
      "rootDir must be a directory",
    );
  },
});
