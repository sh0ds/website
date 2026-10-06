#ifndef BUILD_H
#define BUILD_H

#include "post_store.h"

int build_content(const char *src, const char *dst, const char *temp,
                  PostStore *ps);
int render_page(const char *temp_path, const char *md_path,
                const char *html_path);

#endif
