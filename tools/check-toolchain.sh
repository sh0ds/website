#!/usr/bin/env bash
# check-toolchain.sh: which tools the games plan needs are installed and working.
# Runs on the Arch desktop and on the Pi. Changes nothing.
# "later" tools only report MISSING (no failure) until their track starts.
# Usage: bash check-toolchain.sh        exit code = number of failures
set -u

pass=0
fail=0
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

check() {
  local name=$1
  shift
  if "$@" >/dev/null 2>&1; then
    printf 'OK       %s\n' "$name"
    pass=$((pass + 1))
  else
    printf 'FAIL     %s\n' "$name"
    fail=$((fail + 1))
  fi
}

later() {
  local name=$1
  shift
  if "$@" >/dev/null 2>&1; then
    printf 'OK       %s\n' "$name"
  else
    printf 'MISSING  %s (later)\n' "$name"
  fi
}

section() { printf '\n== %s\n' "$1"; }

section "Site: 3sgc and the deploy (desktop and Pi)"
printf 'int main(void){return 0;}\n' > "$tmp/t.c"
check "gcc with ASan/UBSan" gcc -Wall -Wextra -fsanitize=address,undefined -o "$tmp/t" "$tmp/t.c"
check "sanitized binary runs" "$tmp/t"
check "make" make --version
check "gdb" gdb --version
check "git" git --version
check "rsync" rsync --version
check "shellcheck" shellcheck --version

if [ "$(uname -m)" = "aarch64" ]; then
  printf '\nOn the Pi: only the site tools above matter.\n'
else
  section "PICO-8 and Picotron"
  check "lua 5.4" lua -v
  check "pico-8" test -x "$HOME/.local/opt/pico-8/pico8"
  check "picotron" test -x "$HOME/.local/opt/picotron/picotron"

  section "Craft"
  check "aseprite (or pixelorama)" sh -c 'command -v aseprite || command -v pixelorama'
  check "ffmpeg (GIFs)" ffmpeg -version
  check "wf-recorder (capture)" wf-recorder --version

  section "Shipping"
  later "butler (itch.io uploads)" butler --version

  section "Godot"
  later "godot" sh -c 'godot --version || godot4 --version'

  section "Your own engine"
  later "SDL3 headers" pkg-config --exists sdl3
  later "lua headers" sh -c 'pkg-config --exists lua5.4 || pkg-config --exists lua'
  later "emscripten" emcc --version
fi

printf '\n%d ok, %d failed\n' "$pass" "$fail"
exit "$fail"
