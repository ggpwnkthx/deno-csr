import type { Plugin } from "@opencode-ai/plugin";

const MAX_CONTEXT_FILES = 8;
const MAX_RECENT_FILES = 25;

type LogLevel = "debug" | "info" | "warn" | "error";

export const CodeGradePromptPlugin: Plugin = async (
    { client, worktree },
) => {
    let changed = false;
    let running = false;
    let recentlyEditedPaths: string[] = [];

    const log = async (
        level: LogLevel,
        message: string,
        extra?: Record<string, unknown>,
    ) => {
        await client.app.log({
            body: {
                service: "code-grade-prompt",
                level,
                message,
                extra,
            },
        });
    };

    const runReview = async () => {
        if (running) return;
        running = true;

        try {
            const changedFiles = await getChangedFiles(log, worktree);
            if (changedFiles.length === 0) {
                await log("debug", "No changed files found for grading");
                return;
            }

            const reviewFiles = selectProjectContextFiles(
                changedFiles,
                recentlyEditedPaths,
                MAX_CONTEXT_FILES,
            );

            const prompt = buildProjectReviewPrompt(changedFiles, reviewFiles);

            await client.tui.appendPrompt({
                body: {
                    text: prompt,
                },
            });

            await client.tui.submitPrompt();

            await log("info", "Submitted project-level code grade review prompt", {
                changedFilesCount: changedFiles.length,
                reviewFiles,
                omittedFiles: changedFiles.filter((file) => !reviewFiles.includes(file)),
            });

            changed = false;
            recentlyEditedPaths = [];
        } catch (error) {
            await log("error", "Failed to submit code grade prompt", {
                error: error instanceof Error ? error.message : String(error),
            });
        } finally {
            running = false;
        }
    };

    return {
        event: async ({ event }) => {
            if (event.type === "file.edited") {
                changed = true;

                const editedPath = extractEditedPath(event);
                if (editedPath && isReviewableFile(editedPath)) {
                    recentlyEditedPaths = pushRecentPath(
                        recentlyEditedPaths,
                        editedPath,
                        MAX_RECENT_FILES,
                    );
                }
            }

            if (event.type === "session.idle" && changed) {
                await runReview();
            }
        },
    };
};

function extractEditedPath(event: unknown): string | null {
    if (!event || typeof event !== "object") return null;

    const e = event as Record<string, unknown>;
    if (e.type !== "file.edited") return null;

    const properties = e.properties as { file: string } | undefined;
    if (!properties?.file) return null;

    return properties.file;
}

function pushRecentPath(
    paths: string[],
    path: string,
    maxItems: number,
): string[] {
    const normalized = path.replaceAll("\\", "/");
    const next = paths.filter((item) => item !== normalized);
    next.push(normalized);
    return next.slice(-maxItems);
}

async function getChangedFiles(
    log: (
        level: LogLevel,
        message: string,
        extra?: Record<string, unknown>,
    ) => Promise<void>,
    worktree: string,
): Promise<string[]> {
    const commands = [
        ["git", "diff", "--name-only", "--diff-filter=ACMR"],
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
        ["git", "ls-files", "--others", "--exclude-standard"],
    ];

    const files = new Set<string>();

    for (const cmd of commands) {
        const proc = Bun.spawn({
            cmd: [cmd[0], ...cmd.slice(1)],
            cwd: worktree,
            stdout: "pipe",
            stderr: "pipe",
        });

        const [stdout, stderr, exitCode] = await Promise.all([
            proc.stdout ? new Response(proc.stdout).text() : Promise.resolve(""),
            proc.stderr ? new Response(proc.stderr).text() : Promise.resolve(""),
            proc.exited,
        ]);

        if (exitCode !== 0) {
            await log("warn", `Git command failed: ${cmd.join(" ")}`, {
                exitCode,
                stderr: stderr.slice(0, 500),
            });
            continue;
        }

        for (const line of stdout.split(/\r?\n/)) {
            const file = line.trim();
            if (!file) continue;
            if (isReviewableFile(file)) {
                files.add(file.replaceAll("\\", "/"));
            }
        }
    }

    return [...files].sort();
}

function selectProjectContextFiles(
    files: string[],
    recentlyEditedPaths: string[],
    maxFiles: number,
): string[] {
    const unique = [...new Set(files.map((file) => file.replaceAll("\\", "/")))];
    if (unique.length <= maxFiles) return unique;

    const scored = unique
        .map((file) => ({
            file,
            bucket: getDirectoryBucket(file),
            score: scoreProjectFile(file, recentlyEditedPaths),
        }))
        .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

    const selected: string[] = [];
    const seenBuckets = new Set<string>();

    for (const item of scored) {
        if (selected.length >= maxFiles) break;
        if (seenBuckets.has(item.bucket)) continue;

        selected.push(item.file);
        seenBuckets.add(item.bucket);
    }

    for (const item of scored) {
        if (selected.length >= maxFiles) break;
        if (!selected.includes(item.file)) {
            selected.push(item.file);
        }
    }

    return selected;
}

function scoreProjectFile(
    file: string,
    recentlyEditedPaths: string[],
): number {
    const normalized = file.replaceAll("\\", "/");
    const parts = normalized.split("/");
    const fileName = parts[parts.length - 1] ?? normalized;
    const depth = parts.length;
    const recentIndex = recentlyEditedPaths.lastIndexOf(normalized);

    let score = 0;

    // Recency is a signal, not the whole decision.
    if (recentIndex >= 0) {
        score += 20 + recentIndex;
    }

    // Prefer files that are often architectural or boundary-defining.
    if (depth <= 2) {
        score += 8;
    }

    if (/\/(src|app|server|packages|lib)\//.test(`/${normalized}`)) {
        score += 6;
    }

    if (
        /(index|route|router|controller|service|repo|repository|model|schema|config|client|server|handler|middleware)\./
            .test(fileName)
    ) {
        score += 10;
    }

    // Tests can still matter, but they usually should not dominate project grading.
    if (/\.(test|spec)\./.test(fileName)) {
        score -= 4;
    }

    return score;
}

function getDirectoryBucket(file: string): string {
    const normalized = file.replaceAll("\\", "/");
    const parts = normalized.split("/");

    if (parts.length <= 2) return normalized;
    return parts.slice(0, 2).join("/");
}

function isReviewableFile(path: string): boolean {
    const normalized = path.replaceAll("\\", "/");

    if (
        normalized.startsWith(".git/") ||
        normalized.startsWith("node_modules/") ||
        normalized.startsWith("dist/") ||
        normalized.startsWith("build/") ||
        normalized.startsWith(".opencode/") ||
        normalized.includes("/node_modules/") ||
        normalized.includes("/dist/") ||
        normalized.includes("/build/")
    ) {
        return false;
    }

    return /\.(ts|tsx|js|jsx|mts|cts|mjs|cjs|go|rs|py|java|kt|swift|php|rb|cs)$/
        .test(
            normalized,
        );
}

function buildProjectReviewPrompt(
    changedFiles: string[],
    reviewFiles: string[],
): string {
    const referencedFiles = reviewFiles.length === 0
        ? "none"
        : reviewFiles.map((file) => `@${file}`).join(" ");

    const reviewFileList = reviewFiles.length === 0
        ? "- None"
        : reviewFiles.map((file) => `- @${file}`).join("\n");

    const omittedFiles = changedFiles.filter((file) => !reviewFiles.includes(file));
    const omittedFileList = omittedFiles.length === 0
        ? "- None"
        : omittedFiles.map((file) => `- ${file}`).join("\n");

    return [
        "Perform a strict code-quality review of the current change set.",
        "",
        `Total changed files detected: ${changedFiles.length}`,
        "",
        reviewFiles.length > 0
            ? `Referenced files for direct inspection: ${referencedFiles}`
            : "Referenced files for direct inspection: none",
        "",
        "Review instructions:",
        "- Grade the work heuristically at the project/change-set level, not as a review of one file.",
        "- Inspect the current diff across the referenced files before grading.",
        "- Use architecture, boundary design, data flow, consistency across files, and change-set shape to infer project quality.",
        "- Do not anchor on the most recently edited file or any single file unless it is clearly the dominant risk.",
        "- Do not make code changes. Review only.",
        "- Do not be nice for the sake of being nice.",
        "- Treat B+ as the minimum acceptable bar.",
        "- Any category below B+ must be addressed.",
        "- Any overall grade below B+ must be addressed.",
        "- Call out specific symbols, code paths, interface boundaries, and complexity hot spots.",
        "- Flag change-set level issues such as duplicated logic across files, fractured ownership, inconsistent validation, mixed abstractions, and missing end-to-end flow coverage.",
        "- Flag memory-risk patterns such as whole-payload reads, unnecessary buffering, missing pagination/cursors, and avoidable O(n^2) scans.",
        "- Flag missing centralized validation for HTTP input, params, env, files, and parsed JSON.",
        "- Flag weak typing at boundaries: domain entities, config, external I/O, and errors.",
        "- Flag poor modularity, duplication, poor folder placement, or code that does not look production-grade.",
        "",
        "Grade these categories using letter grades:",
        "1. DRY / modularity / clear folder boundaries",
        "2. Memory safety / streaming / chunking / pagination / complexity awareness",
        "3. Validation of untrusted input / fail-fast typed errors",
        "4. Strong typing for entities, boundaries, config, and errors",
        "",
        "Use this exact output structure:",
        "",
        "## Overall grade",
        "- Grade: <A+|A|A-|B+|B|B-|C+|C|C-|D|F>",
        "- Verdict: <1-3 sentences>",
        "",
        "## Category grades",
        "- DRY / modularity / folders: <grade>",
        "- Memory safety / complexity: <grade>",
        "- Validation / typed failures: <grade>",
        "- Strong typing / interfaces: <grade>",
        "",
        "## What is good",
        "- <bullets>",
        "",
        "## What is weak",
        "- <bullets>",
        "",
        "## Must address before merge",
        "- Include this section if ANY category or the overall grade is below B+.",
        "- Be concrete and prioritized.",
        "",
        "## Complexity and memory hot spots",
        "- <bullets>",
        "",
        "## Suggested next edits",
        "- <small, concrete changes>",
        "",
        "Referenced changed files:",
        reviewFileList,
        "",
        "Additional changed files not directly referenced:",
        omittedFileList,
    ].join("\n");
}
