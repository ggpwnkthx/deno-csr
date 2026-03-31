import { assertEquals } from "@std/assert";
import { resolve } from "@std/path";
import { safeFilePath } from "@ggpwnkthx/csr-dev";

Deno.test({
  name: "safeFilePath rejects null byte in pathname",
  fn() {
    const outdir = "/srv/app/.dev";
    const result = safeFilePath("/index\x00.html", outdir);
    assertEquals(result, null);
  },
});

Deno.test({
  name: "safeFilePath rejects parent traversal at start of relative path",
  fn() {
    const outdir = "/srv/app/.dev";
    const result = safeFilePath("../secrets", outdir);
    assertEquals(result, null);
  },
});

Deno.test({
  name: "safeFilePath rejects double-encoded traversal",
  fn() {
    const outdir = "/srv/app/.dev";
    const result = safeFilePath("/..%252f..%252fsecrets", outdir);
    assertEquals(result, null);
  },
});

Deno.test({
  name: "safeFilePath accepts valid relative path",
  fn() {
    const outdir = "/srv/app/.dev";
    const result = safeFilePath("/index.html", outdir);
    assertEquals(result, resolve(outdir, "index.html"));
  },
});

Deno.test({
  name: "safeFilePath accepts path with subdirectory",
  fn() {
    const outdir = "/srv/app/.dev";
    const result = safeFilePath("/assets/style.css", outdir);
    assertEquals(result, resolve(outdir, "assets/style.css"));
  },
});

Deno.test({
  name: "safeFilePath accepts root path",
  fn() {
    const outdir = "/srv/app/.dev";
    const result = safeFilePath("/", outdir);
    assertEquals(result, resolve(outdir, ""));
  },
});

Deno.test({
  name: "safeFilePath decodes URL-encoded forward slash",
  fn() {
    const outdir = "/srv/app/.dev";
    const result = safeFilePath("/assets%2Fstyle.css", outdir);
    assertEquals(result, resolve(outdir, "assets/style.css"));
  },
});

Deno.test({
  name: "safeFilePath rejects invalid URL encoding",
  fn() {
    const outdir = "/srv/app/.dev";
    const result = safeFilePath("/%ZZ", outdir);
    assertEquals(result, null);
  },
});

Deno.test({
  name: "safeFilePath rejects empty segments via //",
  fn() {
    const outdir = "/srv/app/.dev";
    const result = safeFilePath("/assets//style.css", outdir);
    assertEquals(result, resolve(outdir, "assets/style.css"));
  },
});

Deno.test({
  name: "safeFilePath accepts path starting with dot-file",
  fn() {
    const outdir = "/srv/app/.dev";
    const result = safeFilePath("/.env", outdir);
    assertEquals(result, resolve(outdir, ".env"));
  },
});
