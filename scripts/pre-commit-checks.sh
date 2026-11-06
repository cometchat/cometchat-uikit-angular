#!/usr/bin/env bash
# =============================================================================
# Pre-commit safety checks for CometChat Angular UIKit
#
# Checks only what is staged, and never edits or stages files. BLOCKS the commit on:
#   1. Real credentials in a staged environment.ts
#   2. debugger statements in staged source
#   3. Direct effect() in staged library source (use safeEffect)
#   4. console.log in staged library source
#   5. Staged .env files
#   6. New ESLint errors in staged files
#   7. Secrets in staged changes (gitleaks)
#
# Install: npm run hooks:install
# Bypass (emergency only): git commit --no-verify
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

ERRORS=0
error() {
  echo -e "${RED}${BOLD}[BLOCKED]${RESET} $1"
  ERRORS=$((ERRORS + 1))
}

ok() {
  echo -e "${GREEN}✓${RESET} $1"
}

section() {
  echo ""
  echo -e "${BOLD}── $1 ──${RESET}"
}

REPO_ROOT="$(git rev-parse --show-toplevel)"
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)

echo ""
echo -e "${BOLD}Running pre-commit checks...${RESET}"

# Every check reads the STAGED content (what the commit will contain), never the working
# tree, and never edits or stages files: a developer's local keys in environment.ts and their
# unstaged work stay exactly as they are. A problem blocks the commit with how to fix it.
staged() { git show ":$1" 2>/dev/null || true; }
# Staged TypeScript/JavaScript under projects/, minus tests, stories and test helpers.
STAGED_SOURCE=$(echo "$STAGED_FILES" | grep -E "^projects/.*\.(ts|js)$" | grep -vE "\.(spec|stories)\.(ts|js)$|/testing/" || true)
# Code lines only: drop // and * comment lines.
code_of() { staged "$1" | grep -vE "^[[:space:]]*(\*|//)" || true; }

# =============================================================================
# CHECK 1: real credentials in a staged environment.ts — BLOCK
#
# The committed file keeps placeholders (appId: 'appId', ...). Real keys live only in a
# developer's working copy or .env; staging them is blocked, the working copy is left alone.
# =============================================================================
section "Check 1: environment.ts credentials"

ENV_REL="projects/sample-app/src/environments/environment.ts"

if echo "$STAGED_FILES" | grep -qxF "$ENV_REL"; then
  # The committed file keeps each value equal to its own key name (appId: 'appId'). Any other
  # non-empty value, in any quotes or case, is treated as a real credential.
  if ! staged "$ENV_REL" | node -e '
    const s = require("fs").readFileSync(0, "utf8");
    const real = [...s.matchAll(/\b(appId|authKey|apiKey|region)\s*:\s*([\x27"`])(.*?)\2/g)].filter((m) => m[3] && m[3] !== m[1]);
    process.exit(real.length ? 1 : 0);'; then
    error "$ENV_REL is staged with real credentials. Unstage it (your local copy is kept): git restore --staged $ENV_REL"
  else
    ok "environment.ts — staged copy holds placeholders"
  fi
else
  ok "environment.ts not staged"
fi

# =============================================================================
# CHECK 2: debugger statements in staged source — BLOCK
# =============================================================================
section "Check 2: debugger statements"

DEBUGGER_FOUND=0
for FILE in $STAGED_SOURCE; do
  if code_of "$FILE" | grep -qE "^[[:space:]]*debugger[[:space:]]*;?[[:space:]]*$"; then
    error "$FILE contains a debugger statement — remove it and stage the file again."
    DEBUGGER_FOUND=1
  fi
done
[ $DEBUGGER_FOUND -eq 0 ] && ok "No debugger statements in staged source"

# =============================================================================
# CHECK 3: Direct effect() usage in staged UIKit library source — BLOCK
#
# Developers must use safeEffect() from utils/safe-effect.ts instead of
# Angular's effect() directly. This ensures allowSignalWrites:true is always
# set, making the code compatible with Angular 18–21.
# Skips: safe-effect.ts itself and test-setup.ts
# =============================================================================
section "Check 3: Direct effect() usage (use safeEffect instead)"

EFFECT_FOUND=0
for FILE in $(echo "$STAGED_SOURCE" | grep -E "^projects/cometchat-uikit/src/lib/.*\.ts$" | grep -vE "safe-effect\.ts$|test-setup\.ts$" || true); do
  CALLS=$(code_of "$FILE" | grep -E "(^|[^[:alnum:]_.])effect[[:space:]]*\(" || true)
  if [ -n "$CALLS" ]; then
    error "$FILE uses effect() directly — use safeEffect() from utils/safe-effect.ts instead."
    EFFECT_FOUND=1
  fi
done
[ $EFFECT_FOUND -eq 0 ] && ok "No direct effect() usage in staged library source"

# =============================================================================
# CHECK 4: console.log in staged UIKit library source — BLOCK
#
# Skips: CometChatLogger.ts and test-setup.ts
# =============================================================================
section "Check 4: console.log in library source"

CONSOLE_FOUND=0
for FILE in $(echo "$STAGED_SOURCE" | grep -E "^projects/cometchat-uikit/src/lib/.*\.ts$" | grep -vE "CometChatLogger\.ts$|test-setup\.ts$" || true); do
  if [ -n "$(code_of "$FILE" | grep -E "console\.log[[:space:]]*\(" || true)" ]; then
    error "$FILE contains console.log — use CometChatLogger instead."
    CONSOLE_FOUND=1
  fi
done
[ $CONSOLE_FOUND -eq 0 ] && ok "No console.log in staged library source"

# =============================================================================
# CHECK 5: .env files accidentally staged — BLOCK
# =============================================================================
section "Check 5: .env files"

ENV_STAGED=$(echo "$STAGED_FILES" | grep -E "(^|/)\.env(\.|$)" || true)

if [ -n "$ENV_STAGED" ]; then
  error ".env file staged: $ENV_STAGED — add to .gitignore and unstage."
else
  ok "No .env files staged"
fi

# =============================================================================
# CHECK 6: ESLint on staged TypeScript and HTML — BLOCK (Stage 0, ENG-40495)
#
# Check only (no --fix in a hook). Errors listed in eslint-suppressions.json are
# the existing baseline and do not block; new errors do. CI runs the same lint.
# =============================================================================
section "Check 6: ESLint (staged files)"

LINT_FILES=$(echo "$STAGED_FILES" | grep -E "^projects/.*\.(ts|html)$" || true)

# What gets linted is what is staged, with the eslint-suppressions.json baseline applied
# (scripts/lint-staged.mjs): an unstaged edit can neither block nor excuse the commit.
LINT_FAILED=0
if [ -n "$LINT_FILES" ]; then
  # shellcheck disable=SC2086
  node "$REPO_ROOT/scripts/lint-staged.mjs" $LINT_FILES || LINT_FAILED=1
fi
if [ -z "$LINT_FILES" ]; then
  ok "No staged TypeScript or HTML to lint"
elif [ $LINT_FAILED -eq 0 ]; then
  ok "ESLint passed on staged files"
else
  error "ESLint found new errors in staged files (see above)."
fi

# =============================================================================
# CHECK 7: Secrets in staged changes — BLOCK (Stage 0, ENG-40495)
#
# Uses gitleaks with the repo's .gitleaks.toml (also run by CI's secret-scan job).
# Skipped with a warning when gitleaks is not installed: brew install gitleaks.
# =============================================================================
section "Check 7: Secrets (gitleaks)"

if command -v gitleaks > /dev/null 2>&1; then
  if gitleaks git --staged --config "$REPO_ROOT/.gitleaks.toml" --redact --no-banner > /dev/null 2>&1; then
    ok "No secrets in staged changes"
  else
    gitleaks git --staged --config "$REPO_ROOT/.gitleaks.toml" --redact --no-banner || true
    error "Possible secret in staged changes (see above)."
  fi
else
  echo -e "  ${YELLOW}⚠${RESET} gitleaks is not installed; skipped (CI still scans). Install: brew install gitleaks"
fi

# =============================================================================
# RESULT
# =============================================================================
echo ""
echo "─────────────────────────────────────────"

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}${BOLD}Commit blocked — $ERRORS issue(s) must be fixed manually.${RESET}"
  echo ""
  echo "Fix the issues above, then commit again."
  echo "Emergency bypass: git commit --no-verify"
  echo ""
  exit 1
fi

echo -e "${GREEN}${BOLD}All pre-commit checks passed.${RESET}"

echo ""
exit 0
