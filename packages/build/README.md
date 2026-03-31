# `@ggpwnkthx/csr-build`

Production client build orchestration with content-hashed assets and manifest generation.

## Installation

```typescript
import {
  buildClient,
  type BuildClientOptions,
  BuildError,
} from "jsr:@ggpwnkthx/csr-build@^0.1";
```

## Usage

### Basic Production Build

```typescript
import { buildClient } from "jsr:@ggpwnkthx/csr-build";

const result = await buildClient({
  entryPoints: ["src/client.ts"],
  outdir: "dist",
});

console.log("Built files:", result.outputFiles);
console.log("Manifest:", result.manifestPath);
```

### Multiple Entry Points with Custom Options

```typescript
const result = await buildClient({
  entryPoints: ["src/client.ts", "src/worker.ts", "src/admin.ts"],
  outdir: "dist",
  sourcemap: true,
  esbuildOptions: {
    define: { "process.env.VERSION": '"1.0.0"' },
  },
});
```

### Error Handling with Structured Diagnostics

```typescript
import { buildClient, BuildError } from "jsr:@ggpwnkthx/csr-build";

try {
  const result = await buildClient({
    entryPoints: ["src/client.ts"],
    outdir: "dist",
  });

  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.warn(
        `Warning${
          warning.location ? ` (${warning.location})` : ""
        }: ${warning.message}`,
      );
    }
  }
} catch (err) {
  if (err instanceof BuildError) {
    console.error("Build failed:");
    for (const diag of err.diagnostics) {
      console.error(`  ${diag.message}`);
      if (diag.location) console.error(`    at ${diag.location}`);
    }
  }
  throw err;
}
```

## API

### `buildClient(options)`

Performs a production client build with content-hashed filenames and manifest generation.

**Options:**

```typescript
interface BuildClientOptions {
  entryPoints: string | string[];
  outdir?: string;
  rootDir?: string;
  esbuildOptions?: Partial<BuildOptions>;
  manifest?: boolean;
  sourcemap?: boolean;
}
```

**Returns:**

```typescript
interface BuildResult {
  outputFiles: string[];
  manifestPath: string | null;
  warnings: BuildWarning[];
  errors: BuildDiagnostic[];
}
```

### Managed esbuild Settings

The following settings are applied automatically and cannot be overridden:

| Setting       | Value                   |
| ------------- | ----------------------- |
| `platform`    | `"browser"`             |
| `format`      | `"esm"`                 |
| `splitting`   | `true`                  |
| `contentHash` | `true`                  |
| `entryNames`  | `"[dir]/[name].[hash]"` |
| `assetNames`  | `"[dir]/[name].[hash]"` |
| `chunkNames`  | `"[dir]/[name].[hash]"` |
| `minify`      | `true`                  |
| `bundle`      | `true`                  |
| `write`       | `true`                  |
| `metafile`    | `true`                  |

## Permissions

Requires `--allow-read`, `--allow-write`, `--allow-run`.
