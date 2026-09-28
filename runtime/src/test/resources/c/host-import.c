#include <stdint.h>

__attribute__((import_module("graaly"), import_name("add")))
extern int32_t host_add(int32_t a, int32_t b);

__attribute__((export_name("call_add")))
int32_t call_add(int32_t a, int32_t b) {
    return host_add(a, b);
}
