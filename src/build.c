#include "fs.h"
#include "frontmatter.h"
#include "template.h"
#include "post_store.h"

#include <dirent.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

int render_page(const char *temp_path, const char *md_path,
                const char *html_path)
{
    int result = -1;
    char *temp = NULL;
    FILE *md = NULL;
    FILE *html = NULL;
    FrontMatter fm;

    if ((temp = read_file(temp_path)) == NULL)
        goto cleanup;

    md = fopen(md_path, "rb");
    if (md == NULL) {
        perror("Error opening .md file");
        goto cleanup;
    }

    if (parse_fm(md, &fm) != 0) {
        fprintf(stderr, "Error parsing FM: %s.\n", md_path);
        goto cleanup;
    }

    html = fopen(html_path, "wb");
    if (html == NULL) {
        perror("Error opening .html file");
        goto cleanup;
    }

    if (fill_temp(html, temp, md, &fm) == -1) {
        fprintf(stderr, "Error filling in template.");
        goto cleanup;
    }

    result = 0;

cleanup:
    if (md != NULL)
        fclose(md);
    if (html != NULL) {
        if (fclose(html) != 0) {
            perror(html_path);
            result = -1;
        }
    }
    free(temp);
    return result;
}

/*
 * Parse one .md file's front matter and record it in the store.
 * 'root' is the CONTENT root (what build_content was called with),
 * never the current subdirectory — that's what rel_url and is_blog
 * are measured against.
 * NOTE: root must not have a trailing '/'.
 */
static int add_md_file(PostStore *ps, const char *root,
                       const char *src_path, const char *dst_path)
{
    PostEntry e;
    FILE *md;
    char tmp[PATH_MAX];
    const char *rel;

    memset(&e, 0, sizeof(e));

    md = fopen(src_path, "rb");
    if (md == NULL) {
        perror(src_path);
        return -1;
    }
    if (parse_fm(md, &e.fm) != 0) {
        fprintf(stderr, "FM parse failed: %s\n", src_path);
        fclose(md);
        return -1;
    }
    fclose(md);

    snprintf(e.md_path, sizeof(e.md_path), "%s", src_path);
    if (replace_ext(e.html_path, sizeof(e.html_path), dst_path, ".html") == -1)
        return -1;

    /* relative path = src_path below the CONTENT ROOT */
    rel = src_path + strlen(root);
    if (*rel == '/')
        rel++;

    /* copy before rewriting the extension: never feed a buffer to
       replace_ext while writing back into it */
    snprintf(tmp, sizeof(tmp), "%s", rel);
    if (replace_ext(e.rel_url, sizeof(e.rel_url), tmp, ".html") == -1)
        return -1;

    /* convention: files under content/blog/ are blog posts */
    e.is_blog = (strncmp(rel, "blog/", 5) == 0);

    return post_store_add(ps, &e);
}

/*
 * Recursive walk. 'root' stays fixed at the content root through the
 * whole recursion; src/dst are the CURRENT directories.
 */
static int collect_posts(const char *src, const char *dst,
                         PostStore *ps, const char *root)
{
    DIR *sd = NULL;
    struct dirent *entry;
    struct stat st;
    int result = -1;

    if (mkdir(dst, 0777) != 0 && errno != EEXIST) {
        perror(dst);
        return -1;
    }

    sd = opendir(src);
    if (sd == NULL) {
        perror(src);
        return -1;
    }

    while ((entry = readdir(sd)) != NULL) {
        char src_path[PATH_MAX];
        char dst_path[PATH_MAX];
        const char *dot;

        if (strcmp(entry->d_name, ".") == 0 ||
            strcmp(entry->d_name, "..") == 0)
            continue;

        if (join_path(src_path, sizeof(src_path), src, entry->d_name) == -1 ||
            join_path(dst_path, sizeof(dst_path), dst, entry->d_name) == -1)
            goto cleanup;

        if (lstat(src_path, &st) != 0) {
            perror(src_path);
            goto cleanup;
        }

        if (S_ISDIR(st.st_mode)) {
            if (collect_posts(src_path, dst_path, ps, root) != 0)
                goto cleanup;
        } else if (S_ISREG(st.st_mode)) {
            dot = strrchr(entry->d_name, '.');
            if (dot != NULL && strcmp(dot, ".md") == 0) {
                /* a bad file skips itself; the build keeps going */
                if (add_md_file(ps, root, src_path, dst_path) != 0)
                    fprintf(stderr, "Skipping %s\n", src_path);
            }
            /* other regular files: ignored here; static/ is copied later */
        } else {
            fprintf(stderr, "Skipping %s (not a regular file)\n", src_path);
        }
    }

    result = 0;

cleanup:
    closedir(sd);   /* non-NULL on every path reaching here */
    return result;
}

int build_content(const char *src, const char *dst, const char *temp,
                  PostStore *ps)
{
    if (collect_posts(src, dst, ps, src) != 0)   /* src IS the root */
        return -1;

    post_store_sort_by_date(ps);

    for (size_t i = 0; i < ps->count; i++) {
        if (render_page(temp, ps->entries[i].md_path,
                        ps->entries[i].html_path) != 0)
            return -1;
    }
    return 0;
}
