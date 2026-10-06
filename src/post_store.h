#ifndef POST_STORE_H
#define POST_STORE_H

#include <limits.h>
#include <stddef.h>
#include "frontmatter.h"

typedef struct {
    FrontMatter fm;
    char md_path[PATH_MAX];
    char html_path[PATH_MAX];
    char rel_url[PATH_MAX];   /* e.g. blog/my-post.html */
    int is_blog;
} PostEntry;

typedef struct {
    PostEntry *entries;
    size_t count;
    size_t capacity;
} PostStore;

void post_store_init(PostStore *ps);
int  post_store_add(PostStore *ps, const PostEntry *e);
void post_store_sort_by_date(PostStore *ps);
void post_store_free(PostStore *ps);

#endif
