#include "frontmatter.h"
#include "markdown.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>


static void set_kv_pair(FrontMatter *fm, const char *key, const char *value) {
  if (strcmp(key, "title") == 0) {
    snprintf(fm->title, sizeof(fm->title), "%s", value);
  } else if (strcmp(key, "author") == 0) {
    snprintf(fm->author, sizeof(fm->author), "%s", value);
  } else if (strcmp(key, "date") == 0) {
    snprintf(fm->date, sizeof(fm->date), "%s", value);
  } else if (strcmp(key, "summary") == 0) {
    snprintf(fm->summary, sizeof(fm->summary), "%s", value);
  } else {
    fprintf(stderr, "Unknown FM key: %s\n", key);
  }
}

int parse_fm(FILE *md, FrontMatter *fm) {
  char *ln = NULL;
  size_t cap = 0;
  int rs = -1;

  memset(fm, 0, sizeof(*fm));

  if (getline(&ln, &cap, md) == -1) {
    rs = ferror(md) ? -1 : 0;
    goto cleanup;
  }
  strip_nl(ln);
  if (strcmp(ln, "---") != 0) {
    fseek(md, 0, SEEK_SET);
    rs = 0;
    goto cleanup;
  }

  while (getline(&ln, &cap, md) != -1) {
    strip_nl(ln);
    if (strcmp(ln, "---") == 0) {
      rs = 0;
      goto cleanup;
    }

    char *colon = strchr(ln, ':');
    if (colon == NULL)
      continue;

    *colon = '\0';
    char *value = colon + 1;
    while (*value == ' ')
      value++;

    set_kv_pair(fm, ln, value);
  }

  fprintf(stderr, "FM is missing closing '---'\n");

cleanup:
  free(ln);
  return rs;
}
