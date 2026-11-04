# LOG

What I did, what broke and what I learned, one entry per step. The plan has three tracks: E (CHIP-8), P (PICO-8 and Picotron), M (`md` and 3sgc), plus L (`lift`) on the side.

Entry headings: `## E1 · title`, `## P2 · title`, `## M3 · title`, `## L1 · title`. A second sitting on the same step adds to its entry. Ships: `## Ship · E·1 · name`. Every sitting ends with a commit. New entries go at the bottom.

Open: snprintf truncation warning in src/index.c:56 (fix for real in M6).

# Setup, under the old plan

## C placement · refresher needed

Pointers, strings, fgets + strtol.

## Day 1 · week 0

Did: copied check-toolchain.sh to ~/code, added Pharo, sqlite fts5, gawk and zlib checks, ran it on desktop and Pi.
Stuck: GHC failed over ssh because .bashrc returned before loading ghcup. Fixed by sourcing ~/.ghcup/env above the guard.
Learned: non-interactive ssh still reads .bashrc but stops at the [ $- != *i* ] line.
Redo: nothing.
Next: Day 2, next branch, build.sh, snapshot baseline.

## Day 2 · week 0

Did: created the next branch, wrote build.sh, generated tools/deploy-excludes.txt from site-deploy, wrote snapshot.sh, took the first baseline.
Stuck: didn't get what deploy-excludes was for until I saw snapshot.sh uses it.
Learned: a leading / in an rsync exclude anchors it to the repo root.
Redo: the excludes grep, by hand without looking.
Next: Day 3, LOG.md and the log helper.

## Day 3 · week 0

Did: log helper added, creates a new entry when typing `log` in kitty.
Stuck: permissions for the file missing, mixed up repo and local dotfiles.
Learned: always edit the local dotfiles, not the repo; a helper needs the execute bit (chmod +x, 755), not 777.
Redo: delete the log helper, get it running again from memory.
Next: Day 4, SQL placement.

## Day 4 · week 0

Did: last 3 SQLBolt exercises, 5 pgexercises aggregation problems.
Stuck: floating point division with 2 decimal places.
Learned: divide by 1.0 instead of 1, round() lets you decide decimal places.
Redo: nothing.
Next: Day 5, staging at /next/.

## SQL placement · indexes

## Day 5 · week 0

Did: read site-deploy, staging worktree /srv/repo-next live (67da649), site-stage installed, rebuilds next only. Detour: backup HDD had dropped off USB on 27 Oct, e2fsck + remount, backup rerun, x-systemd.automount in fstab.
Stuck: didn't get the worktree setup at first; HDD unmounted for a week without me noticing.
Learned: site-deploy compares origin/<branch> with the hash in deployed-<branch>, deleting that file forces a rebuild. -x build.sh picks build.sh over make + 3sgc. /next/ is excluded from main's rsync, otherwise --delete wipes staging. Subshells because bash ignores set -e inside if/||.
Redo: the three site-deploy facts from memory, without the walkthrough.
Next: the plan change.

---

## Plan change · indie and jam games

2026-11-03: dropped the CHIP-8 / md plan the same day I wrote it. Making games is what I want most, so it's now indie and jam games: PICO-8 and Picotron first, jams every 4 to 6 weeks, then Godot and a small engine of my own in C, and a portfolio on itch.io and sh0ds.dev/games/. The three end goals are a Zelda-like, a horror game and a metroidvania, each one tiny first, then as a slice in Godot. lift and md are out, and 3sgc keeps markdown.c (track W). The old plan lives in the guides history.

## P1 · Lua in my own rice
Did: PiL ch. 1-5 with the lua REPL open. Answered the four P1 questions. rice.lia read, inner gaps smaller.
Stuck: thought # stops at the first nil. Running it showed otherwise.
Learned:
- #t returns *a* border, not the first one. With holes the result depends on how the table was built ({1,2,nil,4} gives 4). Never trust # on a list with holes. Remove with table.remove (del/deli in PICO-8).
- obj:f() passes obj as the first argument. function obj:f() names it self. Calling obj.f() leaves self nil: "attempt to index a nil value (local 'self')".
- Plain x is global, visible everywhere. local x lives only in its block. A for-loop variable is always local.
- The free online PiL is Lua 5.0 and has no #. Use the 5.4 manual for that.
Redo: explain borders and #, and the : sugar, from memory without the REPL.
Next: P2, something moves in pico.
