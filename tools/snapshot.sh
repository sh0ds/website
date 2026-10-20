#!/usr/bin/env bash
# snapshot.sh DIR: copy what the deploy publishes into DIR (relative to the repo root).
set -euo pipefail
dest=${1:?usage: snapshot.sh DIR}
cd "$(dirname "$0")/.."
rm -rf "$dest"
rsync -a --exclude-from=tools/deploy-excludes.txt ./ "$dest/"
