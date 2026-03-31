/**
 * Centralized option validation for build and dev clients.
 * @module
 */

import { resolve } from "@std/path";
import type { BuildClientOptions } from "@ggpwnkthx/csr-build";
import type { DevClientOptions } from "@ggpwnkthx/csr-dev";
import {
  EntryPointValidationError,
  OutdirValidationError,
  PortValidationError,
  ValidationError,
} from "./errors.ts";

const OWNED_ESBUILD_FIELDS = [
  "entryPoints",
  "outdir",
  "bundle",
  "write",
  "format",
  "entryNames",
  "assetNames",
  "chunkNames",
  "platform",
  "splitting",
  "minify",
  "metafile",
  "contentHash",
  "sourcemap",
  "define",
  "plugins",
] as const;

export interface ValidatedBuildOptions {
  entryPoints: string[];
  outdir: string;
  rootDir: string;
  esbuildOptions: Record<string, unknown>;
  manifest: boolean;
  sourcemap: boolean;
}

export interface ValidatedDevOptions {
  entryPoints: string[];
  outdir: string;
  port: number;
  esbuildOptions: Record<string, unknown>;
}

function isFile(path: string): boolean {
  try {
    return Deno.statSync(path).isFile;
  } catch {
    return false;
  }
}

function validateEntryPoints(entryPoints: string | string[]): string[] {
  const entries = Array.isArray(entryPoints) ? entryPoints : [entryPoints];
  if (entries.length === 0) {
    throw new EntryPointValidationError("At least one entry point is required.");
  }
  const resolved = entries.map((ep) => resolve(ep));
  for (const ep of resolved) {
    if (!isFile(ep)) {
      throw new EntryPointValidationError(
        `Entry point does not exist or is not a file: ${ep}`,
      );
    }
  }
  return resolved;
}

function validateOutdir(
  outdir: string | undefined,
  defaultOutdir: string,
): string {
  if (!outdir || outdir.trim() === "") {
    if (outdir === undefined) {
      return resolve(defaultOutdir);
    }
    throw new OutdirValidationError("outdir cannot be empty.");
  }
  return resolve(outdir);
}

function validateRootDir(rootDir: string | undefined): string {
  if (rootDir === undefined) {
    return Deno.cwd();
  }
  const resolved = resolve(rootDir);
  try {
    const stat = Deno.statSync(resolved);
    if (!stat.isDirectory) {
      throw new ValidationError(`rootDir must be a directory: ${resolved}`);
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw new ValidationError(`rootDir does not exist: ${resolved}`);
    }
    throw err;
  }
  return resolved;
}

function validatePort(port: number): number {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new PortValidationError(
      `Port must be an integer between 1 and 65535, got: ${port}`,
    );
  }
  return port;
}

function sanitizeEsbuildOptions(
  esbuildOptions: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!esbuildOptions) {
    return {};
  }
  const owned: string[] = [...OWNED_ESBUILD_FIELDS];
  const violations: string[] = [];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(esbuildOptions)) {
    if (owned.includes(key)) {
      violations.push(key);
    } else if (typeof value === "function") {
      throw new ValidationError(
        `esbuildOptions contains a function value for "${key}". Functions are not supported as esbuild options.`,
      );
    } else {
      sanitized[key] = value;
    }
  }

  if (violations.length > 0) {
    throw new ValidationError(
      `esbuildOptions contains package-owned fields that cannot be overridden: ${
        violations.join(", ")
      }`,
    );
  }

  return sanitized;
}

export function validateBuildOptions(
  options: BuildClientOptions,
): ValidatedBuildOptions {
  return {
    entryPoints: validateEntryPoints(options.entryPoints),
    outdir: validateOutdir(options.outdir, "dist"),
    rootDir: validateRootDir(options.rootDir),
    esbuildOptions: sanitizeEsbuildOptions(options.esbuildOptions),
    manifest: options.manifest ?? true,
    sourcemap: options.sourcemap ?? false,
  };
}

export function validateDevOptions(
  options: DevClientOptions,
): ValidatedDevOptions {
  return {
    entryPoints: validateEntryPoints(options.entryPoints),
    outdir: validateOutdir(options.outdir, ".dev"),
    port: validatePort(options.port),
    esbuildOptions: sanitizeEsbuildOptions(options.esbuildOptions),
  };
}
