#!/usr/bin/env bash
# check-toolchain.sh: report which tools the sh0ds.dev overhaul needs are installed and working.
# Runs on the Arch desktop (x86_64, uses the cross toolchain + qemu-aarch64)
# and on the Pi (aarch64, runs everything natively). Changes nothing.
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
    printf 'OK    %s\n' "$name"
    pass=$((pass + 1))
  else
    printf 'FAIL  %s\n' "$name"
    fail=$((fail + 1))
  fi
}

section() { printf '\n== %s\n' "$1"; }

arch=$(uname -m)
if [ "$arch" = "aarch64" ]; then
  AS=as LD=ld GDB=gdb RUN=""
else
  AS=aarch64-linux-gnu-as LD=aarch64-linux-gnu-ld GDB=aarch64-linux-gnu-gdb RUN=qemu-aarch64
fi

section "Network (DNS must work before anything downloads)"
check "resolve hackage.haskell.org" getent hosts hackage.haskell.org
check "resolve registry.npmjs.org" getent hosts registry.npmjs.org

section "C"
printf 'int main(void){return 0;}\n' >"$tmp/t.c"
check "gcc with ASan/UBSan" gcc -Wall -Wextra -fsanitize=address,undefined -o "$tmp/t" "$tmp/t.c"
check "sanitized binary runs" "$tmp/t"
check "make" make --version
check "gdb" gdb --version
check "valgrind" valgrind --version
check "strace" strace -V
check "perf can count" perf stat -e task-clock true

section "ARM64 assembly ($arch)"
cat >"$tmp/h.s" <<'EOF'
    .section .rodata
msg: .ascii "ok\n"
    .text
    .globl _start
_start:
    mov x0, #1
    ldr x1, =msg
    mov x2, #3
    mov x8, #64
    svc #0
    mov x0, #0
    mov x8, #93
    svc #0
EOF
check "assemble" "$AS" -o "$tmp/h.o" "$tmp/h.s"
check "link" "$LD" -o "$tmp/h" "$tmp/h.o"
if [ -n "$RUN" ]; then
  check "run under qemu-aarch64" "$RUN" "$tmp/h"
else
  check "run natively" "$tmp/h"
fi
check "debugger ($GDB)" "$GDB" --version
check "objdump" objdump --version

section "Haskell"
check "ghc" ghc --version
check "ghc evaluates" ghc -e 'print (sum [1..10 :: Int])'
check "cabal" cabal --version
if [ "$arch" != "aarch64" ]; then
  check "stack" stack --version
  check "haskell-language-server" haskell-language-server-wrapper --version
fi

section "Web and WebAssembly"
if [ "$arch" != "aarch64" ]; then
  printf 'int add(int a, int b) { return a + b; }\n' >"$tmp/w.c"
  check "clang targets wasm32" clang --target=wasm32 -nostdlib -Wl,--no-entry -Wl,--export-all -o "$tmp/w.wasm" "$tmp/w.c"
  if command -v node >/dev/null; then
    check "node" node --version
    check "npm" npm --version
  else
    echo "  skip  node and npm (install them for E12 or lift)"
  fi
fi

section "Lua and fantasy consoles"
if [ "$arch" != "aarch64" ]; then
  check "pico-8" test -x "$HOME/.local/opt/pico-8/pico8"
  check "picotron" test -x "$HOME/.local/opt/picotron/picotron"
fi

section "SQL, shell, misc"
check "sqlite3" sqlite3 -version
check "sqlite window functions" sqlite3 :memory: 'select lag(1) over ();'
check "sqlite fts5" sqlite3 :memory: 'create virtual table t using fts5(x);'
check "shellcheck" shellcheck --version
check "gawk by name" gawk --version
printf '#include <zlib.h>\nint main(void){return crc32(0, 0, 0) != 0;}\n' >"$tmp/z.c"
check "jq" jq --version
check "netcat" command -v nc
check "zlib headers" gcc -o "$tmp/z" "$tmp/z.c" -lz
check "git" git --version

printf '\n%d OK, %d FAIL\n' "$pass" "$fail"
exit "$fail"
