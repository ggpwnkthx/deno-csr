/**
 * Types for the build package.
 * @module
 */

export interface BuildClientOptions {
  entryPoints: string | string[];
  outdir?: string;
  rootDir?: string;
  esbuildOptions?: Record<string, unknown>;
  manifest?: boolean;
  sourcemap?: boolean;
}

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
