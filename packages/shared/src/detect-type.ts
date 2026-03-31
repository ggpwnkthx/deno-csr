/**
 * Asset type detection utilities.
 * @module
 */

export type AssetType = "js" | "css" | "asset";

export const ASSET_TYPES = ["js", "css", "asset"] as const;

const JS_EXTENSION_REGEX = /\.(js|mjs)$/;
const CSS_EXTENSION_REGEX = /\.css$/;

export function detectAssetType(filePath: string): AssetType {
  if (JS_EXTENSION_REGEX.test(filePath)) return "js";
  if (CSS_EXTENSION_REGEX.test(filePath)) return "css";
  return "asset";
}
