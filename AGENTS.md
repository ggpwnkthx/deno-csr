# AGENTS.md

This document provides guidance for AI agents operating in this repository.

## Project Overview

Client build and development workflow tooling that wraps `@ggpwnkthx/esbuild`.
Target: Deno v2.7+ only; no Node.js APIs.

## Build/Lint/Test Commands

### Standard Tasks

```bash
deno task fmt        # Format code
deno task fmt:check  # Check formatting without modifying
deno task lint       # Lint code (src, tests, packages)
deno task check      # Type-check all source files
deno task test       # Run all tests with coverage
deno task ci         # Run all CI checks (fmt && lint && check && test)
deno task build      # Run production build
deno task dev        # Run development server
```

### Single Test Execution

```bash
# Run a specific test file with all permissions
deno test -A ./tests/dev-server.test.ts

# Run a specific test by name (uses regex)
deno test -A --filter "dev server" ./tests/

# Run with coverage (same permissions as `deno task test`)
deno test --allow-read --allow-write --allow-net --allow-env --allow-run --coverage=coverage ./tests/*
```

### Permissions

Required permissions for tasks:

- `--allow-read` - File system access
- `--allow-write` - File system writes
- `--allow-net` - Network access
- `--allow-env` - Environment variables
- `--allow-run` - Subprocess execution

## Code Style Guidelines

### TypeScript

- **Strict mode always** - `strict: true` in deno.jsonc
- **Avoid `any`** - Use `unknown` + type narrowing instead
- **Prefer generics** over union types where appropriate
- **Strong types for all domain entities**, external inputs/outputs, config, and errors
- Use `interface` for object shapes; `type` for unions, intersections, mapped types

### Imports

- Use jsr.io packages only; never `https://deno.land` imports
- Pin versions: `import { X } from "jsr:@scope/pkg@1.2.3";`
- Current deps:
  - `@std/assert@^1.0` for testing assertions
  - `@std/path@^1.1` for path utilities
  - `@ggpwnkthx/esbuild@^0.1` for esbuild wrapper
  - `@astral/astral@^0.5` for AST utilities
- Sort imports: external → internal → relative

### Formatting (from deno.jsonc)

```json
{
  "lineWidth": 88,
  "indentWidth": 2,
  "useTabs": false,
  "semiColons": true,
  "singleQuote": false,
  "proseWrap": "preserve",
  "trailingCommas": "onlyMultiLine",
  "operatorPosition": "nextLine"
}
```

### Naming Conventions

- **Files**: kebab-case (`my-file.ts`)
- **Types/Interfaces**: PascalCase (`MyType`, `MyInterface`)
- **Functions/Methods**: camelCase (`myFunction`)
- **Constants**: SCREAMING_SNAKE_CASE for compile-time constants
- **Error Classes**: PascalCase ending in `Error` (`BuildError`, `ValidationError`)

## Documentation Standards

### Every Entrypoint Needs Module Doc

Every public entrypoint (files listed in `exports` in `deno.jsonc`) must have a module doc:

```typescript
/**
 * Shared error classes for CSR tooling packages.
 * @module
 */
```

### Exported Symbols Need Symbol Documentation

All exported functions, types, interfaces, classes, and constants must have JSDoc comments:

```typescript
/**
 * Error thrown when esbuild build fails.
 */
export class BuildError extends Error {
  constructor(message: string, cause?: unknown);
}
```

### No Slow Types

Avoid types that cause performance overhead:

- **Avoid `any`** - Use `unknown` + type narrowing
- **Avoid large unions** - Use interfaces or generics instead
- **Use `interface` for object shapes** - Interfaces are faster for type checking

### Error Handling

- Use typed error classes with clear messages
- Error classes extend `Error` with `name`, `message`, and `cause`
- Fail fast with validation errors
- Never swallow errors silently

## Architecture

### Directory Structure

```
.
├── packages/          # Monorepo packages
│   ├── shared/        # Shared utilities (errors, hashing, validation)
│   ├── manifest/      # Manifest types, generation, I/O, validation
│   ├── build/         # Production build orchestration
│   └── dev/           # Development server with live reload
├── src/               # Main package re-exports
├── tests/             # Test suite
└── deno.jsonc         # Deno configuration
```

### Domain Boundaries

| Domain      | Responsibility                      | Public API                          |
| ----------- | ----------------------------------- | ----------------------------------- |
| `build/`    | Production build orchestration      | `buildClient()`, `BuildError`       |
| `dev/`      | Development server with live reload | `devClient()`, `DevServerError`     |
| `manifest/` | Asset manifest schema and I/O       | `readManifest()`, `writeManifest()` |
| `shared/`   | Internal utilities (not exported)   | Internal only                       |

## Testing Guidelines

- Use `@std/assert` for assertions
- Tests under `tests/` directory
- Use descriptive test names
- Clean up resources (use temp dirs, cleanup in finally or after)
- Add regression coverage for reported bugs

### Test Patterns

```typescript
import { assertEquals } from "@std/assert@1.0.19";

// Basic test
Deno.test("myFeature works correctly", () => {
  assertEquals(myFeature(), expected);
});

// Async test with cleanup
Deno.test({
  name: "e2e: dev server serves built assets",
  async fn() {
    const dev = await devClient({
      entryPoints: "./client.ts",
      outdir: ".dev",
      port: 3000,
    });
    try {
      const response = await fetch(`http://localhost:${dev.port}/index.html`);
      assertEquals(response.ok, true);
    } finally {
      await dev.stop();
    }
  },
});
```

## Git Conventions

- Branch from `main`
- Commit messages: clear, descriptive, explain _why_ not just _what_
- AI-generated code: contributors responsible for reviewing all generated code
- Do not commit secrets, .env files, or private data

## Pull Request Checklist

- [ ] Branch from `main`
- [ ] Add/update tests for all changes
- [ ] Run `deno task ci` - all checks must pass
- [ ] Update README if public API changed
- [ ] Keep dependencies minimal
- [ ] Verify no `any` types introduced

## Quick Reference

```bash
# First time setup
deno cache ./src/mod.ts

# Run CI checks
deno task ci

# Run specific test
deno test -A ./tests/dev-server.test.ts

# Type-check
deno check ./src/mod.ts

# Format and lint
deno fmt && deno lint
```

## Lock File

- `deno.lock` is tracked in git (not frozen)
- Run `deno task fmt` after adding new dependencies to update lock file
- Do not edit `deno.lock` manually
