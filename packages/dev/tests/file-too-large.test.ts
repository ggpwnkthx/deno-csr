import { assertEquals } from "@std/assert";
import { FileTooLargeError } from "@ggpwnkthx/csr-dev";

Deno.test({
  name: "FileTooLargeError has correct name, statusCode, message, and cause",
  fn() {
    const cause = new Error("original error");
    const err = new FileTooLargeError("file too large", cause);

    assertEquals(err.name, "FileTooLargeError");
    assertEquals(err.statusCode, 413);
    assertEquals(err.message, "file too large");
    assertEquals(err.cause, cause);
  },
});

Deno.test({
  name: "FileTooLargeError works without cause",
  fn() {
    const err = new FileTooLargeError("file too large");

    assertEquals(err.name, "FileTooLargeError");
    assertEquals(err.statusCode, 413);
    assertEquals(err.message, "file too large");
    assertEquals(err.cause, undefined);
  },
});
