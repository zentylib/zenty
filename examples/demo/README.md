# Zenty demo

A small React app that uses every zenty feature, installed from the packed
tarball exactly like a user would install it from npm.

| Section  | What it exercises |
|----------|-------------------|
| Products | `createEntitiesStore` CRUD, duplicate/missing id errors, `updateMany`/`deleteMany`, `find`/`has`, async loading with `replaceAll`/`setError`, `clear`, `persist` + `devtools` middleware with a typed `partialize` |
| Users    | custom string `idKey` (`userId`), reusable typed `ZentyMiddleware` persisting to sessionStorage |
| Todos    | action overrides that normalise, validate and guard (`add`, `delete`) |
| Settings | `createEntityStore` with `deepMerge`: nested partial updates, `Date` values, arrays, nested selectors |
| Profile  | `createEntityStore` starting empty: update-before-set error, async `set`, shallow updates, `clear` |

## Run it

```bash
npm ci                 # in the repository root
cd examples/demo
npm run pack-lib       # build + pack zenty, install it into the demo
npm run dev            # http://localhost:5173
```

## Test it

```bash
npx playwright install chromium   # once
npm run test:e2e                  # 19 browser tests against the production build
npm run test:matrix               # the same on React 18/19 × Zustand 4/5
```

CI runs the E2E suite on every push for all four React/Zustand combinations,
using the runner's preinstalled Google Chrome (`PW_CHANNEL=chrome`). Locally you
can do the same instead of downloading Chromium: `PW_CHANNEL=chrome npm run test:e2e`.
