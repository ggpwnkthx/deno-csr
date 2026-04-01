import { assertEquals } from "@std/assert";
import { ASSET_TYPES, type AssetType, detectAssetType } from "@ggpwnkthx/csr-shared";

Deno.test("detectAssetType returns 'js' for .js files", () => {
  assertEquals(detectAssetType("file.js"), "js");
  assertEquals(detectAssetType("path/to/file.js"), "js");
  assertEquals(detectAssetType("/absolute/path/file.js"), "js");
});

Deno.test("detectAssetType returns 'js' for .mjs files", () => {
  assertEquals(detectAssetType("file.mjs"), "js");
  assertEquals(detectAssetType("path/to/file.mjs"), "js");
  assertEquals(detectAssetType("/absolute/path/file.mjs"), "js");
});

Deno.test("detectAssetType returns 'css' for .css files", () => {
  assertEquals(detectAssetType("file.css"), "css");
  assertEquals(detectAssetType("path/to/file.css"), "css");
  assertEquals(detectAssetType("/absolute/path/file.css"), "css");
});

Deno.test("detectAssetType returns 'asset' for other extensions", () => {
  assertEquals(detectAssetType("file.png"), "asset");
  assertEquals(detectAssetType("file.jpg"), "asset");
  assertEquals(detectAssetType("file.svg"), "asset");
  assertEquals(detectAssetType("file.woff2"), "asset");
  assertEquals(detectAssetType("file.json"), "asset");
  assertEquals(detectAssetType("file.html"), "asset");
  assertEquals(detectAssetType("file.txt"), "asset");
});

Deno.test("detectAssetType handles files without extensions", () => {
  assertEquals(detectAssetType("filename"), "asset");
  assertEquals(detectAssetType("path/to/filename"), "asset");
});

Deno.test("detectAssetType does not confuse .js in path with extension", () => {
  assertEquals(detectAssetType("node_modules/package/file.css"), "css");
  assertEquals(detectAssetType("file.js.map"), "asset");
  assertEquals(detectAssetType("file.min.js"), "js");
});

Deno.test("ASSET_TYPES contains all asset types", () => {
  assertEquals(ASSET_TYPES.length, 3);
  assertEquals(ASSET_TYPES.includes("js"), true);
  assertEquals(ASSET_TYPES.includes("css"), true);
  assertEquals(ASSET_TYPES.includes("asset"), true);
});

Deno.test("AssetType is a valid type alias", () => {
  const jsType: AssetType = "js";
  const cssType: AssetType = "css";
  const assetType: AssetType = "asset";

  assertEquals(jsType, "js");
  assertEquals(cssType, "css");
  assertEquals(assetType, "asset");
});
