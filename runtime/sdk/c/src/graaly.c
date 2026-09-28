#include "graaly/graaly.h"

#include <limits.h>
#include <stdlib.h>
#include <string.h>

#if !defined(__wasm__)
#error "Graaly C plugins must be compiled to WebAssembly (wasm32-wasi)."
#endif

#define GRAALY_IMPORT(name) __attribute__((import_module("graaly"), import_name(name)))
#define GRAALY_EXPORT(name) __attribute__((export_name(name), visibility("default")))
#define GRAALY_WEAK __attribute__((weak))

#define GRAALY_MAX_EVENT_CALLBACKS 64
#define GRAALY_MAX_OBJECT_EVENT_CALLBACKS 512
#define GRAALY_MAX_TASK_CALLBACKS 512
#define GRAALY_MAX_GENERIC_CALLBACKS 1024
#define GRAALY_MAX_COMMANDS 64
#define GRAALY_MAX_COMMAND_NAME 64
#define GRAALY_DEBUG_MAX_ALLOCATIONS 256

enum {
    GRAALY_BRIDGE_TYPE = 1,
    GRAALY_BRIDGE_CONSTANT = 2,
    GRAALY_BRIDGE_ROOT = 3,
    GRAALY_BRIDGE_GET = 4,
    GRAALY_BRIDGE_SET = 5,
    GRAALY_BRIDGE_CALL = 6,
    GRAALY_BRIDGE_CONSTRUCT = 7,
    GRAALY_BRIDGE_STATIC_MEMBER = 8,
    GRAALY_BRIDGE_COLLECTION_SIZE = 9,
    GRAALY_BRIDGE_COLLECTION_GET = 10,
    GRAALY_BRIDGE_COLLECTION_SET = 11,
    GRAALY_BRIDGE_COLLECTION_ADD = 12,
    GRAALY_BRIDGE_COLLECTION_REMOVE_AT = 13,
    GRAALY_BRIDGE_COLLECTION_CONTAINS = 14,
    GRAALY_BRIDGE_COLLECTION_CLEAR = 15,
    GRAALY_BRIDGE_MAP_SIZE = 16,
    GRAALY_BRIDGE_MAP_GET = 17,
    GRAALY_BRIDGE_MAP_PUT = 18,
    GRAALY_BRIDGE_MAP_REMOVE = 19,
    GRAALY_BRIDGE_MAP_CONTAINS = 20,
    GRAALY_BRIDGE_MAP_CLEAR = 21,
    GRAALY_BRIDGE_OPTIONAL_VALUE = 22,
    GRAALY_BRIDGE_HANDLE_RELEASE = 23,
    GRAALY_BRIDGE_COMPAT_SUPPORTS = 24,
    GRAALY_BRIDGE_COMPAT_REQUIRE = 25,
    GRAALY_BRIDGE_TYPE_AVAILABLE = 26,
    GRAALY_BRIDGE_HANDLE_STRING = 27,
    GRAALY_BRIDGE_LAST_ERROR = 28,
    GRAALY_BRIDGE_MODULE_CALL = 29,
    GRAALY_BRIDGE_EVENT_LISTEN = 30,
    GRAALY_BRIDGE_TASK_SCHEDULE = 31,
    GRAALY_BRIDGE_TASK_CANCEL = 32,
    GRAALY_BRIDGE_IS_MAIN_THREAD = 33
};
#define GRAALY_DEBUG_REDZONE_BYTES 16u
#define GRAALY_DEBUG_BLOCK_MAGIC UINT32_C(0xC0DEC0DE)

GRAALY_IMPORT("log")
extern int32_t graaly_host_log(int32_t level, uint32_t pointer, uint32_t length);

GRAALY_IMPORT("sender_send_message")
extern int32_t graaly_host_sender_send_message(
        uint64_t sender,
        uint32_t pointer,
        uint32_t length);

GRAALY_IMPORT("sender_as_player")
extern uint64_t graaly_host_sender_as_player(uint64_t sender);

GRAALY_IMPORT("player_name")
extern int32_t graaly_host_player_name(
        uint64_t player,
        uint32_t pointer,
        uint32_t capacity);

GRAALY_IMPORT("player_uuid")
extern int32_t graaly_host_player_uuid(
        uint64_t player,
        uint32_t pointer,
        uint32_t capacity);

GRAALY_IMPORT("player_health")
extern double graaly_host_player_health(uint64_t player);

GRAALY_IMPORT("player_level")
extern int32_t graaly_host_player_level(uint64_t player);

GRAALY_IMPORT("listen")
extern int32_t graaly_host_listen(int32_t event_id, int32_t callback_id);

GRAALY_IMPORT("bridge")
extern int32_t graaly_host_bridge(
        int32_t operation,
        uint64_t a,
        uint64_t b,
        uint64_t c,
        uint64_t d,
        uint64_t e);

typedef struct graaly_event_entry {
    graaly_event_callback_t callback;
} graaly_event_entry_t;

typedef struct graaly_object_event_entry {
    graaly_object_event_callback_t callback;
} graaly_object_event_entry_t;

typedef struct graaly_task_entry {
    graaly_task_callback_t callback;
} graaly_task_entry_t;

typedef struct graaly_generic_callback_entry {
    graaly_callback_t callback;
} graaly_generic_callback_entry_t;

typedef struct graaly_command_entry {
    char name[GRAALY_MAX_COMMAND_NAME];
    graaly_command_callback_t callback;
    graaly_tab_complete_callback_t completer;
} graaly_command_entry_t;

typedef union graaly_debug_header {
    struct {
        uint32_t magic;
        uint32_t state;
        uint32_t reserved_a;
        uint32_t reserved_b;
    } fields;
    max_align_t alignment;
} graaly_debug_header_t;

typedef struct graaly_debug_record {
    graaly_debug_header_t *base;
    unsigned char *payload;
    size_t requested;
    bool in_use;
    bool freed;
} graaly_debug_record_t;

static graaly_event_entry_t event_callbacks[GRAALY_MAX_EVENT_CALLBACKS];
static graaly_object_event_entry_t object_event_callbacks[GRAALY_MAX_OBJECT_EVENT_CALLBACKS];
static graaly_task_entry_t task_callbacks[GRAALY_MAX_TASK_CALLBACKS];
static graaly_generic_callback_entry_t generic_callbacks[GRAALY_MAX_GENERIC_CALLBACKS];
static graaly_command_entry_t command_callbacks[GRAALY_MAX_COMMANDS];
static graaly_debug_record_t debug_allocations[GRAALY_DEBUG_MAX_ALLOCATIONS];
static int command_count;

GRAALY_WEAK void graaly_on_load(void) {
}

GRAALY_WEAK void graaly_on_enable(void) {
}

GRAALY_WEAK void graaly_on_disable(void) {
}

static uint32_t wasm_pointer(const void *pointer) {
    uintptr_t value = (uintptr_t) pointer;
    if (value > UINT32_MAX) {
        abort();
    }
    return (uint32_t) value;
}

static uint32_t wasm_length(size_t length) {
    if (length > UINT32_MAX) {
        abort();
    }
    return (uint32_t) length;
}

static uint64_t pack_u32_pair(uint32_t low, uint32_t high) {
    return ((uint64_t) high << 32u) | (uint64_t) low;
}

graaly_value_t graaly_value_null(void) {
    graaly_value_t value = {0};
    value.kind = GRAALY_VALUE_NULL;
    return value;
}

graaly_value_t graaly_value_bool(bool selected) {
    graaly_value_t value = {0};
    value.kind = GRAALY_VALUE_BOOL;
    value.a = selected ? 1u : 0u;
    return value;
}

graaly_value_t graaly_value_i64(int64_t selected) {
    graaly_value_t value = {0};
    value.kind = GRAALY_VALUE_I64;
    value.a = (uint64_t) selected;
    return value;
}

graaly_value_t graaly_value_f64(double selected) {
    graaly_value_t value = {0};
    value.kind = GRAALY_VALUE_F64;
    uint64_t bits = 0u;
    memcpy(&bits, &selected, sizeof bits);
    value.a = bits;
    return value;
}

graaly_value_t graaly_value_string_n(const char *selected, size_t length) {
    graaly_value_t value = {0};
    value.kind = GRAALY_VALUE_STRING;
    value.a = (uint64_t) wasm_pointer(selected);
    value.b = (uint64_t) wasm_length(length);
    return value;
}

graaly_value_t graaly_value_string(const char *selected) {
    return selected == NULL
            ? graaly_value_null()
            : graaly_value_string_n(selected, strlen(selected));
}

graaly_value_t graaly_value_handle(graaly_handle_t selected) {
    graaly_value_t value = {0};
    value.kind = GRAALY_VALUE_HANDLE;
    value.a = selected;
    return value;
}

static int bridge_string_result(
        int32_t operation,
        uint64_t a,
        const char *name,
        graaly_value_t *result) {
    if (name == NULL || result == NULL) {
        return -1;
    }
    return graaly_host_bridge(
            operation,
            a,
            (uint64_t) wasm_pointer(name),
            (uint64_t) wasm_length(strlen(name)),
            (uint64_t) wasm_pointer(result),
            0u);
}

int graaly_type(const char *exported_name, graaly_value_t *result) {
    if (exported_name == NULL || result == NULL) {
        return -1;
    }
    return graaly_host_bridge(
            GRAALY_BRIDGE_TYPE,
            (uint64_t) wasm_pointer(exported_name),
            (uint64_t) wasm_length(strlen(exported_name)),
            (uint64_t) wasm_pointer(result),
            0u,
            0u);
}

int graaly_constant(
        const char *namespace_name,
        const char *constant_name,
        graaly_value_t *result) {
    if (namespace_name == NULL || constant_name == NULL || result == NULL) {
        return -1;
    }
    return graaly_host_bridge(
            GRAALY_BRIDGE_CONSTANT,
            (uint64_t) wasm_pointer(namespace_name),
            (uint64_t) wasm_length(strlen(namespace_name)),
            (uint64_t) wasm_pointer(constant_name),
            (uint64_t) wasm_length(strlen(constant_name)),
            (uint64_t) wasm_pointer(result));
}

int graaly_root_value(graaly_root_t root, graaly_value_t *result) {
    if (result == NULL) {
        return -1;
    }
    return graaly_host_bridge(
            GRAALY_BRIDGE_ROOT,
            (uint64_t) root,
            (uint64_t) wasm_pointer(result),
            0u,
            0u,
            0u);
}

int graaly_get(graaly_handle_t target, const char *member, graaly_value_t *result) {
    return bridge_string_result(GRAALY_BRIDGE_GET, target, member, result);
}

int graaly_set(graaly_handle_t target, const char *member, graaly_value_t value) {
    if (member == NULL) {
        return -1;
    }
    return graaly_host_bridge(
            GRAALY_BRIDGE_SET,
            target,
            (uint64_t) wasm_pointer(member),
            (uint64_t) wasm_length(strlen(member)),
            (uint64_t) wasm_pointer(&value),
            0u);
}

int graaly_call(
        graaly_handle_t target,
        const char *member,
        const graaly_value_t *arguments,
        size_t argument_count,
        graaly_value_t *result) {
    if (member == NULL || result == NULL || argument_count > UINT32_MAX) {
        return -1;
    }
    uint32_t argv = arguments == NULL ? 0u : wasm_pointer(arguments);
    return graaly_host_bridge(
            GRAALY_BRIDGE_CALL,
            target,
            (uint64_t) wasm_pointer(member),
            (uint64_t) wasm_length(strlen(member)),
            (uint64_t) argv,
            pack_u32_pair(wasm_pointer(result), (uint32_t) argument_count));
}

int graaly_construct(
        graaly_handle_t type,
        const graaly_value_t *arguments,
        size_t argument_count,
        graaly_value_t *result) {
    if (result == NULL || argument_count > UINT32_MAX) {
        return -1;
    }
    return graaly_host_bridge(
            GRAALY_BRIDGE_CONSTRUCT,
            type,
            arguments == NULL ? 0u : (uint64_t) wasm_pointer(arguments),
            (uint64_t) argument_count,
            (uint64_t) wasm_pointer(result),
            0u);
}

int graaly_static_member(
        graaly_handle_t type,
        const char *member,
        graaly_value_t *result) {
    return bridge_string_result(GRAALY_BRIDGE_STATIC_MEMBER, type, member, result);
}

int graaly_collection_size(graaly_handle_t collection, size_t *size) {
    if (size == NULL) return -1;
    int result = graaly_host_bridge(GRAALY_BRIDGE_COLLECTION_SIZE, collection, 0u, 0u, 0u, 0u);
    if (result < 0) return result;
    *size = (size_t) (uint32_t) result;
    return 0;
}

int graaly_collection_get(graaly_handle_t collection, size_t index, graaly_value_t *result) {
    if (result == NULL || index > UINT32_MAX) return -1;
    return graaly_host_bridge(
            GRAALY_BRIDGE_COLLECTION_GET,
            collection,
            (uint64_t) index,
            (uint64_t) wasm_pointer(result),
            0u,
            0u);
}

int graaly_collection_set(graaly_handle_t collection, size_t index, graaly_value_t value) {
    if (index > UINT32_MAX) return -1;
    return graaly_host_bridge(
            GRAALY_BRIDGE_COLLECTION_SET,
            collection,
            (uint64_t) index,
            (uint64_t) wasm_pointer(&value),
            0u,
            0u);
}

int graaly_collection_add(graaly_handle_t collection, graaly_value_t value) {
    return graaly_host_bridge(
            GRAALY_BRIDGE_COLLECTION_ADD,
            collection,
            (uint64_t) wasm_pointer(&value),
            0u,
            0u,
            0u);
}

int graaly_collection_remove_at(
        graaly_handle_t collection,
        size_t index,
        graaly_value_t *result) {
    if (result == NULL || index > UINT32_MAX) return -1;
    return graaly_host_bridge(
            GRAALY_BRIDGE_COLLECTION_REMOVE_AT,
            collection,
            (uint64_t) index,
            (uint64_t) wasm_pointer(result),
            0u,
            0u);
}

int graaly_collection_contains(
        graaly_handle_t collection,
        graaly_value_t value,
        bool *contains) {
    if (contains == NULL) return -1;
    int result = graaly_host_bridge(
            GRAALY_BRIDGE_COLLECTION_CONTAINS,
            collection,
            (uint64_t) wasm_pointer(&value),
            0u,
            0u,
            0u);
    if (result < 0) return result;
    *contains = result != 0;
    return 0;
}

int graaly_collection_clear(graaly_handle_t collection) {
    return graaly_host_bridge(GRAALY_BRIDGE_COLLECTION_CLEAR, collection, 0u, 0u, 0u, 0u);
}

int graaly_map_size(graaly_handle_t map, size_t *size) {
    if (size == NULL) return -1;
    int result = graaly_host_bridge(GRAALY_BRIDGE_MAP_SIZE, map, 0u, 0u, 0u, 0u);
    if (result < 0) return result;
    *size = (size_t) (uint32_t) result;
    return 0;
}

int graaly_map_get(graaly_handle_t map, graaly_value_t key, graaly_value_t *result) {
    if (result == NULL) return -1;
    return graaly_host_bridge(
            GRAALY_BRIDGE_MAP_GET,
            map,
            (uint64_t) wasm_pointer(&key),
            (uint64_t) wasm_pointer(result),
            0u,
            0u);
}

int graaly_map_put(
        graaly_handle_t map,
        graaly_value_t key,
        graaly_value_t value,
        graaly_value_t *previous) {
    if (previous == NULL) return -1;
    return graaly_host_bridge(
            GRAALY_BRIDGE_MAP_PUT,
            map,
            (uint64_t) wasm_pointer(&key),
            (uint64_t) wasm_pointer(&value),
            (uint64_t) wasm_pointer(previous),
            0u);
}

int graaly_map_remove(
        graaly_handle_t map,
        graaly_value_t key,
        graaly_value_t *previous) {
    if (previous == NULL) return -1;
    return graaly_host_bridge(
            GRAALY_BRIDGE_MAP_REMOVE,
            map,
            (uint64_t) wasm_pointer(&key),
            (uint64_t) wasm_pointer(previous),
            0u,
            0u);
}

int graaly_map_contains(graaly_handle_t map, graaly_value_t key, bool *contains) {
    if (contains == NULL) return -1;
    int result = graaly_host_bridge(
            GRAALY_BRIDGE_MAP_CONTAINS,
            map,
            (uint64_t) wasm_pointer(&key),
            0u,
            0u,
            0u);
    if (result < 0) return result;
    *contains = result != 0;
    return 0;
}

int graaly_map_clear(graaly_handle_t map) {
    return graaly_host_bridge(GRAALY_BRIDGE_MAP_CLEAR, map, 0u, 0u, 0u, 0u);
}

int graaly_optional_value(graaly_handle_t optional, graaly_value_t *result) {
    if (result == NULL) return -1;
    return graaly_host_bridge(
            GRAALY_BRIDGE_OPTIONAL_VALUE,
            optional,
            (uint64_t) wasm_pointer(result),
            0u,
            0u,
            0u);
}

typedef struct graaly_module_request {
    uint32_t arguments;
    uint32_t argument_count;
    uint32_t result;
    uint32_t reserved;
} graaly_module_request_t;

int graaly_module_call(
        const char *module,
        const char *operation,
        const graaly_value_t *arguments,
        size_t argument_count,
        graaly_value_t *result) {
    if (module == NULL || operation == NULL || result == NULL || argument_count > UINT32_MAX) {
        return -1;
    }
    graaly_module_request_t request = {
            .arguments = arguments == NULL ? 0u : wasm_pointer(arguments),
            .argument_count = (uint32_t) argument_count,
            .result = wasm_pointer(result),
            .reserved = 0u
    };
    return graaly_host_bridge(
            GRAALY_BRIDGE_MODULE_CALL,
            (uint64_t) wasm_pointer(module),
            (uint64_t) wasm_length(strlen(module)),
            (uint64_t) wasm_pointer(operation),
            (uint64_t) wasm_length(strlen(operation)),
            (uint64_t) wasm_pointer(&request));
}

static int module_call_simple(
        const char *module,
        const char *operation,
        graaly_value_t *result);

int graaly_compat_contract_version(graaly_value_t *result) {
    return module_call_simple("compatibility", "contractVersion", result);
}

int graaly_compat_minimum_game_version(graaly_value_t *result) {
    return module_call_simple("compatibility", "minimumGameVersion", result);
}

int graaly_compat_minecraft_version(graaly_value_t *result) {
    return module_call_simple("compatibility", "minecraftVersion", result);
}

int graaly_compat_server_version(graaly_value_t *result) {
    return module_call_simple("compatibility", "serverVersion", result);
}

int graaly_compat_supports(const char *feature, bool *supported) {
    if (feature == NULL || supported == NULL) return -1;
    int result = graaly_host_bridge(
            GRAALY_BRIDGE_COMPAT_SUPPORTS,
            (uint64_t) wasm_pointer(feature),
            (uint64_t) wasm_length(strlen(feature)),
            0u,
            0u,
            0u);
    if (result < 0) return result;
    *supported = result != 0;
    return 0;
}

int graaly_compat_require(const char *feature) {
    if (feature == NULL) return -1;
    return graaly_host_bridge(
            GRAALY_BRIDGE_COMPAT_REQUIRE,
            (uint64_t) wasm_pointer(feature),
            (uint64_t) wasm_length(strlen(feature)),
            0u,
            0u,
            0u);
}

int graaly_type_available(const char *exported_name, bool *available) {
    if (exported_name == NULL || available == NULL) return -1;
    int result = graaly_host_bridge(
            GRAALY_BRIDGE_TYPE_AVAILABLE,
            (uint64_t) wasm_pointer(exported_name),
            (uint64_t) wasm_length(strlen(exported_name)),
            0u,
            0u,
            0u);
    if (result < 0) return result;
    *available = result != 0;
    return 0;
}

int graaly_compat_material(const char *canonical_name, graaly_value_t *result) {
    if (canonical_name == NULL || result == NULL) return -1;
    graaly_value_t arg = graaly_value_string(canonical_name);
    return graaly_module_call("compatibility", "material", &arg, 1u, result);
}

size_t graaly_handle_string(graaly_handle_t handle, char *destination, size_t capacity) {
    int result = graaly_host_bridge(
            GRAALY_BRIDGE_HANDLE_STRING,
            handle,
            destination == NULL ? 0u : (uint64_t) wasm_pointer(destination),
            (uint64_t) wasm_length(capacity),
            0u,
            0u);
    return result < 0 ? 0u : (size_t) (uint32_t) result;
}

void graaly_handle_release(graaly_handle_t handle) {
    (void) graaly_host_bridge(GRAALY_BRIDGE_HANDLE_RELEASE, handle, 0u, 0u, 0u, 0u);
}

size_t graaly_last_error(char *destination, size_t capacity) {
    int result = graaly_host_bridge(
            GRAALY_BRIDGE_LAST_ERROR,
            destination == NULL ? 0u : (uint64_t) wasm_pointer(destination),
            (uint64_t) wasm_length(capacity),
            0u,
            0u,
            0u);
    return result < 0 ? 0u : (size_t) (uint32_t) result;
}

void graaly_log_n(graaly_log_level_t level, const char *message, size_t length) {
    if (message == NULL && length != 0) {
        return;
    }
    (void) graaly_host_log(
            (int32_t) level,
            wasm_pointer(message),
            wasm_length(length));
}

void graaly_log(graaly_log_level_t level, const char *message) {
    if (message == NULL) {
        return;
    }
    graaly_log_n(level, message, strlen(message));
}

void graaly_sender_send_message_n(
        graaly_sender_handle_t sender,
        const char *message,
        size_t length) {
    if (message == NULL && length != 0) {
        return;
    }
    (void) graaly_host_sender_send_message(
            sender,
            wasm_pointer(message),
            wasm_length(length));
}

void graaly_sender_send_message(
        graaly_sender_handle_t sender,
        const char *message) {
    if (message == NULL) {
        return;
    }
    graaly_sender_send_message_n(sender, message, strlen(message));
}

graaly_player_handle_t graaly_sender_as_player(graaly_sender_handle_t sender) {
    return graaly_host_sender_as_player(sender);
}

size_t graaly_player_read_name(
        graaly_player_handle_t player,
        char *destination,
        size_t capacity) {
    if (destination == NULL && capacity != 0) {
        return 0;
    }
    int32_t required = graaly_host_player_name(
            player,
            wasm_pointer(destination),
            wasm_length(capacity));
    return required < 0 ? 0u : (size_t) (uint32_t) required;
}

size_t graaly_player_read_uuid(
        graaly_player_handle_t player,
        char *destination,
        size_t capacity) {
    if (destination == NULL && capacity != 0) {
        return 0;
    }
    int32_t required = graaly_host_player_uuid(
            player,
            wasm_pointer(destination),
            wasm_length(capacity));
    return required < 0 ? 0u : (size_t) (uint32_t) required;
}

double graaly_player_health(graaly_player_handle_t player) {
    return graaly_host_player_health(player);
}

int graaly_player_level(graaly_player_handle_t player) {
    return (int) graaly_host_player_level(player);
}

int graaly_callback_register(graaly_callback_t callback) {
    if (callback == NULL) return -1;
    for (int index = 0; index < GRAALY_MAX_GENERIC_CALLBACKS; index++) {
        if (generic_callbacks[index].callback == NULL) {
            generic_callbacks[index].callback = callback;
            return index + 1;
        }
    }
    return -1;
}

int graaly_events_on(graaly_event_id_t event, graaly_event_callback_t callback) {
    if (callback == NULL) {
        return -1;
    }
    for (int index = 0; index < GRAALY_MAX_EVENT_CALLBACKS; index++) {
        if (event_callbacks[index].callback == NULL) {
            event_callbacks[index].callback = callback;
            int callback_id = index + 1;
            if (graaly_host_listen((int32_t) event, callback_id) != 0) {
                event_callbacks[index].callback = NULL;
                return -1;
            }
            return callback_id;
        }
    }
    return -1;
}

typedef struct graaly_event_listen_request {
    uint32_t ignore_cancelled;
    uint32_t callback_id;
} graaly_event_listen_request_t;

int graaly_events_on_type(
        const char *exported_event_type,
        const char *priority,
        bool ignore_cancelled,
        graaly_object_event_callback_t callback) {
    if (exported_event_type == NULL || callback == NULL) {
        return -1;
    }

    int callback_id = -1;
    for (int index = 0; index < GRAALY_MAX_OBJECT_EVENT_CALLBACKS; index++) {
        if (object_event_callbacks[index].callback == NULL) {
            object_event_callbacks[index].callback = callback;
            callback_id = index + 1;
            break;
        }
    }
    if (callback_id < 0) {
        return -1;
    }

    const char *selected_priority =
            priority == NULL || *priority == '\0' ? "NORMAL" : priority;
    graaly_event_listen_request_t request = {
            .ignore_cancelled = ignore_cancelled ? 1u : 0u,
            .callback_id = (uint32_t) callback_id
    };
    int result = graaly_host_bridge(
            GRAALY_BRIDGE_EVENT_LISTEN,
            (uint64_t) wasm_pointer(exported_event_type),
            (uint64_t) wasm_length(strlen(exported_event_type)),
            (uint64_t) wasm_pointer(selected_priority),
            (uint64_t) wasm_length(strlen(selected_priority)),
            (uint64_t) wasm_pointer(&request));
    if (result != 0) {
        object_event_callbacks[callback_id - 1].callback = NULL;
        return result;
    }
    return callback_id;
}

static int register_task_callback(graaly_task_callback_t callback) {
    if (callback == NULL) return -1;
    for (int index = 0; index < GRAALY_MAX_TASK_CALLBACKS; index++) {
        if (task_callbacks[index].callback == NULL) {
            task_callbacks[index].callback = callback;
            return index + 1;
        }
    }
    return -1;
}

static int schedule_task(
        int kind,
        uint64_t delay_ticks,
        uint64_t period_ticks,
        graaly_task_callback_t callback) {
    int callback_id = register_task_callback(callback);
    if (callback_id < 0) return -1;
    int result = graaly_host_bridge(
            GRAALY_BRIDGE_TASK_SCHEDULE,
            (uint64_t) (uint32_t) kind,
            delay_ticks,
            period_ticks,
            (uint64_t) (uint32_t) callback_id,
            0u);
    if (result < 0) {
        task_callbacks[callback_id - 1].callback = NULL;
    }
    return result;
}

int graaly_tasks_run(graaly_task_callback_t callback) {
    return schedule_task(0, 0u, 0u, callback);
}

int graaly_tasks_later(uint64_t delay_ticks, graaly_task_callback_t callback) {
    return schedule_task(1, delay_ticks, 0u, callback);
}

int graaly_tasks_repeat(
        uint64_t delay_ticks,
        uint64_t period_ticks,
        graaly_task_callback_t callback) {
    return schedule_task(2, delay_ticks, period_ticks, callback);
}

int graaly_tasks_run_async(graaly_task_callback_t callback) {
    return schedule_task(3, 0u, 0u, callback);
}

int graaly_tasks_later_async(uint64_t delay_ticks, graaly_task_callback_t callback) {
    return schedule_task(4, delay_ticks, 0u, callback);
}

int graaly_tasks_repeat_async(
        uint64_t delay_ticks,
        uint64_t period_ticks,
        graaly_task_callback_t callback) {
    return schedule_task(5, delay_ticks, period_ticks, callback);
}

void graaly_tasks_cancel(int task_id) {
    (void) graaly_host_bridge(
            GRAALY_BRIDGE_TASK_CANCEL,
            (uint64_t) (uint32_t) task_id,
            0u,
            0u,
            0u,
            0u);
}

uint64_t graaly_ticks(double seconds) {
    if (!(seconds > 0.0)) return 0u;
    double ticks = seconds * 20.0;
    if (ticks >= (double) UINT64_MAX) return UINT64_MAX;
    return (uint64_t) (ticks + 0.5);
}

bool graaly_tasks_is_main_thread(void) {
    return graaly_host_bridge(
            GRAALY_BRIDGE_IS_MAIN_THREAD,
            0u,
            0u,
            0u,
            0u,
            0u) > 0;
}

static bool value_as_bool(graaly_value_t value) {
    return value.kind == GRAALY_VALUE_BOOL && value.a != 0u;
}

static int module_call_simple(
        const char *module,
        const char *operation,
        graaly_value_t *result) {
    return graaly_module_call(module, operation, NULL, 0u, result);
}

int graaly_config_get(const char *path, graaly_value_t fallback, graaly_value_t *result) {
    graaly_value_t args[2] = {graaly_value_string(path), fallback};
    return graaly_module_call("config", "get", args, 2u, result);
}

int graaly_config_set(const char *path, graaly_value_t value) {
    graaly_value_t args[2] = {graaly_value_string(path), value};
    graaly_value_t result;
    return graaly_module_call("config", "set", args, 2u, &result);
}

int graaly_config_contains(const char *path, bool *contains) {
    if (contains == NULL) return -1;
    graaly_value_t args[1] = {graaly_value_string(path)};
    graaly_value_t result;
    int status = graaly_module_call("config", "contains", args, 1u, &result);
    if (status == 0) *contains = value_as_bool(result);
    return status;
}

int graaly_config_save(void) {
    graaly_value_t result;
    return module_call_simple("config", "save", &result);
}

int graaly_config_reload(void) {
    graaly_value_t result;
    return module_call_simple("config", "reload", &result);
}

int graaly_players_online(graaly_value_t *result) {
    return module_call_simple("players", "online", result);
}

int graaly_players_get(const char *name, graaly_value_t *result) {
    graaly_value_t args[1] = {graaly_value_string(name)};
    return graaly_module_call("players", "get", args, 1u, result);
}

int graaly_players_exact(const char *name, graaly_value_t *result) {
    graaly_value_t args[1] = {graaly_value_string(name)};
    return graaly_module_call("players", "exact", args, 1u, result);
}

int graaly_players_is_player(graaly_value_t value, bool *is_player) {
    if (is_player == NULL) return -1;
    graaly_value_t result;
    int status = graaly_module_call("players", "isPlayer", &value, 1u, &result);
    if (status == 0) *is_player = value_as_bool(result);
    return status;
}

int graaly_players_broadcast(const char *message) {
    graaly_value_t arg = graaly_value_string(message);
    graaly_value_t result;
    return graaly_module_call("players", "broadcast", &arg, 1u, &result);
}

int graaly_worlds_all(graaly_value_t *result) {
    return module_call_simple("worlds", "all", result);
}

int graaly_worlds_get(const char *name, graaly_value_t *result) {
    graaly_value_t arg = graaly_value_string(name);
    return graaly_module_call("worlds", "get", &arg, 1u, result);
}

int graaly_worlds_location(
        graaly_handle_t world,
        double x, double y, double z,
        double yaw, double pitch,
        graaly_value_t *result) {
    graaly_value_t args[6] = {
            graaly_value_handle(world),
            graaly_value_f64(x),
            graaly_value_f64(y),
            graaly_value_f64(z),
            graaly_value_f64(yaw),
            graaly_value_f64(pitch)
    };
    return graaly_module_call("worlds", "location", args, 6u, result);
}

int graaly_worlds_create(
        const char *name,
        const graaly_value_t *option_pairs,
        size_t pair_count,
        graaly_value_t *result) {
    if (pair_count > (SIZE_MAX - 1u) / 2u) return -1;
    size_t count = 1u + pair_count * 2u;
    graaly_value_t *args = (graaly_value_t *) malloc(count * sizeof *args);
    if (args == NULL) return -1;
    args[0] = graaly_value_string(name);
    for (size_t index = 0; index < pair_count * 2u; index++) {
        args[index + 1u] = option_pairs[index];
    }
    int status = graaly_module_call("worlds", "create", args, count, result);
    free(args);
    return status;
}

int graaly_worlds_generator(
        graaly_callback_t generate,
        graaly_callback_t can_spawn,
        graaly_callback_t default_populators,
        graaly_callback_t fixed_spawn,
        graaly_value_t *result) {
    int generate_id = graaly_callback_register(generate);
    if (generate_id < 0) return -1;
    int can_spawn_id = can_spawn == NULL ? 0 : graaly_callback_register(can_spawn);
    int populators_id = default_populators == NULL ? 0 : graaly_callback_register(default_populators);
    int fixed_spawn_id = fixed_spawn == NULL ? 0 : graaly_callback_register(fixed_spawn);
    if ((can_spawn != NULL && can_spawn_id < 0)
            || (default_populators != NULL && populators_id < 0)
            || (fixed_spawn != NULL && fixed_spawn_id < 0)) {
        return -1;
    }
    graaly_value_t args[4] = {
            graaly_value_i64(generate_id),
            graaly_value_i64(can_spawn_id),
            graaly_value_i64(populators_id),
            graaly_value_i64(fixed_spawn_id)
    };
    return graaly_module_call("worlds", "generator", args, 4u, result);
}

int graaly_worlds_populator(graaly_callback_t callback, graaly_value_t *result) {
    int callback_id = graaly_callback_register(callback);
    if (callback_id < 0) return -1;
    graaly_value_t arg = graaly_value_i64(callback_id);
    return graaly_module_call("worlds", "populator", &arg, 1u, result);
}

int graaly_worlds_unload(graaly_value_t world_or_name, bool save, bool *unloaded) {
    if (unloaded == NULL) return -1;
    graaly_value_t args[2] = {world_or_name, graaly_value_bool(save)};
    graaly_value_t result;
    int status = graaly_module_call("worlds", "unload", args, 2u, &result);
    if (status == 0) *unloaded = value_as_bool(result);
    return status;
}

int graaly_entities_type(const char *name, graaly_value_t *result) {
    graaly_value_t arg = graaly_value_string(name);
    return graaly_module_call("entities", "type", &arg, 1u, result);
}

int graaly_entities_attribute_type(const char *name, graaly_value_t *result) {
    graaly_value_t arg = graaly_value_string(name);
    return graaly_module_call("entities", "attributeType", &arg, 1u, result);
}

int graaly_entities_spawn(
        graaly_handle_t location,
        graaly_handle_t entity_type,
        graaly_value_t *result) {
    graaly_value_t args[2] = {
            graaly_value_handle(location),
            graaly_value_handle(entity_type)
    };
    return graaly_module_call("entities", "spawn", args, 2u, result);
}

int graaly_entities_configure(
        graaly_handle_t entity,
        const graaly_value_t *option_pairs,
        size_t pair_count,
        graaly_value_t *result) {
    if (pair_count > (SIZE_MAX - 1u) / 2u) return -1;
    size_t count = 1u + pair_count * 2u;
    graaly_value_t *args = (graaly_value_t *) malloc(count * sizeof *args);
    if (args == NULL) return -1;
    args[0] = graaly_value_handle(entity);
    for (size_t index = 0; index < pair_count * 2u; index++) {
        args[index + 1u] = option_pairs[index];
    }
    int status = graaly_module_call("entities", "configure", args, count, result);
    free(args);
    return status;
}

int graaly_entities_attribute(
        graaly_handle_t entity,
        graaly_value_t name_or_attribute,
        const graaly_value_t *base_value,
        graaly_value_t *result) {
    graaly_value_t args[3] = {
            graaly_value_handle(entity),
            name_or_attribute,
            base_value == NULL ? graaly_value_null() : *base_value
    };
    return graaly_module_call(
            "entities", "attribute", args, base_value == NULL ? 2u : 3u, result);
}

int graaly_entities_remove(graaly_handle_t entity) {
    graaly_value_t arg = graaly_value_handle(entity);
    graaly_value_t result;
    return graaly_module_call("entities", "remove", &arg, 1u, &result);
}

static int register_required_callback(graaly_callback_t callback) {
    if (callback == NULL) return -1;
    return graaly_callback_register(callback);
}

int graaly_http_request(
        const char *method,
        const char *url,
        const char *headers_json,
        const char *body,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id) {
    int callback_id = register_required_callback(callback);
    if (callback_id < 0) return -1;
    graaly_value_t args[6] = {
            graaly_value_string(method),
            graaly_value_string(url),
            graaly_value_string(headers_json == NULL ? "{}" : headers_json),
            body == NULL ? graaly_value_null() : graaly_value_string(body),
            graaly_value_i64((int64_t) timeout_ms),
            graaly_value_i64(callback_id)
    };
    return graaly_module_call("http", "request", args, 6u, request_id);
}

int graaly_http_get(
        const char *url,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id) {
    int callback_id = register_required_callback(callback);
    if (callback_id < 0) return -1;
    graaly_value_t args[4] = {
            graaly_value_string(url),
            graaly_value_string(headers_json == NULL ? "{}" : headers_json),
            graaly_value_i64((int64_t) timeout_ms),
            graaly_value_i64(callback_id)
    };
    return graaly_module_call("http", "get", args, 4u, request_id);
}

static int http_body_call(
        const char *operation,
        const char *url,
        const char *body,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id) {
    int callback_id = register_required_callback(callback);
    if (callback_id < 0) return -1;
    graaly_value_t args[5] = {
            graaly_value_string(url),
            graaly_value_string(body == NULL ? "" : body),
            graaly_value_string(headers_json == NULL ? "{}" : headers_json),
            graaly_value_i64((int64_t) timeout_ms),
            graaly_value_i64(callback_id)
    };
    return graaly_module_call("http", operation, args, 5u, request_id);
}

int graaly_http_post(
        const char *url,
        const char *body,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id) {
    return http_body_call("post", url, body, headers_json, timeout_ms, callback, request_id);
}

int graaly_http_put(
        const char *url,
        const char *body,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id) {
    return http_body_call("put", url, body, headers_json, timeout_ms, callback, request_id);
}

int graaly_http_delete(
        const char *url,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id) {
    int callback_id = register_required_callback(callback);
    if (callback_id < 0) return -1;
    graaly_value_t args[4] = {
            graaly_value_string(url),
            graaly_value_string(headers_json == NULL ? "{}" : headers_json),
            graaly_value_i64((int64_t) timeout_ms),
            graaly_value_i64(callback_id)
    };
    return graaly_module_call("http", "delete", args, 4u, request_id);
}

int graaly_http_cancel(const char *request_id, bool *cancelled) {
    if (cancelled == NULL) return -1;
    graaly_value_t arg = graaly_value_string(request_id);
    graaly_value_t result;
    int status = graaly_module_call("http", "cancel", &arg, 1u, &result);
    if (status == 0) *cancelled = value_as_bool(result);
    return status;
}

int graaly_websocket_connect(
        const char *url,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t event_callback,
        graaly_value_t *connection_id) {
    int callback_id = register_required_callback(event_callback);
    if (callback_id < 0) return -1;
    graaly_value_t args[4] = {
            graaly_value_string(url),
            graaly_value_string(headers_json == NULL ? "{}" : headers_json),
            graaly_value_i64((int64_t) timeout_ms),
            graaly_value_i64(callback_id)
    };
    return graaly_module_call("websocket", "connect", args, 4u, connection_id);
}

int graaly_websocket_send(
        const char *connection_id,
        const char *text,
        graaly_callback_t completion_callback) {
    int callback_id = register_required_callback(completion_callback);
    if (callback_id < 0) return -1;
    graaly_value_t args[3] = {
            graaly_value_string(connection_id),
            graaly_value_string(text),
            graaly_value_i64(callback_id)
    };
    graaly_value_t result;
    return graaly_module_call("websocket", "send", args, 3u, &result);
}

int graaly_websocket_close(
        const char *connection_id,
        int code,
        const char *reason,
        graaly_callback_t completion_callback) {
    int callback_id = register_required_callback(completion_callback);
    if (callback_id < 0) return -1;
    graaly_value_t args[4] = {
            graaly_value_string(connection_id),
            graaly_value_i64(code),
            graaly_value_string(reason == NULL ? "" : reason),
            graaly_value_i64(callback_id)
    };
    graaly_value_t result;
    return graaly_module_call("websocket", "close", args, 4u, &result);
}

int graaly_websocket_state(const char *connection_id, graaly_value_t *state) {
    graaly_value_t arg = graaly_value_string(connection_id);
    return graaly_module_call("websocket", "state", &arg, 1u, state);
}

int graaly_ui_render(
        graaly_handle_t player,
        const char *snapshot_json,
        graaly_callback_t action_callback) {
    int callback_id = register_required_callback(action_callback);
    if (callback_id < 0) return -1;
    graaly_value_t args[3] = {
            graaly_value_handle(player),
            graaly_value_string(snapshot_json),
            graaly_value_i64(callback_id)
    };
    graaly_value_t result;
    return graaly_module_call("ui", "render", args, 3u, &result);
}

int graaly_ui_render_html(
        graaly_handle_t player,
        const char *markup,
        const char *css,
        graaly_callback_t action_callback) {
    int callback_id = register_required_callback(action_callback);
    if (callback_id < 0) return -1;
    graaly_value_t args[4] = {
            graaly_value_handle(player),
            graaly_value_string(markup),
            graaly_value_string(css == NULL ? "" : css),
            graaly_value_i64(callback_id)
    };
    graaly_value_t result;
    return graaly_module_call("ui", "renderHtml", args, 4u, &result);
}

int graaly_ui_clear(graaly_handle_t player) {
    graaly_value_t arg = graaly_value_handle(player);
    graaly_value_t result;
    return graaly_module_call("ui", "clear", &arg, 1u, &result);
}

int graaly_ui_dismiss(graaly_handle_t player, const char *surface) {
    graaly_value_t args[2] = {
            graaly_value_handle(player),
            graaly_value_string(surface)
    };
    graaly_value_t result;
    return graaly_module_call("ui", "dismiss", args, 2u, &result);
}

int graaly_boards_state(
        const char *board,
        graaly_handle_t player,
        const char *state_json) {
    graaly_value_t args[3] = {
            graaly_value_string(board),
            graaly_value_handle(player),
            graaly_value_string(state_json)
    };
    graaly_value_t result;
    return graaly_module_call("boards", "state", args, 3u, &result);
}

int graaly_boards_on_message(const char *board, graaly_callback_t callback) {
    int callback_id = register_required_callback(callback);
    if (callback_id < 0) return -1;
    graaly_value_t args[2] = {
            graaly_value_string(board),
            graaly_value_i64(callback_id)
    };
    graaly_value_t result;
    return graaly_module_call("boards", "onMessage", args, 2u, &result);
}

int graaly_boards_listen(const char *board, graaly_callback_t callback) {
    return graaly_boards_on_message(board, callback);
}

int graaly_boards_refresh(const char *board, graaly_handle_t player) {
    graaly_value_t args[2] = {
            graaly_value_string(board),
            graaly_value_handle(player)
    };
    graaly_value_t result;
    return graaly_module_call("boards", "refresh", args, 2u, &result);
}

int graaly_packets_wrapper_type(const char *exported_name, graaly_value_t *result) {
    graaly_value_t arg = graaly_value_string(exported_name);
    return graaly_module_call("packets", "wrapperType", &arg, 1u, result);
}

int graaly_packets_named_type(const char *exported_name, graaly_value_t *result) {
    graaly_value_t arg = graaly_value_string(exported_name);
    return graaly_module_call("packets", "namedType", &arg, 1u, result);
}

int graaly_packets_packet_type(const char *path, graaly_value_t *result) {
    graaly_value_t arg = graaly_value_string(path);
    return graaly_module_call("packets", "packetType", &arg, 1u, result);
}

int graaly_packets_create(
        graaly_handle_t wrapper_type,
        const graaly_value_t *arguments,
        size_t argument_count,
        graaly_value_t *result) {
    if (argument_count > (SIZE_MAX - 1u)) return -1;
    graaly_value_t *args = (graaly_value_t *) malloc((argument_count + 1u) * sizeof *args);
    if (args == NULL) return -1;
    args[0] = graaly_value_handle(wrapper_type);
    for (size_t index = 0; index < argument_count; index++) {
        args[index + 1u] = arguments[index];
    }
    int status = graaly_module_call("packets", "create", args, argument_count + 1u, result);
    free(args);
    return status;
}

int graaly_packets_wrap(
        graaly_handle_t wrapper_type,
        graaly_handle_t packet_event,
        graaly_value_t *result) {
    graaly_value_t args[2] = {
            graaly_value_handle(wrapper_type),
            graaly_value_handle(packet_event)
    };
    return graaly_module_call("packets", "wrap", args, 2u, result);
}

static int packet_listener(
        const char *operation,
        graaly_value_t packet_type,
        const char *priority,
        graaly_callback_t callback,
        graaly_value_t *binding) {
    int callback_id = register_required_callback(callback);
    if (callback_id < 0) return -1;
    graaly_value_t args[3] = {
            packet_type,
            graaly_value_string(priority == NULL ? "NORMAL" : priority),
            graaly_value_i64(callback_id)
    };
    return graaly_module_call("packets", operation, args, 3u, binding);
}

int graaly_packets_on_receive(
        graaly_value_t packet_type,
        const char *priority,
        graaly_callback_t callback,
        graaly_value_t *binding) {
    return packet_listener("onReceive", packet_type, priority, callback, binding);
}

int graaly_packets_on_send(
        graaly_value_t packet_type,
        const char *priority,
        graaly_callback_t callback,
        graaly_value_t *binding) {
    return packet_listener("onSend", packet_type, priority, callback, binding);
}

int graaly_packets_send(graaly_handle_t player, graaly_handle_t packet) {
    graaly_value_t args[2] = {
            graaly_value_handle(player),
            graaly_value_handle(packet)
    };
    graaly_value_t result;
    return graaly_module_call("packets", "send", args, 2u, &result);
}

int graaly_packets_send_to_all(graaly_handle_t packet) {
    graaly_value_t arg = graaly_value_handle(packet);
    graaly_value_t result;
    return graaly_module_call("packets", "sendToAll", &arg, 1u, &result);
}

int graaly_packets_receive(graaly_handle_t player, graaly_handle_t packet) {
    graaly_value_t args[2] = {
            graaly_value_handle(player),
            graaly_value_handle(packet)
    };
    graaly_value_t result;
    return graaly_module_call("packets", "receive", args, 2u, &result);
}

int graaly_packets_user(graaly_handle_t player, graaly_value_t *result) {
    graaly_value_t arg = graaly_value_handle(player);
    return graaly_module_call("packets", "user", &arg, 1u, result);
}

int graaly_packets_client_version(graaly_handle_t player, graaly_value_t *result) {
    graaly_value_t arg = graaly_value_handle(player);
    return graaly_module_call("packets", "clientVersion", &arg, 1u, result);
}

int graaly_packets_ping(graaly_handle_t player, int *ping) {
    if (ping == NULL) return -1;
    graaly_value_t arg = graaly_value_handle(player);
    graaly_value_t result;
    int status = graaly_module_call("packets", "ping", &arg, 1u, &result);
    if (status == 0 && result.kind == GRAALY_VALUE_I64) {
        *ping = (int) (int64_t) result.a;
    }
    return status;
}

int graaly_commands_dispatch(
        graaly_value_t sender,
        const char *command_line,
        bool *dispatched) {
    if (dispatched == NULL) return -1;
    graaly_value_t args[2] = {sender, graaly_value_string(command_line)};
    graaly_value_t result;
    int status = graaly_module_call("commands", "dispatch", args, 2u, &result);
    if (status == 0) *dispatched = value_as_bool(result);
    return status;
}

int graaly_diagnostics_verify(graaly_value_t *result) {
    return module_call_simple("diagnostics", "verify", result);
}

static graaly_command_entry_t *find_command_entry(const char *name) {
    if (name == NULL) return NULL;
    for (int index = 0; index < command_count; index++) {
        if (strcmp(command_callbacks[index].name, name) == 0) {
            return &command_callbacks[index];
        }
    }
    return NULL;
}

static graaly_command_entry_t *ensure_command_entry(const char *name) {
    if (name == NULL || *name == '\0') return NULL;
    graaly_command_entry_t *existing = find_command_entry(name);
    if (existing != NULL) return existing;

    size_t length = strlen(name);
    if (length >= GRAALY_MAX_COMMAND_NAME || command_count >= GRAALY_MAX_COMMANDS) {
        return NULL;
    }

    graaly_command_entry_t *entry = &command_callbacks[command_count++];
    memset(entry, 0, sizeof *entry);
    memcpy(entry->name, name, length + 1u);
    return entry;
}

int graaly_commands_on(const char *name, graaly_command_callback_t callback) {
    if (callback == NULL) return -1;
    graaly_command_entry_t *entry = ensure_command_entry(name);
    if (entry == NULL) return -1;
    entry->callback = callback;
    return (int) (entry - command_callbacks) + 1;
}

int graaly_commands_complete_on(
        const char *name,
        graaly_tab_complete_callback_t callback) {
    if (callback == NULL) return -1;
    graaly_command_entry_t *entry = ensure_command_entry(name);
    if (entry == NULL) return -1;
    entry->completer = callback;
    return (int) (entry - command_callbacks) + 1;
}

void graaly_debug_poison(void *memory, size_t bytes, uint32_t pattern) {
    if (memory == NULL) {
        return;
    }

    unsigned char *cursor = (unsigned char *) memory;
    unsigned char pattern_bytes[4] = {
            (unsigned char) (pattern & 0xffu),
            (unsigned char) ((pattern >> 8u) & 0xffu),
            (unsigned char) ((pattern >> 16u) & 0xffu),
            (unsigned char) ((pattern >> 24u) & 0xffu)
    };

    for (size_t index = 0; index < bytes; index++) {
        cursor[index] = pattern_bytes[index & 3u];
    }
}

bool graaly_debug_canary_is_deadbeef(uint32_t value) {
    return value == GRAALY_DEADBEEF;
}

void graaly_handle_poison(graaly_handle_t *handle) {
    if (handle != NULL) {
        *handle = GRAALY_POISON_HANDLE;
    }
}

bool graaly_handle_is_poisoned(graaly_handle_t handle) {
    return handle == GRAALY_POISON_HANDLE;
}

static unsigned char deadbeef_byte(size_t index) {
    static const unsigned char pattern[4] = {0xefu, 0xbeu, 0xadu, 0xdeu};
    return pattern[index & 3u];
}

static bool deadbeef_region_intact(const unsigned char *memory, size_t bytes) {
    for (size_t index = 0; index < bytes; index++) {
        if (memory[index] != deadbeef_byte(index)) {
            return false;
        }
    }
    return true;
}

static graaly_debug_record_t *find_debug_record(const void *pointer) {
    for (size_t index = 0; index < GRAALY_DEBUG_MAX_ALLOCATIONS; index++) {
        graaly_debug_record_t *record = &debug_allocations[index];
        if (record->in_use && record->payload == pointer) {
            return record;
        }
    }
    return NULL;
}

static graaly_debug_record_t *free_debug_record_slot(void) {
    for (size_t index = 0; index < GRAALY_DEBUG_MAX_ALLOCATIONS; index++) {
        if (!debug_allocations[index].in_use) {
            return &debug_allocations[index];
        }
    }
    return NULL;
}

void *graaly_debug_malloc(size_t bytes) {
    graaly_debug_record_t *record = free_debug_record_slot();
    if (record == NULL) {
        return NULL;
    }

    const size_t overhead =
            sizeof(graaly_debug_header_t) + (GRAALY_DEBUG_REDZONE_BYTES * 2u);
    if (bytes > SIZE_MAX - overhead) {
        return NULL;
    }

    size_t total = overhead + bytes;
    graaly_debug_header_t *base =
            (graaly_debug_header_t *) malloc(total == 0u ? 1u : total);
    if (base == NULL) {
        return NULL;
    }

    unsigned char *front =
            (unsigned char *) base + sizeof(graaly_debug_header_t);
    unsigned char *payload = front + GRAALY_DEBUG_REDZONE_BYTES;
    unsigned char *back = payload + bytes;

    base->fields.magic = GRAALY_DEBUG_BLOCK_MAGIC;
    base->fields.state = 1u;
    base->fields.reserved_a = 0u;
    base->fields.reserved_b = 0u;

    graaly_debug_poison(front, GRAALY_DEBUG_REDZONE_BYTES, GRAALY_DEADBEEF);
    graaly_debug_poison(back, GRAALY_DEBUG_REDZONE_BYTES, GRAALY_DEADBEEF);
    if (bytes != 0u) {
        graaly_debug_poison(payload, bytes, UINT32_C(0xBAADF00D));
    }

    record->base = base;
    record->payload = payload;
    record->requested = bytes;
    record->in_use = true;
    record->freed = false;
    return payload;
}

graaly_memory_status_t graaly_debug_check(const void *pointer) {
    if (pointer == NULL) {
        return GRAALY_MEMORY_NULL;
    }

    graaly_debug_record_t *record = find_debug_record(pointer);
    if (record == NULL) {
        return GRAALY_MEMORY_UNKNOWN_POINTER;
    }

    if (record->base->fields.magic != GRAALY_DEBUG_BLOCK_MAGIC) {
        return GRAALY_MEMORY_BOUNDS_CORRUPTED;
    }

    const unsigned char *front =
            (const unsigned char *) record->base + sizeof(graaly_debug_header_t);
    const unsigned char *back = record->payload + record->requested;
    bool front_ok = deadbeef_region_intact(front, GRAALY_DEBUG_REDZONE_BYTES);
    bool back_ok = deadbeef_region_intact(back, GRAALY_DEBUG_REDZONE_BYTES);

    if (!front_ok && !back_ok) {
        return GRAALY_MEMORY_BOUNDS_CORRUPTED;
    }
    if (!front_ok) {
        return GRAALY_MEMORY_UNDERFLOW;
    }
    if (!back_ok) {
        return GRAALY_MEMORY_OVERFLOW;
    }
    if (record->freed) {
        return GRAALY_MEMORY_ALREADY_FREED;
    }
    return GRAALY_MEMORY_OK;
}

graaly_memory_status_t graaly_debug_free(void *pointer) {
    graaly_memory_status_t status = graaly_debug_check(pointer);
    if (status == GRAALY_MEMORY_NULL
            || status == GRAALY_MEMORY_UNKNOWN_POINTER
            || status == GRAALY_MEMORY_ALREADY_FREED) {
        return status;
    }

    graaly_debug_record_t *record = find_debug_record(pointer);
    if (record == NULL) {
        return GRAALY_MEMORY_UNKNOWN_POINTER;
    }

    record->freed = true;
    record->base->fields.state = 2u;
    if (record->requested != 0u) {
        graaly_debug_poison(record->payload, record->requested, GRAALY_DEADBEEF);
    }
    return status;
}

size_t graaly_debug_allocation_size(const void *pointer) {
    graaly_debug_record_t *record = find_debug_record(pointer);
    return record == NULL ? 0u : record->requested;
}

const char *graaly_memory_status_name(graaly_memory_status_t status) {
    switch (status) {
        case GRAALY_MEMORY_OK:
            return "ok";
        case GRAALY_MEMORY_NULL:
            return "null";
        case GRAALY_MEMORY_UNKNOWN_POINTER:
            return "unknown-pointer";
        case GRAALY_MEMORY_ALREADY_FREED:
            return "already-freed";
        case GRAALY_MEMORY_UNDERFLOW:
            return "buffer-underflow";
        case GRAALY_MEMORY_OVERFLOW:
            return "buffer-overflow";
        case GRAALY_MEMORY_BOUNDS_CORRUPTED:
            return "both-redzones-or-header-corrupted";
        case GRAALY_MEMORY_ALLOCATION_TABLE_FULL:
            return "allocation-table-full";
        default:
            return "unknown-status";
    }
}

void graaly_debug_allocator_reset(void) {
    for (size_t index = 0; index < GRAALY_DEBUG_MAX_ALLOCATIONS; index++) {
        graaly_debug_record_t *record = &debug_allocations[index];
        if (!record->in_use) {
            continue;
        }
        free(record->base);
        memset(record, 0, sizeof *record);
    }
}

GRAALY_EXPORT("graaly_abi_version")
uint32_t graaly_abi_version(void) {
    return GRAALY_C_ABI_VERSION;
}

GRAALY_EXPORT("graaly_plugin_load")
void graaly_plugin_load(void) {
    graaly_on_load();
}

GRAALY_EXPORT("graaly_plugin_enable")
void graaly_plugin_enable(void) {
    graaly_on_enable();
}

GRAALY_EXPORT("graaly_plugin_disable")
void graaly_plugin_disable(void) {
    graaly_on_disable();
    graaly_debug_allocator_reset();
}

GRAALY_EXPORT("graaly_dispatch_event")
void graaly_dispatch_event(
        int32_t callback_id,
        int32_t event_id,
        uint64_t player) {
    (void) event_id;
    if (callback_id <= 0 || callback_id > GRAALY_MAX_EVENT_CALLBACKS) {
        return;
    }
    graaly_event_callback_t callback = event_callbacks[callback_id - 1].callback;
    if (callback != NULL) {
        callback(player);
    }
}

GRAALY_EXPORT("graaly_dispatch_callback")
void graaly_dispatch_callback(
        int32_t callback_id,
        uint32_t arguments_pointer,
        uint32_t argument_count,
        uint32_t result_pointer) {
    if (callback_id <= 0 || callback_id > GRAALY_MAX_GENERIC_CALLBACKS) {
        return;
    }
    graaly_callback_t callback = generic_callbacks[callback_id - 1].callback;
    if (callback == NULL) {
        return;
    }

    const graaly_value_t *arguments =
            (const graaly_value_t *) (uintptr_t) arguments_pointer;
    graaly_value_t result = callback((size_t) argument_count, arguments);
    if (result_pointer != 0u) {
        graaly_value_t *destination =
                (graaly_value_t *) (uintptr_t) result_pointer;
        *destination = result;
    }
}

GRAALY_EXPORT("graaly_dispatch_object_event")
void graaly_dispatch_object_event(int32_t callback_id, uint64_t event_handle) {
    if (callback_id <= 0 || callback_id > GRAALY_MAX_OBJECT_EVENT_CALLBACKS) {
        return;
    }
    graaly_object_event_callback_t callback =
            object_event_callbacks[callback_id - 1].callback;
    if (callback != NULL) {
        callback(event_handle);
    }
}

GRAALY_EXPORT("graaly_dispatch_task")
void graaly_dispatch_task(int32_t callback_id) {
    if (callback_id <= 0 || callback_id > GRAALY_MAX_TASK_CALLBACKS) {
        return;
    }
    graaly_task_callback_t callback = task_callbacks[callback_id - 1].callback;
    if (callback != NULL) {
        callback();
    }
}

static bool string_view_equals(graaly_string_view_t view, const char *text) {
    size_t length = strlen(text);
    return view.length == length && memcmp(view.data, text, length) == 0;
}

GRAALY_EXPORT("graaly_dispatch_command")
int32_t graaly_dispatch_command(
        uint64_t sender,
        uint32_t name_pointer,
        uint32_t name_length,
        int32_t argc,
        uint32_t argv_pointer) {
    if (argc < 0 || argc > 128) {
        return 0;
    }

    graaly_string_view_t name = {
            .data = (const char *) (uintptr_t) name_pointer,
            .length = (size_t) name_length
    };
    const graaly_string_view_t *argv =
            (const graaly_string_view_t *) (uintptr_t) argv_pointer;

    for (int index = 0; index < command_count; index++) {
        graaly_command_entry_t *entry = &command_callbacks[index];
        if (entry->callback != NULL && string_view_equals(name, entry->name)) {
            return entry->callback(sender, (int) argc, argv) ? 1 : 0;
        }
    }
    return 0;
}

GRAALY_EXPORT("graaly_dispatch_tab_complete")
uint32_t graaly_dispatch_tab_complete(
        uint64_t sender,
        uint32_t name_pointer,
        uint32_t name_length,
        int32_t argc,
        uint32_t argv_pointer,
        uint32_t output_pointer,
        uint32_t output_capacity) {
    if (argc < 0 || argc > 128) {
        return 0u;
    }

    graaly_string_view_t name = {
            .data = (const char *) (uintptr_t) name_pointer,
            .length = (size_t) name_length
    };
    const graaly_string_view_t *argv =
            (const graaly_string_view_t *) (uintptr_t) argv_pointer;
    char *output = (char *) (uintptr_t) output_pointer;

    for (int index = 0; index < command_count; index++) {
        graaly_command_entry_t *entry = &command_callbacks[index];
        if (entry->completer != NULL && string_view_equals(name, entry->name)) {
            size_t required = entry->completer(
                    sender,
                    (int) argc,
                    argv,
                    output,
                    (size_t) output_capacity);
            return required > UINT32_MAX ? UINT32_MAX : (uint32_t) required;
        }
    }
    return 0u;
}

GRAALY_EXPORT("graaly_alloc")
uint32_t graaly_alloc(uint32_t bytes) {
    size_t requested = bytes == 0 ? 1u : (size_t) bytes;
    void *memory = malloc(requested);
    if (memory == NULL) {
        return 0u;
    }
    return wasm_pointer(memory);
}

GRAALY_EXPORT("graaly_free")
void graaly_free(uint32_t pointer) {
    if (pointer != 0u) {
        free((void *) (uintptr_t) pointer);
    }
}
