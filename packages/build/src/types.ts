/**
 * Types for the build package.
 * @module
 */

export type { BuildClientOptions } from "@ggpwnkthx/csr-shared";

export interface BuildResult {
  outputFiles: string[];
  manifestPath: string | null;
  warnings: BuildWarning[];
}

export interface BuildDiagnostic {
  message: string;
  location?: string;
}

export interface BuildWarning {
  message: string;
  location?: string;
}
