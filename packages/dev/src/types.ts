/**
 * Types for the dev package.
 * @module
 */

export interface DevClientOptions {
  entryPoints: string | string[];
  outdir?: string;
  port: number;
  esbuildOptions?: Record<string, unknown>;
}

export interface DevHandle {
  hostname: string;
  port: number;
  outdir: string;
  stop: () => Promise<void>;
}
