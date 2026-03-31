/**
 * Error formatting utilities for esbuild errors.
 * @module
 */

interface EsbuildError {
  text?: string;
  detail?: string;
  location?: {
    file?: string;
    line?: number;
    column?: number;
    lineText?: string;
  };
  notes?: { text: string }[];
  pluginName?: string;
}

import type { BuildDiagnostic } from "./types.ts";

/**
 * Converts esbuild errors to structured build diagnostics.
 */
export function buildErrorsToStructured(
  errors: unknown[],
): BuildDiagnostic[] {
  return errors.map((err) => {
    const e = err as EsbuildError;
    const parts: string[] = [];

    if (e.text) {
      parts.push(e.text);
    }

    if (e.location?.lineText) {
      parts.push(`  | ${e.location.lineText}`);
    }

    if (e.detail) {
      parts.push(`\n${e.detail}`);
    }

    if (e.notes && e.notes.length > 0) {
      for (const note of e.notes) {
        parts.push(`\n${note.text}`);
      }
    }

    if (e.pluginName) {
      parts.push(` (plugin: ${e.pluginName})`);
    }

    let location: string | undefined;
    if (e.location?.file) {
      location = `${e.location.file}:${e.location.line ?? "?"}:${
        e.location.column ?? "?"
      }`;
    }

    return {
      message: parts.join("\n") || String(err),
      location,
    };
  });
}
