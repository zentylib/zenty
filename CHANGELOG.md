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

### Fixed
- **React 18 installs**: Removed the `react-dom` peer dependency (zenty never imports it). It made npm pull `react-dom@19`, which then failed with `ERESOLVE` for every React 18 project. `react` is now `>=18`.
- **Duplicate IDs**: `addMany` now rejects a batch that repeats an existing ID or contains the same ID twice (nothing is added, `error` is set), matching `add`. `update` refuses to change an item's ID to one already in use.
- **Consistent `loaded`**: `createEntitiesStore` with a non-empty `initialState` now starts with `loaded: true`, like `createEntityStore` does.
- **`update` on an empty single-entity store**: it now sets `error` and ends `loading` instead of silently doing nothing and leaving `loading` stuck at `true`. `set` and `update` also clear a previous `error` on success.
- **`deepMerge` destroyed non-plain objects**: `Date`, `Map`, `Set` and class instances were flattened into `{}` during a deep-merge `update`. Only plain objects are merged now; everything else is replaced as a whole value, matching `DeepPartial`.

### Package
- `exports` now declare `types` for both `import` and `require`, `main` points to the CJS build, and `module`/`sideEffects: false` are set.
- Added `LICENSE`, removed a wrong `repository.directory`, and `prepublishOnly` now runs typecheck and tests too.

## [1.0.10] - 2026-06-12

- Support for Zustand v5 and React 18/19.
- Initial release with entity and entities store creators.
