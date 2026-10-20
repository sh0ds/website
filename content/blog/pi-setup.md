---
title: How my Raspberry Pi 5 runs sh0ds.dev
author: sh0ds
date: 2026-10-20
summary: I rebuilt my Pi from scratch with fewer moving parts. Here's what runs on it now.
---

This website runs on a Raspberry Pi 5 on my desk. It used to run off an SD card with Pi-hole, Unbound, nginx, Docker and a VPN tunnel that only carried DNS. It worked, but every fix added another piece, and in the end I couldn't tell which piece broke what. So I wiped it and started over.

# The hardware

A Pi 5 with 8 GB of RAM, booting from an NVMe SSD now instead of the SD card. A 1 TB HDD sits next to it for backups. It runs Raspberry Pi OS Lite, no desktop, plugged into the router with a cable.

# What runs on it

AdGuard Home blocks ads and trackers for the whole house and sends everything else encrypted to Quad9. It replaced Pi-hole, Unbound and the VPN tunnel in one go.

Caddy serves this site and gets the certificates by itself. It replaced nginx and acme.sh, and the whole config fits on one screen.

That's it for services. No Docker, no tunnel.

# How the site gets here

Before, GitHub logged into the Pi over SSH every time I pushed. That meant SSH had to be open to the whole internet. Now it's the other way around: the Pi asks GitHub every 2 minutes if main moved, and if it did, it builds the site with 3sgc and swaps it in. SSH is only reachable from home now.

# Backups and alerts

Every night at 03:30 restic backs everything up twice, once to the HDD and once to a Hetzner Storage Box. A small script checks every 5 minutes that DNS answers, the site loads, the certificate isn't about to run out and the disks are fine, then pings healthchecks.io. If something breaks, or the Pi dies and stops pinging, my phone buzzes.

# The live stats

The numbers on the homepage come from a script that runs every minute and writes a small JSON file to a RAM disk, so the SSD doesn't get written to all day. The homepage fetches it every 10 seconds.

# One command

When I SSH in I get my usual terminal look and a command called pi. It shows everything on one screen: services, last health check, last backup, certificate, last deploy, disks and updates. Green means fine. I don't have to remember a single service name anymore.

# What I learned

Complexity was the bug. Half the problems I fixed on the old setup were leftovers from earlier fixes. The new one has fewer parts, every part does one job, and when something breaks I know where to look.
