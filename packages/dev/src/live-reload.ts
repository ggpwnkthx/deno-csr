import { LIVE_RELOAD_MARKER, LIVE_RELOAD_SCRIPT } from "./constants.ts";

export function injectLiveReload(html: string): string {
  if (html.toLowerCase().includes(LIVE_RELOAD_MARKER)) {
    return html;
  }
  if (html.toLowerCase().includes("</body>")) {
    return html.replace(/<\/body>/i, `${LIVE_RELOAD_SCRIPT}</body>`);
  }
  return html + LIVE_RELOAD_SCRIPT;
}
