# sh0ds.dev

My website, the static site generator that builds it, and what I learn along the way.

## Description

This is the source of [sh0ds.dev](https://sh0ds.dev). The site runs on a Raspberry Pi 5 on my desk and gets built by [3sgc](https://github.com/sh0ds/3sgc), a little static site generator I wrote in C (a local copy lives in `src/`). Posts are Markdown files in `content/`, 3sgc turns them into HTML with the templates in `templates/`. The homepage is hand-written.

This repo is also where I learn. I'm learning to make games (PICO-8 and Picotron first, later Godot and a small engine of my own in C), and the site grows with that: game pages under `games/`, write-ups in `content/projects/`, and devlogs in `content/blog/`.

There's one branch. `main` is what's live, and I look at a change locally before I push it.

## Appearance

Plain for now: one small stylesheet, system font, dark, a few colours from my desktop. No logo, no theme. I'll design the real look myself once the art steps of my game plan are done.

## Getting Started

### Dependencies

* a C compiler and make (that's it for 3sgc)
* Linux or anything POSIX, I build on Arch and on the Pi (Debian)

### Installing

```
git clone https://github.com/sh0ds/website.git
cd website
make
```

The Makefile builds with AddressSanitizer turned on, so it's a bit slower than it needs to be (on purpose, for now).

### Executing program

Build the site:

```
./build.sh
```

That rebuilds 3sgc and writes `blog/` and `projects/` next to the sources. To look at it locally:

```
python -m http.server
```

and open http://localhost:8000. A new post is just a new `.md` file in `content/blog/` with this on top:

```
---
title: My post
author: sh0ds
date: 2026-10-20
summary: One line for the blog list.
---
```

Deploying happens by itself: the Pi checks this repo every 2 minutes and rebuilds the site when `main` moves.

## Help

Found a bug or something broken on the site? Mail me at mail@sh0ds.dev, see [security.txt](https://sh0ds.dev/.well-known/security.txt) if it's security related.

## License

No license for now, so feel free to read and learn from the code, but please don't copy it wholesale.
