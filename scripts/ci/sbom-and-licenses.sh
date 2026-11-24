#!/usr/bin/env bash
# CI 5 (ENG-40493): SBOM and licence check for what a customer actually installs.
#
#   scripts/ci/sbom-and-licenses.sh <package .tgz> <out-dir>
#
# Installs the packed UI Kit with its dependencies and peers into an empty project (as a
# customer's `npm install` would), then:
#   - writes <out-dir>/sbom.cdx.json, a CycloneDX SBOM of that install;
#   - fails if any third-party package has a licence outside the allowlist below. CometChat's
#     own packages are listed, not judged: their licence fields are URLs or "SEE LICENSE IN"
#     until Track 2 GOV1 settles a machine-readable licence.
set -euo pipefail

TARBALL=$(realpath "$1")
# The licence allowlist is shared with deps-review.mjs, which checks new packages on every PR.
ALLOWLIST="$(cd "$(dirname "$0")" && pwd)/licence-allowlist.json"
OUT=$(mkdir -p "$2" && realpath "$2")
WORK=${RUNNER_TEMP:-/tmp}/sbom-install
rm -rf "$WORK" && mkdir -p "$WORK" && cd "$WORK"
npm init -y > /dev/null
npm install --no-audit --no-fund "$TARBALL" > /dev/null

npx -y @cyclonedx/cyclonedx-npm@6.0.1 --omit dev --output-format JSON --output-file "$OUT/sbom.cdx.json"
echo "SBOM: $(node -p "require('$OUT/sbom.cdx.json').components.length") components → $OUT/sbom.cdx.json"

ALLOWED=$(node -p "require('$ALLOWLIST').join(';')")
echo "CometChat packages (licence decided by GOV1, not checked here):"
node -e "for (const c of require('$OUT/sbom.cdx.json').components) if ((c.group || '').startsWith('@cometchat')) console.log('  ' + c.group + '/' + c.name + '@' + c.version + ': ' + (c.licenses || []).map(l => l.license?.id || l.license?.name || l.expression).join(', '))"
npx -y license-checker-rseidelsohn@5.0.1 --production --excludePrivatePackages \
  --excludePackagesStartingWith '@cometchat/' \
  --onlyAllow "$ALLOWED" --summary
