# sh0ds.dev

My little website, the static site generator that builds it, and whatever I learn along the way.

## Description

This is the source of [sh0ds.dev](https://sh0ds.dev). It runs on a Raspberry Pi 5 on my desk and gets built by [3sgc](https://github.com/sh0ds/3sgc), my own little static site generator in C. The website has a tweaked copy of it in `src/`. Posts are Markdown files in `content/`, 3sgc turns them into HTML with the templates in `templates/`, and the homepage I just write by hand.

I'm learning to make games right now (PICO-8, Picotron, Godot, my own engine in C and a Game Boy game in assembly), so the site will grow with that: game pages under `games/`, write-ups in `content/projects/` and devlogs in `content/blog/`.

There's only one branch. `main` is what's live, and I check everything locally before I push it.

## Appearance

Plain for now: one small stylesheet, system font, dark and a few colours from my desktop. I'll design the real look myself once I've learned some art.

## Getting Started

### Dependencies

* a C compiler and make, that's all 3sgc needs
* Linux or anything POSIX, I build on Arch and on the Pi (Debian)

### Installing

```
git clone https://github.com/sh0ds/website.git
cd website
make
```

The Makefile builds with AddressSanitizer on, so it's a bit slower than it has to be, but that's on purpose for now.

### Executing program

Build the site:

```
./build.sh
```

That rebuilds 3sgc and writes `blog/` and `projects/` next to the sources. For a live preview while editing:

```
python3 tools/preview.py
```

Then open http://localhost:8000. It rebuilds when a post or template changes and reloads the page every time you save.

A new post is just a new `.md` file in `content/blog/` with this on top:

```
---
title: My post
author: sh0ds
date: 2026-10-20
summary: One line for the blog list.
---
```

Deploying happens by itself. The Pi checks this repo every 2 minutes and rebuilds the site when `main` changes.

## Help

Found a bug or something broken on the site? Mail me at mail@sh0ds.dev, or check [security.txt](https://sh0ds.dev/.well-known/security.txt) if it's security related.

## License

No license for now, so feel free to read and learn from the code, but please don't copy it wholesale.
