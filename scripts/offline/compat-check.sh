#!/usr/bin/env bash
# Offline support compatibility gates (offline plan angular.md §1/§5, UIT-OFF-07).
#
#   1. The kit's source compiles against the offline SDK's real 4.3 typings and against 4.2.1.
#   2. The built kit's public .d.ts names no SDK-4.3-only type.
#   3. A consumer project on the previous SDK (4.2 typings) compiles against the
#      built kit with skipLibCheck: false.
#   4. The frame probe installer never ships in dist/ (TEST-PLAN §3.3).
#
# Usage: [SDK_43=<4.3 SDK package dir, .tgz or registry spec>] scripts/offline/compat-check.sh
#        (SDK_43 defaults to @cometchat/chat-sdk-javascript@4.3.0, SDK_42 to @4.2.1, from npm)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
SDK_42="${SDK_42:-@cometchat/chat-sdk-javascript@4.2.1}"
NPM_CACHE_ARGS=()
[ -n "${NPM_CONFIG_CACHE:-}" ] && NPM_CACHE_ARGS=(--cache "$NPM_CONFIG_CACHE")

install_sdk() { # <spec> <dir>
  mkdir -p "$2"
  (cd "$2" && npm init -y >/dev/null && npm install --no-audit --no-fund --ignore-scripts "${NPM_CACHE_ARGS[@]}" "$1" >/dev/null)
  echo "$2/node_modules/@cometchat/chat-sdk-javascript"
}

typecheck_kit_against() { # <sdk dir> <config name>
  cat > "$WORK/$2" <<JSON
{
  "extends": "$ROOT/projects/cometchat-uikit/tsconfig.lib.json",
  "compilerOptions": {
    "noEmit": true,
    "declaration": false,
    "declarationMap": false,
    "baseUrl": "$ROOT",
    "paths": { "@cometchat/chat-sdk-javascript": ["$1"] }
  }
}
JSON
  (cd "$ROOT" && npx tsc -p "$WORK/$2")
}

echo "== 1. kit source against the 4.3 typings, and the 4.2 typings of its peer floor"
SDK43_DIR="$(install_sdk "${SDK_43:-@cometchat/chat-sdk-javascript@4.3.0}" "$WORK/sdk43")"
typecheck_kit_against "$SDK43_DIR" tsconfig.sdk43.json
SDK42_DIR="$(install_sdk "$SDK_42" "$WORK/sdk42")"
typecheck_kit_against "$SDK42_DIR" tsconfig.sdk42.json

echo "== 2. public .d.ts names no 4.3-only type"
(cd "$ROOT" && npx ng build cometchat-uikit >/dev/null)
DIST="$ROOT/dist/cometchat-uikit"
FOUR_THREE_ONLY='OfflineMessageListener|SyncListener|MessageFetchListener|ConversationFetchListener|MediaDownloadListener|OfflineCacheResetListener|OfflineConfig\b|MessageSource|SyncState|isOfflineEnabled|getCachedMediaObjectURL|discardLocalMessage'
if grep -rEn "CometChat\.($FOUR_THREE_ONLY)" "$DIST" --include='*.d.ts'; then
  echo "FAIL: the kit's public declarations name SDK-4.3-only members" >&2
  exit 1
fi

echo "== 3. consumer on the 4.2 typings compiles against the kit (skipLibCheck: false)"
cat > "$WORK/tsconfig.consumer.json" <<JSON
{
  "extends": "$ROOT/e2e/offline/consumer-fixture/tsconfig.json",
  "compilerOptions": {
    "baseUrl": "$ROOT",
    "paths": {
      "@cometchat/chat-sdk-javascript": ["$SDK42_DIR"],
      "@cometchat/chat-uikit-angular": ["$DIST"]
    }
  },
  "files": ["$ROOT/e2e/offline/consumer-fixture/consumer.ts"]
}
JSON
(cd "$ROOT" && npx tsc -p "$WORK/tsconfig.consumer.json")

echo "== 4. no frame probe installer in dist/"
if grep -rn "__ccFrames" "$DIST"; then
  echo "FAIL: the frame probe installer shipped in dist/" >&2
  exit 1
fi

echo "offline compatibility gates passed"
