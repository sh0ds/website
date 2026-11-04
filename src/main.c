#include <limits.h>
#include <stdio.h>
#include <string.h>

#include "fs.h"
#include "build.h"
#include "index.h"
#include "post_store.h"

static void print_usage(const char *prog)
{
    fprintf(stderr,
            "Usage: %s <site-root> <mode>\n"
            "\n"
            "<mode>:\n"
            "  build    - posts + blog/project indexes\n"
            "  content  - posts only, no indexes\n"
            "  static   - copy static/ verbatim (root assets come from git)\n",
            prog);
}

int main(int argc, char *argv[])
{
    char c_path[PATH_MAX], s_path[PATH_MAX];
    char t_dir[PATH_MAX], basic[PATH_MAX];
    int do_posts = 0, do_indexes = 0, do_static = 0;

    if (argc != 3) {
        print_usage(argv[0]);
        return 1;
    }

    if (strcmp(argv[2], "build") == 0) {
        do_posts = do_indexes = 1;
    } else if (strcmp(argv[2], "content") == 0) {
        do_posts = 1;
    } else if (strcmp(argv[2], "static") == 0) {
        do_static = 1;
    } else {
        fprintf(stderr, "Unknown mode: %s\n", argv[2]);
        print_usage(argv[0]);
        return 1;
    }

    /*
     * Site root is BOTH the source and the output:
     *   <root>/content/     markdown sources
     *   <root>/templates/   template files
     *   <root>/static/      optional verbatim assets
     *   <root>/blog/, <root>/projects/   GENERATED output
     *
     * Generated dirs must never be committed; root files (index.html,
     * main.js, stylesheets/) are tracked in git and deployed by rsync.
     */
    if (snprintf(c_path, sizeof(c_path), "%s/content", argv[1]) >= (int)sizeof(c_path) ||
        snprintf(s_path, sizeof(s_path), "%s/static", argv[1]) >= (int)sizeof(s_path) ||
        snprintf(t_dir,  sizeof(t_dir),  "%s/templates", argv[1]) >= (int)sizeof(t_dir) ||
        snprintf(basic,  sizeof(basic),  "%s/basic.html", t_dir) >= (int)sizeof(basic)) {
        fprintf(stderr, "Path too long: %s\n", argv[1]);
        return 1;
    }

    if (do_posts) {
        PostStore posts;

        post_store_init(&posts);

        /* output goes straight into the site root */
        if (build_content(c_path, argv[1], basic, &posts) != 0) {
            fprintf(stderr, "Content build failed\n");
            post_store_free(&posts);
            return 1;
        }
        printf("Built %zu posts\n", posts.count);

        if (do_indexes && render_indexes(&posts, argv[1], t_dir) != 0) {
            fprintf(stderr, "Index rendering failed\n");
            post_store_free(&posts);
            return 1;
        }

        post_store_free(&posts);
    }

    if (do_static) {
        /* copies static/ into the root as-is (lands at /static/) */
        if (copy_dir(s_path, argv[1]) != 0) {
            fprintf(stderr, "Static copy failed\n");
            return 1;
        }
    }

    return 0;
}
