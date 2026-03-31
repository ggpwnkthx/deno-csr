/**
 * Esbuild module abstraction for testing purposes.
 * @module
 */

import { build, formatMessages, stop } from "@ggpwnkthx/esbuild";

interface EsbuildModule {
  build: typeof build;
  formatMessages: typeof formatMessages;
  stop: typeof stop;
}

let esbuildModule: EsbuildModule = {
  build,
  formatMessages,
  stop,
};

/**
 * Sets the esbuild module instance for testing.
 */
export function setEsbuildModule(module: EsbuildModule): void {
  esbuildModule = module;
}

/**
 * Resets the esbuild module to the default implementation.
 */
export function resetEsbuildModule(): void {
  esbuildModule = { build, formatMessages, stop };
}

/**
 * The current esbuild module instance.
 */
export { esbuildModule };
