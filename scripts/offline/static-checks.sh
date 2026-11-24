#!/usr/bin/env bash
# Offline support static checks (offline TEST-PLAN §6, UIK-GATE-01..04).
#
#   1. The gate has one call site: `isOfflineEnabled` is called only in offline-gate.ts.
#   2. No stored gate: nothing assigns the gate's answer to a field, signal or storage.
#   3. No connectivity-API gate: no navigator.onLine / online|offline window events in the kit.
#   4. Feature detection: offline SDK members are reached only through offlineSdk() (never a
#      typed `CometChat.<member>` reference), so the kit runs and compiles on SDK 4.2.x.
#   6. `chatSDK.offline` of the SDK's settings type is read and written structurally: the field
#      is typed by SDK 4.3+ only, and a typed access fails `tsc` on 4.2.x (peer range ^4.2.0).
#
# Usage: scripts/offline/static-checks.sh   (exit 1 on any violation)
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/projects/cometchat-uikit/src/lib"
fail=0
report() { echo "FAIL: $1" >&2; echo "$2" >&2; fail=1; }

# Library sources only (specs and test doubles may stub anything).
lib_files() { find "$SRC" -name '*.ts' ! -name '*.spec.ts' ! -path '*/testing/*' ! -name '*.stories.ts'; }
# Code that takes part in offline support: the offline module and every file that reads the gate.
offline_files() { { find "$SRC/utils/offline" -name '*.ts' ! -name '*.spec.ts'; lib_files | xargs grep -l "offline/offline-gate'"; } | sort -u; }
# Drop comment lines from `grep -n` output (path:line:content).
code_only() { grep -vE '^[^:]+:[0-9]+:\s*(//|\*|/\*)' || true; }

echo "== 1. one call site for isOfflineEnabled"
hits=$(lib_files | xargs grep -n "isOfflineEnabled" | grep -v "utils/offline/offline-gate.ts" | grep -v "hasSdkFunction('isOfflineEnabled')" | code_only)
[ -n "$hits" ] && report "isOfflineEnabled is read outside offline-gate.ts" "$hits"

echo "== 2. no stored gate"
hits=$(lib_files | xargs grep -nE "(this\.[A-Za-z_]+|[A-Za-z_]+Signal)\s*(=|\.set\()\s*isOfflineOn\(\)|(localStorage|sessionStorage)\.[a-zA-Z]+\([^)]*isOfflineOn" || true)
[ -n "$hits" ] && report "the gate's answer is stored" "$hits"

echo "== 3. no connectivity-API gate"
hits=$(offline_files | xargs grep -nE "navigator\.onLine|addEventListener\(\s*['\"](online|offline)['\"]" | code_only)
[ -n "$hits" ] && report "a browser connectivity API is used" "$hits"

echo "== 4. offline SDK members only through offlineSdk() (feature-detected)"
MEMBERS='isOfflineEnabled|addOfflineMessageListener|addSyncListener|addOfflineCacheResetListener|addMediaDownloadListener|retryMessage|discardLocalMessage|getCachedMediaObjectURL|getExistingUploadFileRequest|getPendingMessages|forceSyncNow|getMediaCachingMode|ConversationDetailsListener|MessageDetailsListener|MessageSentListener|OfflineMessageListener|SyncListener|OfflineCacheResetListener|MediaDownloadListener'
hits=$(lib_files | xargs grep -nE "CometChat\.($MEMBERS)\b" | code_only)
[ -n "$hits" ] && report "an offline SDK member is referenced through the typed CometChat namespace" "$hits"

echo "== 5. the kit never clears the cache, flushes or retries by itself"
hits=$(lib_files | xargs grep -nE "\b(clearOfflineCache|retryAllFailedMessages|getCacheSize|getSyncState)\b" || true)
[ -n "$hits" ] && report "a forbidden SDK call (README §2 'Never used by the kit')" "$hits"

echo "== 6. chatSDK.offline is not accessed through the SDK's typed settings"
hits=$(lib_files | xargs grep -nE "chatSDK\??\.offline|\['chatSDK'\]>?\['offline'\]" | code_only)
[ -n "$hits" ] && report "chatSDK.offline is typed by SDK 4.3+ only; read and write it structurally (as { offline?: unknown })" "$hits"

if [ "$fail" -ne 0 ]; then exit 1; fi
echo "offline static checks passed"
