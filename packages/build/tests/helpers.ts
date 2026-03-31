import { stop } from "@ggpwnkthx/esbuild";

export async function withStop<T>(
  fn: (stop: () => Promise<void>) => T,
): Promise<T> {
  await stop();
  try {
    return await fn(stop);
  } finally {
    await stop();
  }
}
