CC      = cc
CFLAGS  = -std=c11 -D_POSIX_C_SOURCE=200809L -Wall -Wextra -g -fsanitize=address,undefined
SRC     = $(wildcard src/*.c)
OBJ     = $(SRC:src/%.c=build/%.o)

build/3sgc: $(OBJ)
	$(CC) $(CFLAGS) -o $@ $^

build/%.o: src/%.c | build
	$(CC) $(CFLAGS) -c $< -o $@

build:
	mkdir -p build

clean:
	rm -rf build

.PHONY: clean
