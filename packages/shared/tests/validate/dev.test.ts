import { assertEquals, assertThrows } from "@std/assert";
import type { DevClientOptions } from "@ggpwnkthx/csr";
import {
  EntryPointValidationError,
  PortValidationError,
  ValidationError,
} from "@ggpwnkthx/csr-shared";
import { validateDevOptions } from "@ggpwnkthx/csr-shared";
import { resolve } from "@std/path";

const TEST_DIR = await Deno.makeTempDir({ prefix: "csr-tooling-validate-test-" });

const VALID_ENTRY = resolve(TEST_DIR, "valid-entry.js");

Deno.test({
  name: "validateDevOptions throws EntryPointValidationError for empty array",
  fn() {
    assertThrows(
      () => validateDevOptions({ entryPoints: [], port: 8080 }),
      EntryPointValidationError,
      "At least one entry point is required.",
    );
  },
});

Deno.test({
  name: "validateDevOptions throws PortValidationError for port below range",
  fn() {
    Deno.writeFileSync(VALID_ENTRY, new Uint8Array());
    assertThrows(
      () => validateDevOptions({ entryPoints: VALID_ENTRY, port: 0 }),
      PortValidationError,
      "Port must be an integer between 1 and 65535",
    );
  },
});

Deno.test({
  name: "validateDevOptions throws PortValidationError for port above range",
  fn() {
    assertThrows(
      () => validateDevOptions({ entryPoints: VALID_ENTRY, port: 65536 }),
      PortValidationError,
      "Port must be an integer between 1 and 65535",
    );
  },
});

Deno.test({
  name: "validateDevOptions throws PortValidationError for negative port",
  fn() {
    assertThrows(
      () => validateDevOptions({ entryPoints: VALID_ENTRY, port: -1 }),
      PortValidationError,
      "Port must be an integer between 1 and 65535",
    );
  },
});

Deno.test({
  name: "validateDevOptions throws PortValidationError for non-integer port",
  fn() {
    assertThrows(
      () => validateDevOptions({ entryPoints: VALID_ENTRY, port: 8080.5 }),
      PortValidationError,
      "Port must be an integer between 1 and 65535",
    );
  },
});

Deno.test({
  name:
    "validateDevOptions throws ValidationError for esbuildOptions with owned fields",
  fn() {
    assertThrows(
      () =>
        validateDevOptions({
          entryPoints: VALID_ENTRY,
          port: 8080,
          esbuildOptions: {
            entryPoints: ["a.js"],
            platform: "browser",
          } as DevClientOptions["esbuildOptions"],
        }),
      ValidationError,
      "esbuildOptions contains package-owned fields that cannot be overridden",
    );
  },
});

Deno.test({
  name: "validateDevOptions accepts valid options",
  fn() {
    const result = validateDevOptions({
      entryPoints: VALID_ENTRY,
      outdir: ".dev",
      port: 8080,
    });

    assertEquals(result.entryPoints.length, 1);
    assertEquals(result.outdir.includes(".dev"), true);
    assertEquals(result.port, 8080);
  },
});

Deno.test({
  name: "validateDevOptions throws PortValidationError for missing port",
  fn() {
    assertThrows(
      () =>
        validateDevOptions({
          entryPoints: VALID_ENTRY,
          port: undefined as unknown as number,
        }),
      PortValidationError,
      "Port must be an integer",
    );
  },
});
