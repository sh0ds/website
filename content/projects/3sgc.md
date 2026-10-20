---
title: 3sgc — static site generator in C
summary: A small static site generator written in C11. No dependencies. It builds this website.
---

3sgc (sh0ds static site generator) is this website's build tool — roughly 500 lines of C11, no dependencies beyond libc and POSIX.

# What it does

Walks a content directory, parses front matter from markdown files, sorts posts by date, renders them through HTML templates, and generates blog and project index pages. Push to main and the Pi pulls it and rebuilds the site within 2 minutes.

# Features

Headings, paragraphs, and fenced code blocks. Templates with `{{ title }}`-style placeholders and a `{{#posts}}` loop for listings. Builds with `-Wall -Wextra` plus ASan and UBSan on every compile.

Missing features are a deliberate work-in-progress: lists, inline formatting, and syntax highlighting classes are on the TODO list.

# Source

On GitHub. Written to be read.
