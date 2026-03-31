/**
 * Shared option types for build and dev clients.
 * @module
 */

/**
 * Options for the production build client.
 */
export interface BuildClientOptions {
  entryPoints: string | string[];
  outdir?: string;
  rootDir?: string;
  esbuildOptions?: Record<string, unknown>;
  manifest?: boolean;
  sourcemap?: boolean;
}

/**
 * Options for the development server client.
 */
export interface DevClientOptions {
  entryPoints: string | string[];
  outdir?: string;
  port: number;
  esbuildOptions?: Record<string, unknown>;
}
