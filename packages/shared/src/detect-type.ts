/**
 * Asset type detection utilities.
 * @module
 */

/**
 * Supported asset types in the build output.
 */
export type AssetType = "js" | "css" | "asset";

/**
 * All supported asset types.
 */
export const ASSET_TYPES = ["js", "css", "asset"] as const;

const JS_EXTENSION_REGEX = /\.(js|mjs)$/;
const CSS_EXTENSION_REGEX = /\.css$/;

/**
 * Detects the asset type based on file extension.
 */
export function detectAssetType(filePath: string): AssetType {
  if (JS_EXTENSION_REGEX.test(filePath)) return "js";
  if (CSS_EXTENSION_REGEX.test(filePath)) return "css";
  return "asset";
}
