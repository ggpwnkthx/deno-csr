import { assertEquals } from "@std/assert";
import { isPathTraversalSafe, normalizePath } from "@ggpwnkthx/csr-shared";

Deno.test("normalizePath converts backslashes to forward slashes", () => {
  assertEquals(normalizePath("path\\to\\file"), "path/to/file");
  assertEquals(normalizePath("C:\\Users\\test\\file.js"), "C:/Users/test/file.js");
  assertEquals(normalizePath("\\\\server\\share\\file"), "//server/share/file");
});

Deno.test("normalizePath keeps forward slashes unchanged", () => {
  assertEquals(normalizePath("path/to/file"), "path/to/file");
  assertEquals(normalizePath("/absolute/path/file.js"), "/absolute/path/file.js");
});

Deno.test("normalizePath handles mixed paths", () => {
  assertEquals(normalizePath("path/to\\file"), "path/to/file");
  assertEquals(normalizePath("C:\\path/to\\mixed"), "C:/path/to/mixed");
});

Deno.test("normalizePath handles empty string", () => {
  assertEquals(normalizePath(""), "");
});

Deno.test("normalizePath handles paths without backslashes", () => {
  assertEquals(normalizePath("simple/path/file.js"), "simple/path/file.js");
});

Deno.test("isPathTraversalSafe returns false for paths starting with ..", () => {
  assertEquals(isPathTraversalSafe(".."), false);
  assertEquals(isPathTraversalSafe("../file"), false);
  assertEquals(isPathTraversalSafe("..\\file"), false);
});

Deno.test("isPathTraversalSafe returns false for paths with /.. traversal", () => {
  assertEquals(isPathTraversalSafe("path/.."), false);
  assertEquals(isPathTraversalSafe("path/to/.."), false);
  assertEquals(isPathTraversalSafe("path/../file"), false);
  assertEquals(isPathTraversalSafe("path/../other/../file"), false);
});

Deno.test("isPathTraversalSafe returns false for paths with \\.. traversal", () => {
  assertEquals(isPathTraversalSafe("path\\.."), false);
  assertEquals(isPathTraversalSafe("path\\to\\.."), false);
  assertEquals(isPathTraversalSafe("path\\..\\file"), false);
});

Deno.test("isPathTraversalSafe returns true for safe relative paths", () => {
  assertEquals(isPathTraversalSafe("file.js"), true);
  assertEquals(isPathTraversalSafe("path/to/file.js"), true);
  assertEquals(isPathTraversalSafe("path/to/file.min.js"), true);
  assertEquals(isPathTraversalSafe("./file"), true);
  assertEquals(isPathTraversalSafe("."), true);
});

Deno.test("isPathTraversalSafe returns true for absolute paths without traversal", () => {
  assertEquals(isPathTraversalSafe("/absolute/path/file.js"), true);
  assertEquals(isPathTraversalSafe("/path/to/file.js"), true);
});

Deno.test("isPathTraversalSafe returns false for absolute paths with traversal", () => {
  assertEquals(isPathTraversalSafe("/path/../file"), false);
  assertEquals(isPathTraversalSafe("/path/to/../../file"), false);
});

Deno.test("isPathTraversalSafe handles paths with .. in the middle but not traversals", () => {
  assertEquals(isPathTraversalSafe("my..file"), true);
  assertEquals(isPathTraversalSafe("path..name/file.js"), true);
});
