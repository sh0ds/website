---
title: How my Raspberry Pi 5 runs sh0ds.dev
author: sh0ds
date: 2026-10-06
summary: What runs on my Pi 5 — Pi-hole, Unbound, nginx, restic, and a VPN tunnel that only carries DNS (because the full-tunnel version was a nightmare).
---

This website runs on a Raspberry Pi 5 on my desk. Headless, Ethernet to a FRITZ!Repeater, Wi-Fi off. Hostname rasberry-pizian, user sh0ds, static IP 192.168.178.36. Two drives: a 476 GB SD card for the system and a 931 GB HDD at /mnt/backup holding restic snapshots.

It works now. Before that, I broke it enough times to learn what not to do.

# What's actually running

The number of moving parts is deliberately small. Pi-hole filters DNS, Unbound resolves recursively (Pi-hole forwards to it on localhost port 5335), nginx serves sh0ds.dev on ports 80 and 443, ufw handles the firewall, Docker runs exactly one container (Uptime Kuma), restic backs everything up nightly, rpi-connect gives me remote access, and a WireGuard tunnel on the FRITZ!Box lets me reach home from outside.

One rule governs the machine: Keep It Simple, sh0ds.

# DNS: Pi-hole with Unbound

Every query on the network passes through Pi-hole, then Unbound, which resolves it from the root servers up. Pi-hole's only upstream is 127.0.0.1 on port 5335 — no external DNS servers anywhere in the chain.

```bash
pihole status
dig pi-hole.net @127.0.0.1 -p 5335   # NOERROR means it's good
```

At one point I bound Unbound to the tunnel interface with an outgoing-interface setting of 10.2.0.2. That broke DNS immediately. The routing rule below handles this without Unbound knowing a tunnel exists.

# nginx and certificates

nginx.conf serves the bare domain and www on ports 80 and 443, IPv4 only — there's no AAAA record, so no v6 listener. The web root is /srv/www. Inside it sits /srv/www/ramdisk, a tmpfs mount holding the live stats for the homepage; more on that below.

Certificates come from Let's Encrypt via acme.sh, installed as root, ECDSA ec-256, renewed automatically every 60 days.

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo su - -c '/root/.acme.sh/acme.sh --list'   # sudo alone refuses
```

# Backups: restic

Backups run daily at 03:30, offset by up to ten minutes of random delay. Restic writes snapshots to two destinations: the local HDD and a Hetzner Storage Box over SFTP. Retention keeps seven daily, four weekly, and six monthly snapshots, pruned after each run.

Uptime Kuma watches both destinations and tells me when one succeeds and the other doesn't.

To test a restore:

```bash
sudo systemctl start pi-backup.service
restic -r /mnt/backup/restic-pi snapshots
restic -r /mnt/backup/restic-pi restore latest --target /tmp/restore
```

A backup that has never been restored is not a backup.

# The Proton split tunnel

Only DNS egress — UDP to port 53 — travels through the tunnel. Websites, SSH, apt, restic to Hetzner, and rpi-connect all use the native connection.

Two things make this work. Table = off in the config, since wg-quick's automatic routing conflicts with ufw and Docker. And one policy rule in PostUp:

```bash
ip rule add dport 53 ipproto udp lookup 51820 priority 200
```

That table holds a single default route through protonvpn. Unbound is not bound to the tunnel; the rule picks up its queries invisibly, so no application knows the tunnel exists and boot order doesn't matter.

If the tunnel goes down, DNS goes down with it — queries fail closed rather than leaking. That's an acceptable trade. A fallback rule at priority 400 pointing at the main table would soften it, but I haven't needed one.

```bash
sudo wg show
dig @127.0.0.1 example.com   # then re-run wg show; counters should grow
curl https://api.ipify.org    # home IP, as expected
sudo wg-quick down protonvpn && sudo wg-quick up protonvpn
```

# How the website deploys

Pushing to main triggers a GitHub Actions workflow that SSHes into the Pi, pulls the repo at /srv/repo, recompiles the site generator, rebuilds the pages, and rsyncs the result into /srv/www. One push, and the build runs on the machine that serves it.

The first version of the pipeline failed twice over. The runner couldn't reach the Pi because ufw allowed SSH only from the LAN. Fixing that revealed the second problem: password authentication was still enabled in sshd. Opening the firewall without fixing that would have published a password prompt to the internet. Both are resolved — SSH is key-only and reachable on port 22.

# Live stats on the homepage

The homepage shows the Pi's CPU temperature, load, RAM usage, and uptime in real time. A cron job runs update_stats.sh every minute, which reads the sensors, formats the values, and writes pistats.json to the tmpfs at /srv/www/ramdisk. Main.js fetches the file via the relative path `/ramdisk/pistats.json` and updates the gauges every 10 seconds.

The tmpfs keeps the once-a-minute write off the SD card. It resets on reboot, and an @reboot cron entry refills it immediately. Early versions of the stats script had a UTF-8 encoding bug in the temperature field that displayed garbage characters. Replacing the broken `tr` command with sed fixed it. The uptime parser also started out stripping spaces from plural time units incorrectly, producing values like "5hs 37ms" before the pattern tolerance was added.

# What broke before

The full-tunnel setup accumulated exceptions, each with its own failure mode. LAN and SSH replies escaped through the tunnel and needed a priority-100 rule with its own table. Replies to external visitors arrived asymmetrically until a CONNMARK mangle pair fixed them. apt hung on IPv6 until a blackhole route and forced IPv4 took care of it. And rpi-connect's relay rejected Proton's exit IP until two address ranges got host routes.

Most of it traced back to leftover state — half-completed teardowns from earlier experiments caused more trouble than the logic itself. Making every hook command idempotent settled it.

Every exception began as a temporary workaround and became permanent. Simplicity scales.
