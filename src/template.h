#ifndef TEMPLATE_H
#define TEMPLATE_H

#include <stdio.h>
#include "frontmatter.h"
#include "post_store.h"

int fill_temp(FILE *out, const char *temp, FILE *md, const FrontMatter *fm);
int fill_index(FILE *out, const char *temp, const PostStore *ps, int blog);

#endif
