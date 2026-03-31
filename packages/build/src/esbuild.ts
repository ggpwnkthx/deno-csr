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

export function setEsbuildModule(module: EsbuildModule): void {
  esbuildModule = module;
}

export function resetEsbuildModule(): void {
  esbuildModule = { build, formatMessages, stop };
}

export { esbuildModule };
