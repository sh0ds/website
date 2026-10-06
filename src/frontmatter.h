#ifndef FRONTMATTER_H
#define FRONTMATTER_H
#include <stdio.h>

typedef struct {
  char title[256];
  char author[128];
  char date[16];
  char summary[512];
} FrontMatter;

int parse_fm(FILE *md, FrontMatter *fm);

#endif
