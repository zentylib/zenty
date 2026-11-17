# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-17

### Added
- **DeepPartial typing for `createEntityStore`**: When `deepMerge: true` is enabled, `update` accepts `DeepPartial<T>`, allowing nested partial updates without needing type assertions.
- **Export `DeepPartial<T>`**: Re-exported `DeepPartial` from the package entry point for custom helper reuse.
- **Zustand middleware support**: Added `middleware` option to `createEntitiesStore` and `createEntityStore` to support Zustand middleware like `persist` and `devtools`.
- **Missing ID reporting**: Calling `update` or `delete` with an ID that does not exist in the collection store now sets `error` (e.g. `"Item with id=<uid> was not found."`).
- **Override exception handling**: Errors thrown inside custom CRUD operation overrides (`add`, `addMany`, `update`, `updateMany`, `delete`, `deleteMany`) are now caught and written to `error`, ending `loading` automatically.

### Changed
- **Automatic `loading` reset**:
  - `replaceAll`, `addMany`, `set`, and write actions automatically reset `loading` to `false`.
  - `setError(message)` resets `loading: false`.
  - `setError(null)` preserves the current `loading` state so callers can clear errors at the start of async requests without resetting the loading spinner.
- **Package metadata**: Updated `bugs.url` to `https://github.com/zentylib/zenty/issues` and added `react`, `nextjs`, and `typescript` keywords.

## [1.0.10] - 2026-06-12

- Support for Zustand v5 and React 18/19.
- Initial release with entity and entities store creators.
