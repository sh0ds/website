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

# Three tracks

## Plan change · consoles, md, lift on the side

Did: dropped the 315-day plan after Day 5, focusing on things now that I really wanna do. New plan: CHIP-8 in C, ARM64 and the browser; PICO-8 and Picotron in Lua; a Markdown parser in Haskell for 3sgc; lift as a side project. Staging stays as it was. Templates, homepage and stylesheet use relative links now, so /next/ stays inside /next/. Pharo, Erlang and the live server are gone from the Pi.
Next: Step 0 (log helper takes the step, sh0ds/chip8 repo), then E1.
