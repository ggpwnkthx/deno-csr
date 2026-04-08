/**
 * Types for the dev package.
 * @module
 */

export type { DevClientOptions } from "@ggpwnkthx/csr-shared";

/**
 * Result of starting the dev server.
 */
export interface DevResult {
  port: number;
  hostname: string;
  outdir: string;
  manifestPath: string | null;
  stop: () => Promise<void>;
}
