#ifndef MARKDOWN_H
#define MARKDOWN_H
#include <stdio.h>

int md_to_html(const char *md_path, const char *html_path);
int md_convert(FILE *md_file, FILE *html_file);
void strip_nl(char *s);
void write_text(FILE *out, const char *s);

#endif
