/**
 * @module
 * @private
 */

/**
 * Marker used to detect if live reload is already injected.
 */
export const LIVE_RELOAD_MARKER = "__csr_dev_live_reload__";
/**
 * Live reload script injected into HTML pages.
 */
export const LIVE_RELOAD_SCRIPT =
  `<script id="__csr_dev_live_reload__">new EventSource("/~livereload").onmessage=()=>location.reload()</script>`;
/**
 * Maximum number of concurrent livereload connections.
 */
export const MAX_LIVERELOAD_CONTROLLERS = 100;
/**
 * Maximum HTML file size in bytes (1 MiB).
 */
export const MAX_HTML_FILE_SIZE = 1024 * 1024;
