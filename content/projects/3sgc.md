---
title: 3sgc, static site generator in C
summary: Static site generator in C11, libc and POSIX only. Builds this site.
---

My first little C project, simple but helpful for generating the posts for this site. I wanted to have 0 dependencies, so it's just the standard C library and POSIX.

# Pipeline

Walks everything in the content folder, parses the front matter at the top and sorts the posts by date. Then renders the pages through the HTML templates and creates the blog and project index pages.

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

Lists, inline formatting, links, tables. I plan to extend the markdown converter step by step, but I kept it simple first so I finish the project and don't spend all my time on the md converter.

# Source

The source repository is https://github.com/sh0ds/3sgc. This website repository keeps a local copy of the generator in src/ for its build.
