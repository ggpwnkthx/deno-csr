/**
 * Types for the build package.
 * @module
 */

export type { BuildClientOptions } from "@ggpwnkthx/csr-shared";

/**
 * Result of a production build.
 */
export interface BuildResult {
  outputFiles: string[];
  manifestPath: string | null;
  warnings: BuildWarning[];
}

/**
 * A diagnostic message from esbuild (error or warning).
 */
export interface BuildDiagnostic {
  message: string;
  location?: string;
}

/**
 * A warning from esbuild during build.
 */
export interface BuildWarning {
  message: string;
  location?: string;
}
