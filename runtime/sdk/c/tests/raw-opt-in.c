#define GRAALY_ENABLE_RAW_ABI 1
#include <graaly/graaly.h>

void raw_tooling(graaly_handle_t target) {
    graaly_value_t value = graaly_value_null();
    (void) graaly_get(target, "health", &value);
}
