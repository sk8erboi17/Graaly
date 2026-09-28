#include <graaly/graaly.h>

void should_not_compile(graaly_handle_t target) {
    graaly_get(target, "health", 0);
}
