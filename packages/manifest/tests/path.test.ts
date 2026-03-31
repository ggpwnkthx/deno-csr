import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { resolveManifestPath } from "@ggpwnkthx/csr-manifest";
import { normalizePath } from "@ggpwnkthx/csr-shared";

Deno.test({
  name: "resolveManifestPath returns correct path",
  fn() {
    const outdir = "/some/output/dir";
    const result = resolveManifestPath(outdir);

    assertEquals(result, resolve(outdir, "manifest.json"));
  },
});

Deno.test({
  name: "normalizePath converts backslashes to forward slashes",
  fn() {
    assertEquals(normalizePath("foo\\bar\\baz"), "foo/bar/baz");
    assertEquals(normalizePath("dist\\client.a1b2c3d4.js"), "dist/client.a1b2c3d4.js");
    assertEquals(normalizePath("C:\\Users\\project\\dist"), "C:/Users/project/dist");
    assertEquals(normalizePath("no/change/needed"), "no/change/needed");
  },
});
