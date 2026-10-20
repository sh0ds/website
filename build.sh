#!/usr/bin/env bash
# build.sh: how this branch builds. site-deploy runs it on the Pi (as user deploy);
# you run it on the desktop. SAN=1 ./build.sh builds 3sgc with sanitizers (week 7).
set -euo pipefail
cd "$(dirname "$0")"
make clean
make ${SAN:+SAN=1}
rm -rf blog projects
./build/3sgc "$PWD" build
