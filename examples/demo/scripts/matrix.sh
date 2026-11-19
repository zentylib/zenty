#!/usr/bin/env bash
# Runs typecheck + the full E2E suite against every supported React/Zustand pair.
set -uo pipefail
cd "$(dirname "$0")/.."
status=0
for react in 18 19; do
  for zustand in 4 5; do
    npm install --no-save --no-audit --no-fund \
      "react@$react" "react-dom@$react" "@types/react@$react" "@types/react-dom@$react" "zustand@$zustand" >/dev/null 2>&1
    versions="react $(node -p 'require("react/package.json").version') / zustand $(node -p 'require("zustand/package.json").version')"
    if npm run typecheck >/dev/null 2>&1 && CI=1 npx playwright test --reporter=dot >/tmp/zenty-e2e.log 2>&1; then
      echo "PASS  $versions  ($(grep -Eo '[0-9]+ passed' /tmp/zenty-e2e.log))"
    else
      echo "FAIL  $versions"; tail -30 /tmp/zenty-e2e.log; status=1
    fi
  done
done
npm ci --no-audit --no-fund >/dev/null 2>&1  # back to the locked versions
exit $status
