#!/usr/bin/env bash
# CI 5 (ENG-40594): stage the public copy of a release for cometchat/cometchat-uikit-angular.
#
#   scripts/release/stage-public.sh <git-ref> <out-dir>
#
# 1. Export the exact tracked tree of <git-ref> (git archive: no local or untracked files).
# 2. Keep only what may go public (A5, as React): scripts/release/allowlist.txt lists it,
#    scripts/release/internal.txt what stays here, and a tracked path in neither stops the
#    release (scripts/release/public-paths.mjs). The PR gate runs the same check on every PR.
# 3. Add the public repo's workflows from scripts/public-repo/.
# 4. Sanitise and verify: environment.ts must hold placeholders only, and no .env file may be
#    present. The secret scan and the validation build run as separate CI steps on <out-dir>.
set -euo pipefail

REF=$1
OUT=$2
ROOT=$(git rev-parse --show-toplevel)
rm -rf "$OUT" && mkdir -p "$OUT"
git -C "$ROOT" archive "$REF" | tar -x -C "$OUT"

# Only the paths that may go public.
node "$ROOT/scripts/release/public-paths.mjs" prune "$REF" "$OUT"

# Public workflows: CI on the public repo, and the npm release (provenance needs a public repo).
mkdir -p "$OUT/.github/workflows"
cp "$ROOT"/scripts/public-repo/workflows/*.yml "$OUT/.github/workflows/"

# environment.ts: every credential field must be its own key name (the placeholder form the
# pre-commit hook enforces), never a real value.
ENV_TS="$OUT/projects/sample-app/src/environments/environment.ts"
node - "$ENV_TS" <<'EOF'
const fs = require('fs');
const file = process.argv[2];
const src = fs.readFileSync(file, 'utf8');
const bad = [];
for (const key of ['appId', 'region', 'authKey', 'apiKey']) {
  const m = src.match(new RegExp(`\\b${key}:\\s*'([^']*)'`));
  if (m && m[1] !== key) bad.push(key);
}
if (bad.length) {
  console.error(`environment.ts has non-placeholder values for: ${bad.join(', ')}`);
  process.exit(1);
}
console.log('environment.ts: placeholders only');
EOF

# .env files hold real keys; committed templates (*.example) are fine.
ENV_FILES=$(find "$OUT" \( -name '.env' -o -name '.env.*' \) ! -name '*.example')
if [ -n "$ENV_FILES" ]; then
  echo "A .env file is in the staged tree:"; echo "$ENV_FILES"
  exit 1
fi

echo "Staged $(git -C "$ROOT" rev-parse --short "$REF") into $OUT: $(find "$OUT" -type f | wc -l | tr -d ' ') files"
