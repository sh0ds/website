---
title: 3sgc — my static site generator
author: sh0ds
date: 2026-10-06
summary: A static site generator written in C11, from scratch, with no dependencies. It builds this website. Yes, all of it.
---

Quick disclaimer: the page you're reading right now was built by the thing this page is about. The generator is feeding itself. If that sentence sounds like fun to you, you'll probably like the rest of this.

# Why I built it

Because existing generators felt like too much. Hugo is a small operating system disguised as a website tool. Jekyll needs Ruby. Eleventy needs Node. I wanted markdown in, HTML out, with a blog index sorted by date — and I wanted to understand every line that does it.

So 3sgc (sh0ds static site generator, in C) is exactly that. Roughly 500 lines of C11, no dependencies beyond libc and POSIX, one binary.

# What it does

The pipeline is three passes:

- **Collect** — walk the content directory, parse front matter, stash everything in a dynamically growing array (my first real malloc/realloc workout)
- **Sort** — qsort by date, newest first
- **Render** — markdown to HTML, pour it through a template, generate blog and project listings

The template engine understands about six placeholders and one looping construct. That's it. No filters, no partials, no plugin system. The looping construct exists because writing blog links by hand would defeat the point.

# The markdown situation

Honest status report: 3sgc converts headings, paragraphs, and fenced code blocks. That's the entire feature set. Lists, bold, links — all still on the TODO list, which means half of this very page is prose because I literally can't bullet-point it yet. The blog post about my Raspberry Pi is the current stress test: it uses everything the converter supports and visibly breaks on everything it doesn't.

Building the parser wrong a few times taught me more about markdown's edge cases than any spec reading ever did. Escaping alone is a rabbit hole.

# The stuff I'm proud of

The build is paranoia-first: `-Wall -Wextra` plus AddressSanitizer and UndefinedBehaviorSanitizer on every compile. That caught a qsort comparator asymmetry bug (returning 1 for "equal" — undefined behavior, zero remorse from the compiler until ASan stepped in) and an off-by-one that ate the last character of every template section marker.

The error handling philosophy: if a fopen fails, say which file. Half the debugging session stories in my other posts would have been ten-minute fixes if tools just admitted where they failed. Being that tool felt like the least I could do.

# Deployment

The whole site deploys through GitHub Actions: push to main, runner SSHes into the Pi, recompiles 3sgc, regenerates the site, rsyncs it into the nginx root. Getting that pipeline green was its own adventure — two network misconfigurations, one latent `PasswordAuthentication yes`, and a tmpfs mount that refused to be garbage-collected. Details in the blog post below, if you enjoy that kind of story.

# TODO

- [ ] Lists (yes, really, still)
- [ ] Inline formatting — bold, italic, links
- [ ] Code fence info-strings for syntax highlighting
- [ ] A dynamic homepage instead of the hand-written index.html
- [ ] Cleanup mode so renamed posts don't haunt the output

# Where to find it

The source is on GitHub: [github.com/sh0ds/3sgc](https://github.com/sh0ds/3sgc). It's meant to be read, not hidden — the whole point of writing it was knowing every line.

One rule ran this project from day one: Keep It Simple, Sh0ds. Every feature has to earn its line count. So far the roadmap items above are the only ones that have.
