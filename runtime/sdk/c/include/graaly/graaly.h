#ifndef GRAALY_GRAALY_H
#define GRAALY_GRAALY_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define GRAALY_C_ABI_VERSION 1u
#define GRAALY_DEADBEEF UINT32_C(0xDEADBEEF)
#define GRAALY_POISON_HANDLE UINT64_C(0xDEADBEEFDEADBEEF)

typedef uint64_t graaly_handle_t;
typedef graaly_handle_t graaly_sender_handle_t;
typedef graaly_handle_t graaly_player_handle_t;

typedef struct graaly_string_view {
    const char *data;
    size_t length;
} graaly_string_view_t;

/*
 * Universal value carrier for the generated canonical API.
 *
 * The representation is fixed at 24 bytes on wasm32:
 *   kind  @ +0  (u32)
 *   flags @ +4  (u32)
 *   a     @ +8  (u64)
 *   b     @ +16 (u64)
 *
 * Strings passed TO Graaly store pointer in a and byte length in b.
 * Non-scalar values returned FROM Graaly are opaque handles in a.
 */
typedef enum graaly_value_kind {
    GRAALY_VALUE_NULL = 0,
    GRAALY_VALUE_BOOL = 1,
    GRAALY_VALUE_I64 = 2,
    GRAALY_VALUE_F64 = 3,
    GRAALY_VALUE_STRING = 4,
    GRAALY_VALUE_HANDLE = 5
} graaly_value_kind_t;

typedef struct graaly_value {
    uint32_t kind;
    uint32_t flags;
    uint64_t a;
    uint64_t b;
} graaly_value_t;

typedef graaly_value_t (*graaly_callback_t)(
        size_t argument_count,
        const graaly_value_t *arguments);

typedef enum graaly_root {
    GRAALY_ROOT_PLUGIN = 1,
    GRAALY_ROOT_SERVER = 2,
    GRAALY_ROOT_CONFIG = 3,
    GRAALY_ROOT_LOGGER = 4,
    GRAALY_ROOT_DATA_FOLDER = 5
} graaly_root_t;

graaly_value_t graaly_value_null(void);
graaly_value_t graaly_value_bool(bool value);
graaly_value_t graaly_value_i64(int64_t value);
graaly_value_t graaly_value_f64(double value);
graaly_value_t graaly_value_string(const char *value);
graaly_value_t graaly_value_string_n(const char *value, size_t length);
graaly_value_t graaly_value_handle(graaly_handle_t value);

int graaly_type(const char *exported_name, graaly_value_t *result);
int graaly_constant(const char *namespace_name, const char *constant_name, graaly_value_t *result);
int graaly_root_value(graaly_root_t root, graaly_value_t *result);
int graaly_get(graaly_handle_t target, const char *member, graaly_value_t *result);
int graaly_set(graaly_handle_t target, const char *member, graaly_value_t value);
int graaly_call(
        graaly_handle_t target,
        const char *member,
        const graaly_value_t *arguments,
        size_t argument_count,
        graaly_value_t *result);
int graaly_construct(
        graaly_handle_t type,
        const graaly_value_t *arguments,
        size_t argument_count,
        graaly_value_t *result);
int graaly_static_member(graaly_handle_t type, const char *member, graaly_value_t *result);

int graaly_collection_size(graaly_handle_t collection, size_t *size);
int graaly_collection_get(graaly_handle_t collection, size_t index, graaly_value_t *result);
int graaly_collection_set(graaly_handle_t collection, size_t index, graaly_value_t value);
int graaly_collection_add(graaly_handle_t collection, graaly_value_t value);
int graaly_collection_remove_at(graaly_handle_t collection, size_t index, graaly_value_t *result);
int graaly_collection_contains(graaly_handle_t collection, graaly_value_t value, bool *contains);
int graaly_collection_clear(graaly_handle_t collection);

int graaly_map_size(graaly_handle_t map, size_t *size);
int graaly_map_get(graaly_handle_t map, graaly_value_t key, graaly_value_t *result);
int graaly_map_put(graaly_handle_t map, graaly_value_t key, graaly_value_t value, graaly_value_t *previous);
int graaly_map_remove(graaly_handle_t map, graaly_value_t key, graaly_value_t *previous);
int graaly_map_contains(graaly_handle_t map, graaly_value_t key, bool *contains);
int graaly_map_clear(graaly_handle_t map);

int graaly_optional_value(graaly_handle_t optional, graaly_value_t *result);
int graaly_module_call(
        const char *module,
        const char *operation,
        const graaly_value_t *arguments,
        size_t argument_count,
        graaly_value_t *result);

int graaly_compat_contract_version(graaly_value_t *result);
int graaly_compat_minimum_game_version(graaly_value_t *result);
int graaly_compat_minecraft_version(graaly_value_t *result);
int graaly_compat_server_version(graaly_value_t *result);
int graaly_compat_supports(const char *feature, bool *supported);
int graaly_compat_require(const char *feature);
int graaly_type_available(const char *exported_name, bool *available);
int graaly_compat_material(const char *canonical_name, graaly_value_t *result);

/* Stable C facades for every public Graaly module. */
int graaly_config_get(const char *path, graaly_value_t fallback, graaly_value_t *result);
int graaly_config_set(const char *path, graaly_value_t value);
int graaly_config_contains(const char *path, bool *contains);
int graaly_config_save(void);
int graaly_config_reload(void);

int graaly_players_online(graaly_value_t *result);
int graaly_players_get(const char *name, graaly_value_t *result);
int graaly_players_exact(const char *name, graaly_value_t *result);
int graaly_players_is_player(graaly_value_t value, bool *is_player);
int graaly_players_broadcast(const char *message);

int graaly_worlds_all(graaly_value_t *result);
int graaly_worlds_get(const char *name, graaly_value_t *result);
int graaly_worlds_location(
        graaly_handle_t world,
        double x, double y, double z,
        double yaw, double pitch,
        graaly_value_t *result);
int graaly_worlds_create(
        const char *name,
        const graaly_value_t *option_pairs,
        size_t pair_count,
        graaly_value_t *result);
int graaly_worlds_generator(
        graaly_callback_t generate,
        graaly_callback_t can_spawn,
        graaly_callback_t default_populators,
        graaly_callback_t fixed_spawn,
        graaly_value_t *result);
int graaly_worlds_populator(graaly_callback_t callback, graaly_value_t *result);
int graaly_worlds_unload(graaly_value_t world_or_name, bool save, bool *unloaded);

int graaly_entities_type(const char *name, graaly_value_t *result);
int graaly_entities_attribute_type(const char *name, graaly_value_t *result);
int graaly_entities_spawn(
        graaly_handle_t location,
        graaly_handle_t entity_type,
        graaly_value_t *result);
int graaly_entities_configure(
        graaly_handle_t entity,
        const graaly_value_t *option_pairs,
        size_t pair_count,
        graaly_value_t *result);
int graaly_entities_attribute(
        graaly_handle_t entity,
        graaly_value_t name_or_attribute,
        const graaly_value_t *base_value,
        graaly_value_t *result);
int graaly_entities_remove(graaly_handle_t entity);

int graaly_http_request(
        const char *method,
        const char *url,
        const char *headers_json,
        const char *body,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id);
int graaly_http_get(
        const char *url,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id);
int graaly_http_post(
        const char *url,
        const char *body,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id);
int graaly_http_put(
        const char *url,
        const char *body,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id);
int graaly_http_delete(
        const char *url,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id);
int graaly_http_cancel(const char *request_id, bool *cancelled);

int graaly_websocket_connect(
        const char *url,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t event_callback,
        graaly_value_t *connection_id);
int graaly_websocket_send(
        const char *connection_id,
        const char *text,
        graaly_callback_t completion_callback);
int graaly_websocket_close(
        const char *connection_id,
        int code,
        const char *reason,
        graaly_callback_t completion_callback);
int graaly_websocket_state(const char *connection_id, graaly_value_t *state);

int graaly_ui_render(
        graaly_handle_t player,
        const char *snapshot_json,
        graaly_callback_t action_callback);
int graaly_ui_render_html(
        graaly_handle_t player,
        const char *markup,
        const char *css,
        graaly_callback_t action_callback);
int graaly_ui_clear(graaly_handle_t player);
int graaly_ui_dismiss(graaly_handle_t player, const char *surface);

int graaly_boards_state(
        const char *board,
        graaly_handle_t player,
        const char *state_json);
int graaly_boards_on_message(const char *board, graaly_callback_t callback);
int graaly_boards_listen(const char *board, graaly_callback_t callback);
int graaly_boards_refresh(const char *board, graaly_handle_t player);

int graaly_packets_wrapper_type(const char *exported_name, graaly_value_t *result);
int graaly_packets_named_type(const char *exported_name, graaly_value_t *result);
int graaly_packets_packet_type(const char *path, graaly_value_t *result);
int graaly_packets_create(
        graaly_handle_t wrapper_type,
        const graaly_value_t *arguments,
        size_t argument_count,
        graaly_value_t *result);
int graaly_packets_wrap(
        graaly_handle_t wrapper_type,
        graaly_handle_t packet_event,
        graaly_value_t *result);
int graaly_packets_on_receive(
        graaly_value_t packet_type,
        const char *priority,
        graaly_callback_t callback,
        graaly_value_t *binding);
int graaly_packets_on_send(
        graaly_value_t packet_type,
        const char *priority,
        graaly_callback_t callback,
        graaly_value_t *binding);
#define graaly_packets_listen_receive graaly_packets_on_receive
#define graaly_packets_listen_send graaly_packets_on_send
int graaly_packets_send(graaly_handle_t player, graaly_handle_t packet);
int graaly_packets_send_to_all(graaly_handle_t packet);
int graaly_packets_receive(graaly_handle_t player, graaly_handle_t packet);
int graaly_packets_user(graaly_handle_t player, graaly_value_t *result);
int graaly_packets_client_version(graaly_handle_t player, graaly_value_t *result);
int graaly_packets_ping(graaly_handle_t player, int *ping);

int graaly_commands_dispatch(
        graaly_value_t sender,
        const char *command_line,
        bool *dispatched);
int graaly_diagnostics_verify(graaly_value_t *result);

size_t graaly_handle_string(graaly_handle_t handle, char *destination, size_t capacity);
void graaly_handle_release(graaly_handle_t handle);
size_t graaly_last_error(char *destination, size_t capacity);

typedef enum graaly_log_level {
    GRAALY_LOG_INFO = 0,
    GRAALY_LOG_WARNING = 1,
    GRAALY_LOG_ERROR = 2
} graaly_log_level_t;

typedef enum graaly_event_id {
    GRAALY_EVENT_PLAYER_JOIN = 1,
    GRAALY_EVENT_PLAYER_QUIT = 2
} graaly_event_id_t;

typedef enum graaly_memory_status {
    GRAALY_MEMORY_OK = 0,
    GRAALY_MEMORY_NULL = 1,
    GRAALY_MEMORY_UNKNOWN_POINTER = 2,
    GRAALY_MEMORY_ALREADY_FREED = 3,
    GRAALY_MEMORY_UNDERFLOW = 4,
    GRAALY_MEMORY_OVERFLOW = 5,
    GRAALY_MEMORY_BOUNDS_CORRUPTED = 6,
    GRAALY_MEMORY_ALLOCATION_TABLE_FULL = 7
} graaly_memory_status_t;

typedef void (*graaly_event_callback_t)(graaly_player_handle_t player);
typedef void (*graaly_object_event_callback_t)(graaly_handle_t event);
typedef void (*graaly_task_callback_t)(void);
typedef bool (*graaly_command_callback_t)(
        graaly_sender_handle_t sender,
        int argc,
        const graaly_string_view_t *argv);
typedef size_t (*graaly_tab_complete_callback_t)(
        graaly_sender_handle_t sender,
        int argc,
        const graaly_string_view_t *argv,
        char *output,
        size_t capacity);

/*
 * Lifecycle hooks are optional. Define any of these in your plugin source.
 * Graaly's SDK supplies weak no-op defaults.
 */
void graaly_on_load(void);
void graaly_on_enable(void);
void graaly_on_disable(void);

/*
 * Logging and messaging.
 *
 * The _n variants teach pointer+length APIs explicitly; the convenience
 * variants use strlen in guest C.
 */
void graaly_log_n(graaly_log_level_t level, const char *message, size_t length);
void graaly_log(graaly_log_level_t level, const char *message);
void graaly_sender_send_message_n(
        graaly_sender_handle_t sender,
        const char *message,
        size_t length);
void graaly_sender_send_message(
        graaly_sender_handle_t sender,
        const char *message);

/*
 * Handles are NOT pointers. They identify host objects only while Graaly says
 * they are alive. Never cast a handle to a pointer.
 */
graaly_player_handle_t graaly_sender_as_player(graaly_sender_handle_t sender);

/*
 * Graaly intentionally does not declare a Player struct.
 *
 * You define your own struct and choose what to copy into it, for example:
 *
 *   typedef struct Player {
 *       graaly_player_handle_t handle;
 *       char name[32];
 *       double health;
 *       int level;
 *   } Player;
 *
 * Then fill it with the size-aware readers below. This keeps struct layout,
 * arrays, sizeof, pointer passing, and snapshot-vs-live state visible to the
 * learner instead of hiding them behind a generated object wrapper.
 *
 * String readers return the full required UTF-8 byte count. If the return
 * value is >= capacity, the destination was truncated but remains NUL-ended.
 */
size_t graaly_player_read_name(
        graaly_player_handle_t player,
        char *destination,
        size_t capacity);
size_t graaly_player_read_uuid(
        graaly_player_handle_t player,
        char *destination,
        size_t capacity);
double graaly_player_health(graaly_player_handle_t player);
int graaly_player_level(graaly_player_handle_t player);

/*
 * Register C function pointers. The SDK stores them in the module and sends
 * only an integer callback id to Java, so Java never sees or dereferences a C
 * function pointer.
 */
int graaly_callback_register(graaly_callback_t callback);
int graaly_events_on(graaly_event_id_t event, graaly_event_callback_t callback);
int graaly_events_on_type(
        const char *exported_event_type,
        const char *priority,
        bool ignore_cancelled,
        graaly_object_event_callback_t callback);
#define graaly_events_listen graaly_events_on_type
int graaly_commands_on(const char *name, graaly_command_callback_t callback);
int graaly_commands_complete_on(const char *name, graaly_tab_complete_callback_t callback);
#define graaly_commands_handle graaly_commands_on
#define graaly_commands_complete graaly_commands_complete_on
#define graaly_commands_completer graaly_commands_complete_on

int graaly_tasks_run(graaly_task_callback_t callback);
int graaly_tasks_later(uint64_t delay_ticks, graaly_task_callback_t callback);
int graaly_tasks_repeat(uint64_t delay_ticks, uint64_t period_ticks, graaly_task_callback_t callback);
int graaly_tasks_run_async(graaly_task_callback_t callback);
int graaly_tasks_later_async(uint64_t delay_ticks, graaly_task_callback_t callback);
int graaly_tasks_repeat_async(uint64_t delay_ticks, uint64_t period_ticks, graaly_task_callback_t callback);
void graaly_tasks_cancel(int task_id);
uint64_t graaly_ticks(double seconds);
bool graaly_tasks_is_main_thread(void);
#define graaly_tasks_delay graaly_tasks_later
#define graaly_tasks_sleep graaly_tasks_later

/*
 * Optional teaching allocator.
 *
 * It is deliberately separate from malloc/free. Allocations receive 16-byte
 * DEADBEEF red zones before and after the user region. debug_free marks the
 * block logically freed, poisons the payload, and quarantines it until plugin
 * disable so a lesson can inspect use-after-free state without dereferencing
 * memory already returned to libc.
 */
void *graaly_debug_malloc(size_t bytes);
graaly_memory_status_t graaly_debug_check(const void *pointer);
graaly_memory_status_t graaly_debug_free(void *pointer);
size_t graaly_debug_allocation_size(const void *pointer);
const char *graaly_memory_status_name(graaly_memory_status_t status);
void graaly_debug_allocator_reset(void);

/* Safe helpers for explicit buffers, canaries, and stale-handle exercises. */
void graaly_debug_poison(void *memory, size_t bytes, uint32_t pattern);
bool graaly_debug_canary_is_deadbeef(uint32_t value);
void graaly_handle_poison(graaly_handle_t *handle);
bool graaly_handle_is_poisoned(graaly_handle_t handle);

#ifdef __cplusplus
}
#endif

/* Generated canonical names for every exported type, member, and constant. */
#include "graaly/catalog.h"

#endif
