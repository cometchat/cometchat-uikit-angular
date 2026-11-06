#!/usr/bin/env bash
# =============================================================================
# Pre-push checks: the quick local verify (scripts/verify.mjs), the same checks the
# PR gate runs: lockfile, versions, lint, type check, the unit tests related to
# what changed, and the library build (~1–2 min). A push should be a change that
# already passes here, not a way to find out on CI, which costs Actions minutes.
#
# Before marking a PR ready for review, also run: npm run verify:full
#
# Install: npm install (or npm run hooks:install)   Bypass (emergency only): git push --no-verify
# =============================================================================
set -uo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# A push that only deletes remote branches has nothing to check.
# git sends an all-zero object ID as local_sha for a deletion.
PUSHES_COMMITS=no
while read -r _local_ref local_sha _remote_ref _remote_sha; do
  case "$local_sha" in *[!0]*) PUSHES_COMMITS=yes ;; esac
done
[ "$PUSHES_COMMITS" = no ] && exit 0

if ! node scripts/verify.mjs; then
  echo "Push blocked: fix the failing check above (CI would fail on it too)."
  exit 1
fi
