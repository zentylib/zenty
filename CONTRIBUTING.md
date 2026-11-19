# Contributing to Zenty

Thanks for helping out! Bug reports, docs fixes and pull requests are all welcome.

## Setup

```bash
git clone https://github.com/zentylib/zenty.git
cd zenty
npm ci
```

Node.js 20 or newer is recommended for development.

## Checks

Every pull request runs these in CI on Node 20, 22 and 24, against both Zustand 4 and 5.
Run them locally before opening a PR:

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Jest
npm run build       # tsup -> dist/
```

To try your change against Zustand 4:

```bash
npm install --no-save zustand@4 && npm test
npm ci   # back to the locked versions
```

## Guidelines

- Add or update tests for every behaviour change. Coverage is at 100% and should stay there.
- Keep the public API typed: no `any` in exported signatures.
- Update `README.md` when behaviour or options change, and add an entry under
  `## [Unreleased]` in `CHANGELOG.md`.
- Keep pull requests focused on one change.

## Releasing (maintainers)

1. Bump `version` in `package.json` and move the changelog entries under the new version with today's date.
2. Commit, then create a GitHub release with the tag `v<version>` (e.g. `v1.1.0`).
3. The **Release** workflow checks that the tag matches `package.json`, runs all checks, and
   publishes to npm with provenance.
