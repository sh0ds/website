#include "index.h"
#include "fs.h"
#include "template.h"

#include <errno.h>
#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/stat.h>

static int render_one_index(const char *temp_path, const char *out_path,
                            const PostStore *ps, int blog)
{
    char *temp = NULL;
    FILE *out = NULL;
    int result = -1;

    if ((temp = read_file(temp_path)) == NULL) {
        fprintf(stderr, "Cannot read index template: %s\n", temp_path);
        goto cleanup;
    }

    if ((out = fopen(out_path, "wb")) == NULL) {
        perror(out_path);
        goto cleanup;
    }

    if (fill_index(out, temp, ps, blog) != 0) {
        fprintf(stderr, "Index failed: %s -> %s\n", temp_path, out_path);
        goto cleanup;
    }

    result = 0;

cleanup:
    if (out != NULL && fclose(out) != 0) {
        perror(out_path);
        result = -1;
    }
    free(temp);
    return result;
}

static int render_listing(const PostStore *ps, const char *dst,
                          const char *tpl_dir, const char *name, int blog)
{
    char tpl[PATH_MAX], out_path[PATH_MAX], out_dir[PATH_MAX];

    snprintf(out_dir, sizeof(out_dir), "%s/%s", dst, name);
    if (mkdir(out_dir, 0777) != 0 && errno != EEXIST) {
        perror(out_dir);
        return -1;
    }

    snprintf(tpl, sizeof(tpl), "%s/%s.html", tpl_dir, name);
    snprintf(out_path, sizeof(out_path), "%s/index.html", out_dir);
    return render_one_index(tpl, out_path, ps, blog);
}

int render_indexes(const PostStore *ps, const char *dst, const char *tpl_dir)
{
    if (render_listing(ps, dst, tpl_dir, "blog", 1) != 0)
        return -1;
    if (render_listing(ps, dst, tpl_dir, "projects", 0) != 0)
        return -1;
    return 0;
}
