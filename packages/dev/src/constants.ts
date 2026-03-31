/**
 * @module
 * @private
 */

export const LIVE_RELOAD_MARKER = "__csr_dev_live_reload__";
export const LIVE_RELOAD_SCRIPT =
  `<script id="__csr_dev_live_reload__">new EventSource("/~livereload").onmessage=()=>location.reload()</script>`;
export const MAX_LIVERELOAD_CONTROLLERS = 100;
