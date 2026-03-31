/**
 * Types for the dev package.
 * @module
 */

export type { DevClientOptions } from "@ggpwnkthx/csr-shared";

/**
 * Handle to the running dev server.
 */
export interface DevHandle {
  hostname: string;
  port: number;
  outdir: string;
  stop: () => Promise<void>;
}
