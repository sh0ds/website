#include "post_store.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void post_store_init(PostStore *ps)
{
    ps->count = 0;
    ps->capacity = 8;
    ps->entries = malloc(ps->capacity * sizeof(PostEntry));
    if (ps->entries == NULL) {
        perror("post_store_init");
        exit(1);
    }
}

int post_store_add(PostStore *ps, const PostEntry *e)
{
    if (ps->count == ps->capacity) {
        size_t new_cap = ps->capacity * 2;
        PostEntry *grown = realloc(ps->entries,
                                   new_cap * sizeof(PostEntry));
        if (grown == NULL) {
            perror("post_store_add");
            return -1;
        }
        ps->entries = grown;
        ps->capacity = new_cap;
    }
    ps->entries[ps->count++] = *e;   /* fixed buffers: plain copy is fine */
    return 0;
}

/* ISO dates (YYYY-MM-DD) sort correctly with strcmp; newest first,
 * empty dates last. Must be a strict weak ordering or qsort is UB. */
static int cmp_date_desc(const void *a, const void *b)
{
    const PostEntry *ea = a, *eb = b;

    if (ea->fm.date[0] == '\0' && eb->fm.date[0] == '\0')
        return 0;
    if (ea->fm.date[0] == '\0')
        return 1;
    if (eb->fm.date[0] == '\0')
        return -1;
    return strcmp(eb->fm.date, ea->fm.date);
}

void post_store_sort_by_date(PostStore *ps)
{
    if (ps->count > 1)
        qsort(ps->entries, ps->count, sizeof(PostEntry), cmp_date_desc);
}

void post_store_free(PostStore *ps)
{
    free(ps->entries);
    ps->entries = NULL;
    ps->count = 0;
    ps->capacity = 0;
}
