#!/usr/bin/env bash
# Offline-OFF baseline (offline TEST-PLAN §5, UIT-OFF-01).
#
#   scripts/offline/off-baseline.sh prepare [ref]   check out the baseline kit and overlay the E2E build files (compile check)
#   scripts/offline/off-baseline.sh record  [ref]   record the walkthrough on it into e2e/offline-baseline/baselines/<label>.json
#   scripts/offline/off-baseline.sh compare [ref]   replay the walkthrough on this checkout, offline off, and compare
#
# ref defaults to origin/dev-v5 (the kit this branch started from); use a tag such as
# v5.2.2 for a published release. The kit under test and the baseline run on the same
# installed Chat SDK, so a difference is the kit's; the SDK's own OFF parity is ACC-1-1.
# The overlay adds only the test seams to the baseline's sample app (host override,
# event recorder); it changes no kit source.
#
# Env: OFFLINE_CONFORMANCE_DIR=<harness> (required for record/compare), PW_CHROME_CHANNEL=chrome (optional).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MODE="${1:?usage: off-baseline.sh prepare|record|compare [ref]}"
REF="${2:-origin/dev-v5}"
LABEL="$(echo "$REF" | sed 's#^origin/##; s#[^A-Za-z0-9._-]#-#g')"
WT="$ROOT/.off-baseline/$LABEL"

prepare() {
  if [ ! -d "$WT" ]; then
    git -C "$ROOT" worktree add --detach "$WT" "$REF" >/dev/null
  fi
  ln -sfn "$ROOT/node_modules" "$WT/node_modules"
  local app="$WT/projects/sample-app/src"
  cp "$ROOT/projects/sample-app/src/main.ts" "$app/main.ts"
  cp "$ROOT/projects/sample-app/src/e2e-event-recorder.ts" "$app/e2e-event-recorder.ts"
  cp "$ROOT/projects/sample-app/src/environments/environment.offline-e2e.ts" "$app/environments/environment.offline-e2e.ts"
  node -e "
    const fs = require('fs');
    // angular.json may carry // comments, as the CLI allows.
    const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\\s*\/\/.*\$/gm, ''));
    const mine = read('$ROOT/angular.json'), base = read('$WT/angular.json');
    const m = mine.projects['sample-app'].architect, b = base.projects['sample-app'].architect;
    b.build.configurations['offline-e2e'] = m.build.configurations['offline-e2e'];
    b.serve.configurations['offline-e2e'] = m.serve.configurations['offline-e2e'];
    fs.writeFileSync('$WT/angular.json', JSON.stringify(base, null, 2));
  "
  (cd "$WT" && npx ng build sample-app -c offline-e2e)
}

case "$MODE" in
  prepare)
    prepare
    ;;
  record)
    prepare
    (cd "$ROOT" && OFF_BASELINE_MODE=record OFF_BASELINE_LABEL="$LABEL" OFF_BASELINE_APP_DIR="$WT" npx playwright test -c playwright.off-baseline.config.ts)
    echo "baseline written to e2e/offline-baseline/baselines/$LABEL.json"
    ;;
  compare)
    (cd "$ROOT" && OFF_BASELINE_MODE=compare OFF_BASELINE_LABEL="$LABEL" OFF_BASELINE_APP_DIR="$ROOT" npx playwright test -c playwright.off-baseline.config.ts)
    ;;
  *)
    echo "unknown mode: $MODE" >&2
    exit 2
    ;;
esac
