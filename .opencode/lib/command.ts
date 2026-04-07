export interface CommandOptions {
  readonly cwd?: string;
  readonly env?: Record<string, string>;
}

export interface CommandResult {
  readonly cmd: readonly string[];
  readonly cwd: string | undefined;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export async function runCommand(
  cmd: readonly string[],
  options: CommandOptions = {},
): Promise<CommandResult> {
  const proc = Bun.spawn({
    cmd: [...cmd],
    cwd: options.cwd,
    env: options.env ? { ...Bun.env, ...options.env } : undefined,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    proc.stdout ? new Response(proc.stdout).text() : Promise.resolve(""),
    proc.stderr ? new Response(proc.stderr).text() : Promise.resolve(""),
    proc.exited,
  ]);

  return {
    cmd,
    cwd: options.cwd,
    exitCode,
    stdout,
    stderr,
  };
}

export function formatCommand(cmd: readonly string[]): string {
  return cmd.map(quoteShellToken).join(" ");
}

export function quoteShellToken(token: string): string {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(token)) {
    return token;
  }
  return `'${token.replaceAll("'", `'\\''`)}'`;
}

export function clipText(text: string, maxChars = 8_000): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n…[truncated ${text.length - maxChars} chars]`;
}
