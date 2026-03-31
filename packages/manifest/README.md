# `@ggpwnkthx/csr-manifest`

Self-contained asset manifest solution for SSR, deployment tooling, runtime asset lookups, and test harnesses.

Does not depend on `@ggpwnkthx/esbuild` or build orchestration—can be used independently.

## Installation

```typescript
import {
  type AssetManifest,
  buildManifest,
  generateManifestEntry,
  readManifest,
  resolveManifestPath,
  writeManifest,
} from "jsr:@ggpwnkthx/csr-manifest@^0.1";
```

## Usage

### Building and Writing a Manifest

```typescript
import {
  buildManifest,
  generateManifestEntry,
  writeManifest,
} from "jsr:@ggpwnkthx/csr-manifest";

// Generate entries for known files
const entry1 = await generateManifestEntry(
  "src/client.ts",
  "/path/to/dist/client.abc123.js",
  "/path/to/dist",
);

const entry2 = await generateManifestEntry(
  "src/styles.css",
  "/path/to/dist/styles.def456.css",
  "/path/to/dist",
);

// Build manifest from entries
const manifest = buildManifest({
  "src/client.ts": entry1,
  "src/styles.css": entry2,
});

// Write to disk
const manifestPath = await writeManifest(manifest, "/path/to/dist");
console.log(`Manifest written to: ${manifestPath}`);
```

### Reading and Using a Manifest in SSR

```typescript
import { readManifest } from "jsr:@ggpwnkthx/csr-manifest";

const manifest = await readManifest("dist/manifest.json");

// Lookup asset by original path
function getAssetUrl(originalPath: string): string | undefined {
  const entry = manifest.entries[originalPath];
  return entry?.outputFile;
}

// In your SSR template
const clientJs = getAssetUrl("src/client.ts");
const styles = getAssetUrl("src/styles.css");

// Render HTML with hashed asset URLs
const html = `
  <link rel="stylesheet" href="/${styles}">
  <script type="module" src="/${clientJs}"></script>
`;
```

### Verifying Manifest Integrity

```typescript
import { readManifest, resolveManifestPath } from "jsr:@ggpwnkthx/csr-manifest";

// Check manifest exists where expected
const expectedPath = resolveManifestPath("dist");
console.log(`Expected manifest: ${expectedPath}`);

// Read with optional timestamp validation
const manifest = await readManifest(expectedPath, {
  timestamp: "2024-01-15T10:30:00.000Z", // optional
});

console.log(`Manifest version: ${manifest.version}`);
console.log(`Generated at: ${manifest.timestamp}`);
console.log(`Entries: ${Object.keys(manifest.entries).length}`);
```

### Deployment Script Example

```typescript
import { readManifest } from "jsr:@ggpwnkthx/csr-manifest";

async function deploy() {
  const manifest = await readManifest("dist/manifest.json");

  // Collect all files that need to be uploaded
  const filesToUpload: string[] = [];

  for (const entry of Object.values(manifest.entries)) {
    filesToUpload.push(entry.outputFile);
  }

  // Upload chunks/assets
  for (const asset of manifest.assets ?? []) {
    filesToUpload.push(asset.outputFile);
  }

  console.log(`Uploading ${filesToUpload.length} files...`);

  // Upload logic here...
  for (const file of filesToUpload) {
    console.log(`  - ${file}`);
  }
}
```

## API

### Types

```typescript
const MANIFEST_VERSION = 1;

type AssetType = "js" | "css" | "asset";

interface ManifestEntry {
  originalPath: string;
  outputFile: string;
  size: number;
  hash: string;
  type: AssetType;
}

interface UnkeyedOutputEntry {
  outputFile: string;
  size: number;
  hash: string;
  type: AssetType;
  kind: "chunk" | "asset";
}

interface AssetManifest {
  version: 1;
  timestamp: string;
  entries: Record<string, ManifestEntry>;
  assets?: UnkeyedOutputEntry[];
}
```

### Functions

| Function                                                     | Description                                 |
| ------------------------------------------------------------ | ------------------------------------------- |
| `buildManifest(entries, options?, assets?)`                  | Creates an `AssetManifest` from entries     |
| `generateManifestEntry(originalPath, absOutputFile, outdir)` | Generates a `ManifestEntry` for a file      |
| `writeManifest(manifest, outdir)`                            | Writes manifest to `{outdir}/manifest.json` |
| `readManifest(manifestPath, options?)`                       | Reads and validates a manifest              |
| `resolveManifestPath(outdir)`                                | Returns expected manifest path              |
| `validateManifestEntry(key, entry)`                          | Asserts an entry is valid                   |

## Permissions

Requires `--allow-read` for `readManifest`, `--allow-write` for `writeManifest`.
