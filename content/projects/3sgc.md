---
title: 3sgc, static site generator in C
summary: Static site generator in C11, libc and POSIX only. Builds this site.
---

3sgc builds this site. About 1,000 lines of C11, no dependencies beyond libc and POSIX.

# Pipeline

Walks content/, parses the front matter of each Markdown file, sorts posts by date, renders them through the HTML templates and writes the blog and project index pages. A push to main is live within 2 minutes.

# Supported

```
markdown   headings, paragraphs,
           fenced code blocks
templates  {{ title }} fields,
           {{#posts}} loop
build      -Wall -Wextra,
           ASan + UBSan
```

# Not yet

Lists, inline formatting, links, tables. They come with md, a Markdown parser I'm writing in Haskell: 3sgc will pipe every post through it, and markdown.c stays as the fallback.

# Source

The source repository is https://github.com/sh0ds/3sgc. This website repository keeps a local copy of the generator in src/ for its build.
