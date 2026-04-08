# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.4] - 2026-04-08

### Added

- `hostname` option in `DevClientOptions` to configure the dev server bind address, defaulting to `0.0.0.0` when omitted.
- `DevResult.hostname` field exposing the actual bound address to callers.
- `HostnameValidationError` for fail-fast validation of whitespace-only hostnames.

### Fixed

- Dev server now binds to `0.0.0.0` by default instead of hardcoded `localhost`, allowing external access on the local network.

## [0.1.0] - Unreleased
