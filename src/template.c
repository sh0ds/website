#include "template.h"
#include "markdown.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int name_is(const char *name, int len, const char *word)
{
    return (strlen(word) == (size_t)len && strncmp(name, word, len) == 0);
}

static const char *get_value(const FrontMatter *fm, const char *key, int len)
{
    if (name_is(key, len, "title"))
        return fm->title;
    else if (name_is(key, len, "author"))
        return fm->author;
    else if (name_is(key, len, "date"))
        return fm->date;
    else if (name_is(key, len, "summary"))
        return fm->summary;
    return NULL;
}

int fill_temp(FILE *out, const char *temp, FILE *md, const FrontMatter *fm)
{
    int len;
    const char *open = NULL, *close = NULL, *key_end = NULL;
    const char *cursor = temp, *value;

    while (1) {
        if ((open = strstr(cursor, "{{")) == NULL) {
            fputs(cursor, out);
            break;
        }

        fwrite(cursor, 1, open - cursor, out);
        open = open + 2;

        if ((close = strstr(open, "}}")) == NULL) {
            fprintf(stderr, "No closing '}}' found.\n");
            return -1;
        }

        while (*open == ' ')
            open++;
        key_end = close;
        while (*(key_end - 1) == ' ')
            key_end--;

        len = (int)(key_end - open);
        if (len <= 0) {
            fprintf(stderr, "Invalid placeholder.");
            return -1;
        }

        if (name_is(open, len, "content") == 1) {
            if (md_convert(md, out) == -1)
                return -1;
        } else {
            if ((value = get_value(fm, open, len)) == NULL) {
                fprintf(stderr, "Unknown name: %.*s\n", len, open);
                return -1;
            }
            write_text(out, value);
        }

        cursor = close + 2;
    }
    return 0;
}

/* render one instance of the {{#posts}} item for a single entry */
static int fill_item(FILE *out, const char *buf, const FrontMatter *fm,
                     const char *url)
{
    const char *cursor = buf, *open, *close, *key_end, *value;
    int len;

    while (1) {
        if ((open = strstr(cursor, "{{")) == NULL) {
            fputs(cursor, out);
            break;
        }

        fwrite(cursor, 1, open - cursor, out);
        open = open + 2;

        if ((close = strstr(open, "}}")) == NULL) {
            fprintf(stderr, "No closing '}}' found.\n");
            return -1;
        }

        while (*open == ' ')
            open++;
        key_end = close;
        while (*(key_end - 1) == ' ')
            key_end--;

        len = (int)(key_end - open);
        if (len <= 0) {
            fprintf(stderr, "Invalid placeholder.\n");
            return -1;
        }

        if (name_is(open, len, "url")) {
            fputs(url, out);
        } else if ((value = get_value(fm, open, len)) == NULL) {
            fprintf(stderr, "Unknown name: %.*s\n", len, open);
            return -1;
        } else {
            write_text(out, value);
        }

        cursor = close + 2;
    }
    return 0;
}

/*
 * Render a listing template containing a
 * {{#posts}} ... {{/posts}} section, once per matching entry.
 */
int fill_index(FILE *out, const char *temp, const PostStore *ps, int blog)
{
    const char *sect, *end, *item;
    char *buf;
    size_t item_len;
    int result = 0;

    sect = strstr(temp, "{{#posts}}");
    if (sect == NULL || (end = strstr(sect, "{{/posts}}")) == NULL) {
        fprintf(stderr, "Missing {{#posts}}...{{/posts}} section.\n");
        return -1;
    }

    /* copy the inner slice into its own NULL-terminated string.
       NOTE: both markers are 10 chars long: "{{#posts}}" and "{{/posts}}" */
    item = sect + 10;
    item_len = (size_t)(end - item);
    buf = malloc(item_len + 1);
    if (buf == NULL) {
        perror("fill_index");
        return -1;
    }
    memcpy(buf, item, item_len);
    buf[item_len] = '\0';

    fwrite(temp, 1, sect - temp, out);              /* before the section */

    for (size_t i = 0; i < ps->count && result == 0; i++) {
        if (ps->entries[i].is_blog != blog)        /* 1 = blog, 0 = projects */
            continue;
        result = fill_item(out, buf, &ps->entries[i].fm,
                           ps->entries[i].rel_url);
    }

    if (result == 0)
        fputs(end + 10, out);                      /* after the section */

    free(buf);
    return result;
}
