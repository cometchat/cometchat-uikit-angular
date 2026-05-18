#!/usr/bin/env bash
# =============================================================================
# Pre-commit safety checks for CometChat Angular UIKit
#
# AUTO-FIXES and re-stages:
#   1. Real credentials in environment.ts → replaced with placeholder keys
#   2. debugger statements in source files → removed
#
# BLOCKS (must fix manually):
#   3. console.log in UIKit library source (not tests/stories/analyzers)
#   4. .env files accidentally staged
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
FIXED=0

error() {
  echo -e "${RED}${BOLD}[BLOCKED]${RESET} $1"
  ERRORS=$((ERRORS + 1))
}

fixed() {
  echo -e "${CYAN}${BOLD}[AUTO-FIXED]${RESET} $1"
  FIXED=$((FIXED + 1))
}

ok() {
  echo -e "${GREEN}✓${RESET} $1"
}

section() {
  echo ""
  echo -e "${BOLD}── $1 ──${RESET}"
}

REPO_ROOT="$(git rev-parse --show-toplevel)"
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

echo ""
echo -e "${BOLD}Running pre-commit checks...${RESET}"

# =============================================================================
# CHECK 1: environment.ts — auto-fix real credentials → placeholders
#
# If any credential field has a real value (not matching its own key name),
# replace it with the key name as the value: appId: 'appId'
# Then re-stage the file so the fix is included in the commit.
# =============================================================================
section "Check 1: environment.ts credentials (auto-fix)"

ENV_PATH="$REPO_ROOT/projects/sample-app/src/environments/environment.ts"

if [ -f "$ENV_PATH" ]; then
  NEEDS_FIX=0

  # Check each credential field
  if grep -qE "appId:\s*'[a-zA-Z0-9]{10,}'" "$ENV_PATH" && \
     ! grep -qE "appId:\s*'appId'" "$ENV_PATH"; then
    NEEDS_FIX=1
  fi
  if grep -qE "authKey:\s*'[a-f0-9]{40}'" "$ENV_PATH"; then
    NEEDS_FIX=1
  fi
  if grep -qE "apiKey:\s*'[a-f0-9]{40}'" "$ENV_PATH"; then
    NEEDS_FIX=1
  fi
  if grep -qE "region:\s*'(us|eu|in)'" "$ENV_PATH"; then
    NEEDS_FIX=1
  fi
  if grep -qE "(userUid[0-9]*):\s*'[a-zA-Z0-9_-]{3,}'" "$ENV_PATH" && \
     ! grep -qE "(userUid[0-9]*):\s*'userUid'" "$ENV_PATH"; then
    NEEDS_FIX=1
  fi

  if [ $NEEDS_FIX -eq 1 ]; then
    # Replace each credential with its key name as the value
    # Uses perl for reliable in-place regex replacement on macOS
    perl -i -pe "s/appId:\s*'[^']+'/appId: 'appId'/g" "$ENV_PATH"
    perl -i -pe "s/authKey:\s*'[^']+'/authKey: 'authKey'/g" "$ENV_PATH"
    perl -i -pe "s/apiKey:\s*'[^']+'/apiKey: 'apiKey'/g" "$ENV_PATH"
    perl -i -pe "s/region:\s*'[^']+'/region: 'region'/g" "$ENV_PATH"
    perl -i -pe "s/userUid2:\s*'[^']+'/userUid2: 'userUid2'/g" "$ENV_PATH"
    perl -i -pe "s/userUid:\s*'[^']+'/userUid: 'userUid'/g" "$ENV_PATH"

    # Re-stage the fixed file
    git add "$ENV_PATH"
    fixed "environment.ts — credentials replaced with placeholders and re-staged"
  else
    ok "environment.ts — credentials are already placeholders"
  fi
else
  ok "environment.ts not found — skipping"
fi

# =============================================================================
# CHECK 2: debugger statements — auto-remove from source files
#
# Removes any line that is solely `debugger;` or `debugger` from all
# TypeScript/JavaScript source files (skips tests, stories, /testing/).
# Re-stages any files that were modified.
# =============================================================================
section "Check 2: debugger statements (auto-fix)"

DEBUGGER_FIXED=0

while IFS= read -r -d '' FILE; do
  RELATIVE="${FILE#$REPO_ROOT/}"
  if echo "$RELATIVE" | grep -qE "\.(spec|stories)\.(ts|js)$|/testing/"; then continue; fi

  if grep -qE "^\s*debugger\s*;?\s*$" "$FILE"; then
    # Remove lines containing only 'debugger' or 'debugger;'
    perl -i -ne 'print unless /^\s*debugger\s*;?\s*$/' "$FILE"
    git add "$FILE"
    fixed "$RELATIVE — debugger statement removed and re-staged"
    DEBUGGER_FIXED=1
  fi
done < <(find "$REPO_ROOT/projects" \( -name "*.ts" -o -name "*.js" \) -not -path "*/node_modules/*" -print0 2>/dev/null)

[ $DEBUGGER_FIXED -eq 0 ] && ok "No debugger statements found"

# =============================================================================
# CHECK 3: console.log in UIKit library source — BLOCK (must fix manually)
#
# Scans all library source files on disk.
# Skips: *.spec.ts, *.stories.ts, CometChatLogger.ts, /testing/, /analyzers/
# =============================================================================
section "Check 3: console.log in library source"

CONSOLE_FOUND=0

while IFS= read -r -d '' FILE; do
  RELATIVE="${FILE#$REPO_ROOT/}"
  if echo "$RELATIVE" | grep -qE "\.(spec|stories)\.ts$|CometChatLogger\.ts$|test-setup\.ts$|/testing/|/analyzers/"; then
    continue
  fi

  if grep -vE "^\s*(\*|//)" "$FILE" | grep -qE "console\.log\s*\("; then
    error "$RELATIVE contains console.log — use CometChatLogger instead."
    CONSOLE_FOUND=1
  fi
done < <(find "$REPO_ROOT/projects/cometchat-uikit/src/lib" -name "*.ts" -not -path "*/node_modules/*" -print0 2>/dev/null)

[ $CONSOLE_FOUND -eq 0 ] && ok "No console.log in library source"

# =============================================================================
# CHECK 4: .env files accidentally staged — BLOCK
# =============================================================================
section "Check 4: .env files"

ENV_STAGED=$(echo "$STAGED_FILES" | grep -E "(^|/)\.env(\.|$)" || true)

if [ -n "$ENV_STAGED" ]; then
  error ".env file staged: $ENV_STAGED — add to .gitignore and unstage."
else
  ok "No .env files staged"
fi

# =============================================================================
# RESULT
# =============================================================================
echo ""
echo "─────────────────────────────────────────"

if [ $FIXED -gt 0 ]; then
  echo -e "${CYAN}${BOLD}Auto-fixed $FIXED issue(s) and re-staged the changes.${RESET}"
fi

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}${BOLD}Commit blocked — $ERRORS issue(s) must be fixed manually.${RESET}"
  echo ""
  echo "Fix the issues above, then commit again."
  echo "Emergency bypass: git commit --no-verify"
  echo ""
  exit 1
fi

if [ $FIXED -gt 0 ]; then
  echo -e "${GREEN}${BOLD}All issues auto-fixed. Commit proceeding with clean files.${RESET}"
else
  echo -e "${GREEN}${BOLD}All pre-commit checks passed.${RESET}"
fi

echo ""
exit 0
