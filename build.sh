#!/usr/bin/env bash
# build.sh: how the site builds. site-deploy runs it on the Pi (as user deploy);
# you run it on the desktop before pushing. The Makefile always builds with ASan/UBSan.
set -euo pipefail
cd "$(dirname "$0")"
make clean
make
rm -rf blog projects log
./build/3sgc "$PWD" build
