---
title: How my Raspberry Pi 5 runs sh0ds.dev
author: sh0ds
summary: How I rebuilt my Pi from scratch: NVMe boot, AdGuard Home, Caddy, pull-based deploys and restic backups.
---

My old setup was an SD card with Pi-hole, Unbound, nginx, acme.sh, Docker and a VPN tunnel that only carried DNS. Every fix added another part, and after a while I had no idea which part broke what. So I wiped it and started over.

# Hardware

```
board  Raspberry Pi 5, 8 GB
root   NVMe SSD (was: SD card)
backup 1 TB HDD, USB
os     Pi OS Lite, no desktop
net    ethernet to the router
```

# Services

AdGuard Home does DNS for the whole house. It blocks what's on the blocklists and sends everything else encrypted to Quad9, so Pi-hole, Unbound and the tunnel are gone.

Caddy serves the site and takes care of the TLS certificates by itself, which replaces nginx and acme.sh. The whole config fits on one screen.

No Docker, no tunnel. The router only forwards 80 and 443, and SSH only works from my LAN.

# Deploys

Before, GitHub logged into the Pi over SSH on every push, so SSH had to be open to the internet. Now the Pi pulls instead. A systemd timer checks every 2 minutes if main changed, and if it did, it pulls, builds with 3sgc and swaps the new output into /srv/www.

# Backups and alerts

restic runs at 03:30 and makes two copies, one on the HDD and one on a Hetzner Storage Box. On 27 October the HDD dropped off USB and the local backup failed for a whole week before I noticed :( Now it mounts through x-systemd.automount, so it comes back by itself when the disk shows up again.

A health script runs every 5 minutes and checks that DNS answers, the site loads, the certificate is valid and the disks are fine. Then it pings healthchecks.io. If a check fails or the Pi stops pinging, I get a push on my phone.

# Live stats

Every minute a timer writes temp, load, memory and uptime to /ramdisk/pistats.json. It's a RAM disk so the SSD doesn't get written to all day. The old homepage showed them live, the current one doesn't yet.

# pi

One command over SSH that shows me the services, the last health check, last backup, when the certificate runs out, the last deploy, the disks and pending updates, all on one screen. Green means fine, and I don't have to remember any service names.

# Takeaway

Most bugs on the old setup were leftovers from earlier fixes. Now there are fewer parts, each with one job, so when something breaks I know where to look.
