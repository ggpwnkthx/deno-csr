import { LIVE_RELOAD_MARKER, LIVE_RELOAD_SCRIPT } from "./constants.ts";

const BODY_REGEX = /<\/body>/i;

/**
 * Injects the live reload script into HTML.
 */
export function injectLiveReload(html: string): string {
  if (html.toLowerCase().includes(LIVE_RELOAD_MARKER)) {
    return html;
  }
  const idx = html.search(BODY_REGEX);
  if (idx !== -1) {
    return html.slice(0, idx) + LIVE_RELOAD_SCRIPT + html.slice(idx);
  }
  return html + LIVE_RELOAD_SCRIPT;
}
