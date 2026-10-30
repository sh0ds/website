# Terminess

`terminess-nerd-font-mono-regular.woff2` is the regular **Terminess Nerd Font Mono**
used by the desktop, from Nerd Fonts v3.4.0 (Terminus TTF 4.49.3).

Source: https://github.com/ryanoasis/nerd-fonts/tree/v3.4.0/patched-fonts/Terminus

The upstream TTF is converted to WOFF2 with FontTools, preserving the letterforms, names and metrics. Its web subset includes Latin,
Greek, Cyrillic, punctuation, arrows and box-drawing characters; unused Nerd Font
icons are omitted to keep the download small. No third-party font service is used.

```sh
pyftsubset TerminessNerdFontMono-Regular.ttf --flavor=woff2 \
  --unicodes='U+0000-052F,U+1E00-1EFF,U+2000-26FF,U+FFFD' \
  --name-IDs='*' --name-legacy --name-languages='*' \
  --output-file=terminess-nerd-font-mono-regular.woff2
```

Install `fonttools[woff]` to reproduce the conversion. The font is licensed under
the SIL Open Font License 1.1; see [Terminess-LICENSE.txt](Terminess-LICENSE.txt).
The website uses 18 px, matching kitty's 13.5 pt default at 96 dpi. Browser and
terminal rasterization may differ, especially at non-integer display scales.
