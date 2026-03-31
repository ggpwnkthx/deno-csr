/**
 * Types for the dev package.
 * @module
 */

export type { DevClientOptions } from "@ggpwnkthx/csr-shared";

export interface DevHandle {
  hostname: string;
  port: number;
  outdir: string;
  stop: () => Promise<void>;
}
