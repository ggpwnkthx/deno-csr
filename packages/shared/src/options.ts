/**
 * Shared option types for build and dev clients.
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

export interface DevClientOptions {
  entryPoints: string | string[];
  outdir?: string;
  port: number;
  esbuildOptions?: Record<string, unknown>;
}
