# sh0ds.dev

My website, the static site generator that builds it, and (soon) everything I learn along the way.

## Description

This is the source of [sh0ds.dev](https://sh0ds.dev). The site runs on a Raspberry Pi 5 on my desk and gets built by 3sgc, a little static site generator I wrote in C (it lives in `src/`). Posts are Markdown files in `content/`, 3sgc turns them into HTML with the templates in `templates/`. The homepage is hand-written and shows the Pi's live stats.

This repo is also my learning project. Over the next months I'm working through Bash, SQL, C, ARM64 assembly, Haskell, Pharo and Erlang, and every language ends up building a piece of this site. That work happens on the `next` branch:

- `main` is what's live right now
- `next` is the rebuilt site, plus the tools I write for it under `tools/` and `LOG.md`, where I write down what I did, what broke and what I learned every session

You can watch it at [sh0ds.dev/next](https://sh0ds.dev/next/) while it's in progress. When it's done, `next` becomes `main`.

## Appearance

The site shares the Diag desktop's flat panel rails, square navigation controls,
one-pixel separators and two-pixel focus markers. The Pi palette stays raspberry
pink and leaf green, with amber warnings and the existing sky-blue pipeline labels.
The Raspberry logo, repository QR, diagnostic columns, section order and page
routes are unchanged.

The VT323 font stays self-hosted. Colour transitions take 120 ms and respect
reduced-motion preferences; nothing slides or scales. Narrow screens collapse
columns without hiding content. Keyboard users can skip the header and see focus
on navigation links and complete file rows.

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
./build/3sgc "$PWD" build
```

That writes `blog/` and `projects/` next to the sources. To look at it locally:

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
