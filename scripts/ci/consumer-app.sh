#!/usr/bin/env bash
# CI 3 package job (ENG-40476): install the packed UI Kit into a brand-new Angular app and build it.
#
#   scripts/ci/consumer-app.sh <angular-major> <mode> <tarball | npm-spec>
#     mode: default | zoneless | ssr
#     The last argument is a packed .tgz (CI 3), or a registry spec such as
#     @cometchat/chat-uikit-angular@5.2.4 (the post-publish smoke test, ENG-40597).
#
# The app uses a UI Kit component in its root template, so the build compiles against the
# package's real exports and peer ranges. `ssr` also prerenders, which fails if anything in the
# package touches `window` or `document` at import time. The built app is then opened in headless
# Chromium (scripts/ci/consumer-start-check.mjs): a bundle can build and still throw at startup.
set -euo pipefail

REPO=$(pwd)
NG=$1
MODE=$2
if [ -f "$3" ]; then PACKAGE=$(realpath "$3"); else PACKAGE=$3; fi
WORK=${RUNNER_TEMP:-/tmp}/consumer-$NG-$MODE
rm -rf "$WORK" && mkdir -p "$WORK" && cd "$WORK"

new_flags=(--defaults --skip-git --skip-tests --style=css --routing=false)
case "$MODE" in
  ssr) new_flags+=(--ssr) ;;
  *) new_flags+=(--ssr=false) ;;
esac
# `--zoneless` exists on `ng new` from v20; older majors are switched by hand below.
if [ "$MODE" = zoneless ] && [ "$NG" -ge 20 ]; then new_flags+=(--zoneless); fi

echo "::group::ng new (Angular $NG, $MODE)"
npx -y "@angular/cli@$NG" new consumer "${new_flags[@]}"
echo "::endgroup::"
cd consumer

echo "::group::npm install the packed UI Kit and its peers"
# No --legacy-peer-deps: an Angular major outside the published peer range must fail here.
npm install --no-audit --no-fund "$PACKAGE" \
  @cometchat/chat-sdk-javascript@^4.2.0 @cometchat/calls-sdk-javascript@^5.0.3 \
  @cometchat/cards-angular@^1.0.0 dompurify@^3.0.0
echo "::endgroup::"

# Root component: v20+ names it app.ts / app.html, older majors app.component.ts / .html.
ROOT_TS=
for f in src/app/app.ts src/app/app.component.ts; do
  if [ -f "$f" ]; then ROOT_TS=$f; break; fi
done
[ -n "$ROOT_TS" ] || { echo "no root component found in src/app"; exit 1; }
ROOT_HTML=${ROOT_TS%.ts}.html
node - "$ROOT_TS" <<'EOF'
const fs = require('fs');
const file = process.argv[2];
let src = fs.readFileSync(file, 'utf8');
src = `import { CometChatAvatarComponent } from '@cometchat/chat-uikit-angular';\n` + src;
src = src.replace(/imports:\s*\[([^\]]*)\]/, (_, inner) => `imports: [${inner.trim() ? inner.trim() + ', ' : ''}CometChatAvatarComponent]`);
if (!/CometChatAvatarComponent\]/.test(src)) throw new Error(`could not add the UI Kit import to ${file}`);
fs.writeFileSync(file, src);
EOF
echo '<cometchat-avatar name="Consumer App"></cometchat-avatar>' > "$ROOT_HTML"

if [ "$MODE" = zoneless ] && [ "$NG" -lt 20 ]; then
  # v17-19: experimental zoneless provider, and no zone.js polyfill.
  CONFIG=src/app/app.config.ts
  sed -i.bak -E "s/provideZoneChangeDetection\([^)]*\)/provideExperimentalZonelessChangeDetection()/; s/provideZoneChangeDetection/provideExperimentalZonelessChangeDetection/" "$CONFIG"
  node -e "const f='angular.json';const a=require('./'+f);const o=a.projects.consumer.architect.build.options;o.polyfills=(o.polyfills||[]).filter(p=>p!=='zone.js');require('fs').writeFileSync(f,JSON.stringify(a,null,2))"
  grep -q provideExperimentalZonelessChangeDetection "$CONFIG" || { echo "zoneless provider not applied"; exit 1; }
fi

# The generated app's default budgets measure the app, not compatibility.
node -e "const f='angular.json';const a=require('./'+f);const c=a.projects.consumer.architect.build.configurations.production;delete c.budgets;require('fs').writeFileSync(f,JSON.stringify(a,null,2))"

echo "::group::ng build"
npx ng build
echo "::endgroup::"

echo "::group::start the built app in headless Chromium"
# The repo's Playwright version, installed into the consumer app only for this check.
PW_VERSION=$(node -p "require('$REPO/package-lock.json').packages['node_modules/playwright'].version")
npm install --no-save --no-audit --no-fund "playwright@$PW_VERSION"
# On CI's Linux runners Chromium also needs its system libraries.
if [ -n "${CI:-}" ]; then npx playwright install --with-deps chromium; else npx playwright install chromium; fi
BROWSER_DIR=$(dirname "$(find dist -name index.html -not -path '*/server/*' | head -1)")
node "$REPO/scripts/ci/consumer-start-check.mjs" "$BROWSER_DIR"
echo "::endgroup::"
echo "Angular $NG ($MODE): the packed UI Kit installs, builds and starts."
