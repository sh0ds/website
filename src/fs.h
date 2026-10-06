#ifndef FS_H
#include <stddef.h>
#include <stdio.h>
#define FS_H

int copy_file(const char *src, const char *dst);
int copy_dir(const char *src, const char *dst);
int join_path(char *out, size_t out_size, const char *dir, const char *name);
char *read_file(const char *path);
int replace_ext(char *out, size_t out_size, const char *name,
                const char *new_ext);

#endif
