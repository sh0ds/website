---
title: How my Raspberry Pi 5 runs sh0ds.dev
author: sh0ds
date: 2026-10-06
summary: What's actually on my Pi 5 — Pi-hole, Unbound, nginx, restic, and a VPN tunnel that only carries DNS (because the full-tunnel version was a nightmare).
---

So here's the thing: this website runs on a Raspberry Pi 5 under my desk, headless, connected to a FRITZ!Repeater, Wi-Fi off. Hostname rasberry-pizian, user sh0ds, static IP at 192.168.178.36. Two drives: the SD card for the system (476 GB), and a 931 GB HDD at `/mnt/backup` doing nothing but holding restic snapshots.

The setup works now, mostly because I spent enough time breaking it that I finally learned what not to do.

# What's actually running

I try to keep the number of moving parts low. Right now:

- Pi-hole for DNS filtering (everything filtered, ads gone)
- Unbound as the recursive resolver (Pi-hole talks to it on localhost:5335)
- nginx serving sh0ds.dev on ports 80 and 443
- ufw as the firewall
- Docker running exactly one container: Uptime Kuma
- restic backing up everything nightly via systemd timer
- rpi-connect for remote access (runs as a user service, not system)
- WireGuard tunnel on the FRITZ!Box itself — for reaching home stuff from outside

One rule runs this machine: Keep It Simple, sh0ds.

# DNS: Pi-hole with Unbound

Every query on my network goes through Pi-hole first, then Unbound, which resolves it recursively. The only upstream Pi-hole has is 127.0.0.1:5335 — no external DNS servers anywhere in the chain.

Here's what working looks like:

```bash
pihole status
dig pi-hole.net @127.0.0.1 -p 5335   # NOERROR means it's good
```

One thing I tried (and wish I hadn't): binding Unbound to the tunnel interface with `outgoing-interface: 10.2.0.2`. Broke DNS immediately. Removed it, never looked back. The routing rule I set up later catches the queries without Unbound even knowing a tunnel exists.

# nginx and certificates

nginx.conf handles both the bare domain and www, port 80 and 443, IPv4 only (the domain has no AAAA record, so no v6 listener needed). Web root at `/srv/www`, and `/srv/www/ramdisk` is excluded from backups — nothing important lives there anyway.

Certificates come from Let's Encrypt via acme.sh, installed as root, ECDSA (ec-256), auto-renewing every ~60 days. There's also a leftover user-level ~/.acme.sh install with no certificates — harmless, but annoying. Probably deleting it soon.

Quick sanity checks:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo su - -c '/root/.acme.sh/acme.sh --list'   # sudo alone refuses
```

# Backups: restic

Daily at 03:30, plus up to ten minutes of random delay so backups don't all thunder at once if the system wakes from suspend. Restic sends snapshots to two places: the local HDD and a Hetzner Storage Box over SFTP. Retention is seven daily, four weekly, six monthly — pruned after every run.

Uptime Kuma monitors both destinations. If one succeeds and the other fails, the notification fires. That silence is reassuring when it happens.

Testing a restore:

```bash
sudo systemctl start pi-backup.service
restic -r /mnt/backup/restic-pi snapshots
restic -r /mnt/backup/restic-pi restore latest --target /tmp/restore
```

Do this once in a while. A backup you've never tested isn't really a backup.

# The Proton split tunnel

This is the part that took the longest. Status as of today: operational. The full-tunnel version is retired at `/etc/wireguard/protonvpn-fulltunnel.bak` if you want to see what not to do.

Here's what actually works now: only DNS egress (UDP to port 53) travels through the tunnel. Everything else — websites, SSH, apt, restic to Hetzner, rpi-connect — leaves via the native connection.

Two design choices make this possible:

1. Table = off in the config (wg-quick's automatic routing breaks ufw and Docker)
2. One policy rule in PostUp:

```bash
ip rule add dport 53 ipproto udp lookup 51820 priority 200
```

That table contains nothing but `default dev protonvpn`.

Unbound is deliberately not bound to the tunnel. The routing rule catches its queries transparently, so no application knows the tunnel exists. No boot-order races. Clean.

The trade-off is brutal: if the tunnel dies, DNS dies. Queries fail closed. I'm okay with that — better a hard failure than silently leaking traffic. If resilience mattered more, I could add a fallback rule at priority 400 pointing at the main table. Haven't needed to yet.

Checking it:

```bash
sudo wg show
dig @127.0.0.1 example.com   # then re-run wg show; counters should grow
curl https://api.ipify.org    # home IP, as expected
sudo wg-quick down protonvpn && sudo wg-quick up protonvpn
```

# What broke before (lessons learned)

The full-tunnel setup needed an ever-growing pile of exceptions, each with its own failure mode:

1. LAN/SSH replies escaping via the tunnel — priority-100 rule with its own table
2. Website replies to external visitors becoming asymmetric — CONNMARK mangle pair
3. apt hanging on IPv6 — blackhole route plus forced IPv4 in apt config
4. rpi-connect's relay refusing Proton's exit IP — host routes for two address ranges

Three things stuck with me from that mess:

- Leftover state killed most of it. Every hook command must be idempotent (`|| true`, `route replace`). Half-completed teardowns caused more bugs than the actual logic.

- rpi-connect is a user-level service, not system. `sudo systemctl enable rpi-connect` fails by design. You need `loginctl enable-linger sh0ds` to survive headless boots.

- Exit IPs churn per tunnel cycle. Long-lived relay sessions get stuck. `rpi-connect restart` fixes it.

The meta-lesson, honestly: complexity was the bug. Every exception I added felt like a temporary workaround. Six months later, all of them were permanent. Simplicity scales. Maintenance doesn't.

That's it. This is the full tour — the stuff I keep around because it earns its keep, not because I like collecting services.
