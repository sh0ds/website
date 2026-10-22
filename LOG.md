# LOG

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

Did: log helper added, creates new entry when typing 'log' in kitty
Stuck: permissions for the file missing, mixed up repo and local dotfiles
Learned: always edit local dotfiles, not repo; chmod 777 helpers
Redo: delete the log helper, get running again from memory
Next: Day 4, SQL placement

## Day 4 · week 0

Did: last 3 SQLBolt exercises, 5 pgexercises aggregation problems
Stuck: floating point division with 2 decimal places
Learned: division by 1.0 instead of 1, round() lets you decide decimal places
Redo: nothing
Next: Day 5, staging at /next/
