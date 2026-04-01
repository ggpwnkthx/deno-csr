import { assertEquals, assertInstanceOf } from "@std/assert";
import {
  BuildError,
  DevServerError,
  EntryPointValidationError,
  OutdirValidationError,
  PortValidationError,
  ValidationError,
} from "@ggpwnkthx/csr-shared";

Deno.test("BuildError correctly sets name and cause", () => {
  const cause = new Error("original error");
  const error = new BuildError("Build failed", cause);

  assertEquals(error.name, "BuildError");
  assertEquals(error.message, "Build failed");
  assertEquals(error.cause, cause);
  assertInstanceOf(error, Error);
});

Deno.test("BuildError without cause", () => {
  const error = new BuildError("Build failed");

  assertEquals(error.name, "BuildError");
  assertEquals(error.message, "Build failed");
  assertEquals(error.cause, undefined);
});

Deno.test("DevServerError correctly sets name and cause", () => {
  const cause = new Error("server error");
  const error = new DevServerError("Server crashed", cause);

  assertEquals(error.name, "DevServerError");
  assertEquals(error.message, "Server crashed");
  assertEquals(error.cause, cause);
});

Deno.test("DevServerError without cause", () => {
  const error = new DevServerError("Server crashed");

  assertEquals(error.name, "DevServerError");
  assertEquals(error.message, "Server crashed");
  assertEquals(error.cause, undefined);
});

Deno.test("ValidationError correctly sets name and cause", () => {
  const cause = new Error("validation failed");
  const error = new ValidationError("Invalid option", cause);

  assertEquals(error.name, "ValidationError");
  assertEquals(error.message, "Invalid option");
  assertEquals(error.cause, cause);
});

Deno.test("EntryPointValidationError correctly sets name and cause", () => {
  const cause = new Error("entry point missing");
  const error = new EntryPointValidationError("Entry point not found", cause);

  assertEquals(error.name, "EntryPointValidationError");
  assertEquals(error.message, "Entry point not found");
  assertEquals(error.cause, cause);
  assertInstanceOf(error, ValidationError);
});

Deno.test("OutdirValidationError correctly sets name and cause", () => {
  const cause = new Error("outdir invalid");
  const error = new OutdirValidationError("outdir cannot be empty", cause);

  assertEquals(error.name, "OutdirValidationError");
  assertEquals(error.message, "outdir cannot be empty");
  assertEquals(error.cause, cause);
  assertInstanceOf(error, ValidationError);
});

Deno.test("PortValidationError correctly sets name and cause", () => {
  const cause = new Error("port out of range");
  const error = new PortValidationError("Port must be 1-65535", cause);

  assertEquals(error.name, "PortValidationError");
  assertEquals(error.message, "Port must be 1-65535");
  assertEquals(error.cause, cause);
  assertInstanceOf(error, ValidationError);
});

Deno.test("Error classes are instances of Error", () => {
  const buildError = new BuildError("build");
  const devError = new DevServerError("dev");
  const validationError = new ValidationError("validation");
  const entryError = new EntryPointValidationError("entry");
  const outdirError = new OutdirValidationError("outdir");
  const portError = new PortValidationError("port");

  assertInstanceOf(buildError, Error);
  assertInstanceOf(devError, Error);
  assertInstanceOf(validationError, Error);
  assertInstanceOf(entryError, Error);
  assertInstanceOf(outdirError, Error);
  assertInstanceOf(portError, Error);
});

Deno.test("Error classes are instances of ValidationError for subclasses", () => {
  const entryError = new EntryPointValidationError("entry");
  const outdirError = new OutdirValidationError("outdir");
  const portError = new PortValidationError("port");

  assertInstanceOf(entryError, ValidationError);
  assertInstanceOf(outdirError, ValidationError);
  assertInstanceOf(portError, ValidationError);
});
