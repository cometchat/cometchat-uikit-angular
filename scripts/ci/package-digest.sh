#!/usr/bin/env bash
# The digest of an npm package's contents (A3, as React's release sync):
#
#   bash scripts/ci/package-digest.sh <package.tgz>     prints sha256:<hex>
#
# A sha256 over the sha256 of every file, sorted by path. It changes with any file's name or
# content, but not with the gzip or tar metadata, which can differ between Node and npm releases.
# The private release records it in the public release commit's message; the public repo's
# release workflow rebuilds, and publishes only a package with the same digest.
set -euo pipefail

contents=$(mktemp -d)
trap 'rm -rf "$contents"' EXIT
tar -xzf "$1" -C "$contents"
cd "$contents"
echo "sha256:$(find . -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum | sha256sum | cut -d' ' -f1)"
