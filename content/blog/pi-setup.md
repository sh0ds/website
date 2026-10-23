---
title: How my Raspberry Pi 5 runs sh0ds.dev
author: sh0ds
date: 2026-10-20
summary: Rebuild from scratch: NVMe boot, AdGuard Home, Caddy, pull-based deploys, restic backups.
---

Old setup: SD card, Pi-hole, Unbound, nginx, acme.sh, Docker and a VPN tunnel that only carried DNS. Every fix added a part, and after a while I couldn't tell which part broke what. Wiped it, started over.

# Hardware

```
board  Raspberry Pi 5, 8 GB
root   NVMe SSD (was: SD card)
backup 1 TB HDD, USB
os     Pi OS Lite, no desktop
net    ethernet to the router
```

# Services

AdGuard Home does DNS for the whole house: blocklists, everything else forwarded encrypted to Quad9. Replaces Pi-hole, Unbound and the tunnel.

Caddy serves the site and handles TLS certificates itself. Replaces nginx and acme.sh. The config fits on one screen.

No Docker, no tunnel. Router forwards 80 and 443 only, SSH is LAN-only.

# Deploys

Old way: GitHub logged into the Pi over SSH on every push, so SSH had to be open to the internet. New way is pull-based. A systemd timer checks every 2 minutes whether main moved. If it did, it pulls, builds with 3sgc and swaps the output into /srv/www.

# Backups and alerts

restic runs at 03:30 and writes two copies, one to the HDD and one to a Hetzner Storage Box. A health script runs every 5 minutes: DNS answers, site loads, certificate valid, disks fine. Then it pings healthchecks.io. If a check fails, or the Pi stops pinging, my phone gets a push.

# Live stats

A timer writes temp, load, memory and uptime to /ramdisk/pistats.json every minute. RAM disk, so the SSD isn't written all day. The homepage polls the file every 10 seconds.

# pi

One command over SSH that prints services, last health check, last backup, certificate expiry, last deploy, disks and pending updates on one screen. Green is fine. No service names to remember.

# Takeaway

Most bugs on the old setup were leftovers from earlier fixes. Fewer parts, one job each, and a failure points at one place.
