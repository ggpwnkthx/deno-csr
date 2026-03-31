import type { Plugin } from "@opencode-ai/plugin";

export const DenoEnforcePlugin: Plugin = async ({ $, client, worktree }) => {
  let changed = false;
  let running = false;

  const log = async (
    level: "debug" | "info" | "warn" | "error",
    message: string,
    extra?: Record<string, unknown>,
  ) => {
    await client.app.log({
      body: {
        service: "deno-guards",
        level,
        message,
        extra,
      },
    });
  };

  const runChecks = async () => {
    if (running) return;
    running = true;

    const cacheDir = `${worktree}/.opencode/.cache`;
    const lintLog = `${cacheDir}/deno-lint.log`;
    const checkLog = `${cacheDir}/deno-check.log`;

    try {
      await $`mkdir -p ${cacheDir}`.quiet();

      await $`deno lint &> ${lintLog}`.cwd(worktree).quiet();
      await $`deno check &> ${checkLog}`.cwd(worktree).quiet();

      await log("info", "deno lint + deno check passed");
    } catch (err) {
      const [lintOutput, checkOutput] = await Promise.all([
        $`cat ${lintLog}`.quiet().text().catch(() => ""),
        $`cat ${checkLog}`.quiet().text().catch(() => ""),
      ]);

      await log("error", "Deno validation failed", {
        error: err instanceof Error ? err.message : String(err),
        lintOutput: lintOutput.slice(0, 8000),
        checkOutput: checkOutput.slice(0, 8000),
      });
    } finally {
      running = false;
    }
  };

  return {
    event: async ({ event }) => {
      if (event.type === "file.edited") {
        changed = true;
      }

      if (event.type === "session.idle" && changed) {
        changed = false;
        await runChecks();
      }
    },
  };
};
