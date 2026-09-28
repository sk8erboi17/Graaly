#ifndef GRAALY_GRAALY_H
#define GRAALY_GRAALY_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include "graaly/types.h"

#ifdef __cplusplus
extern "C" {
#endif

#define GRAALY_C_ABI_VERSION 1u
#define GRAALY_DEADBEEF UINT32_C(0xDEADBEEF)
#define GRAALY_POISON_HANDLE UINT64_C(0xDEADBEEFDEADBEEF)

typedef enum graaly_status {
    GRAALY_OK = 0,
    GRAALY_EINVAL = -1,
    GRAALY_ETYPE = -2,
    GRAALY_EHOST = -3,
    GRAALY_ERANGE = -4
} graaly_status_t;

typedef enum graaly_priority {
    GRAALY_PRIORITY_LOWEST = 0,
    GRAALY_PRIORITY_LOW = 1,
    GRAALY_PRIORITY_NORMAL = 2,
    GRAALY_PRIORITY_HIGH = 3,
    GRAALY_PRIORITY_HIGHEST = 4,
    GRAALY_PRIORITY_MONITOR = 5
} graaly_priority_t;

typedef struct graaly_world_options {
    bool has_seed;
    int64_t seed;
    bool has_environment;
    graaly_world_environment_t environment;
    bool has_type;
    graaly_world_type_t type;
    bool has_generate_structures;
    bool generate_structures;
    const char *generator_settings;
    graaly_chunk_generator_t generator;
} graaly_world_options_t;

typedef struct graaly_diagnostics {
    size_t api_symbols;
    size_t packet_wrappers;
    size_t packet_types;
    size_t constants;
} graaly_diagnostics_t;

typedef uint64_t graaly_handle_t;
typedef graaly_handle_t graaly_sender_handle_t;
typedef graaly_handle_t graaly_player_handle_t;

typedef struct graaly_string_view {
    const char *data;
    size_t length;
} graaly_string_view_t;

/*
 * Private 24-byte carrier used by generated inline wrappers.
 * Normal plugin code should not construct or inspect this type directly.
 */
typedef enum graaly__value_kind {
    GRAALY__VALUE_NULL = 0,
    GRAALY__VALUE_BOOL = 1,
    GRAALY__VALUE_I64 = 2,
    GRAALY__VALUE_F64 = 3,
    GRAALY__VALUE_STRING = 4,
    GRAALY__VALUE_HANDLE = 5
} graaly__value_kind_t;

typedef struct graaly__value {
    uint32_t kind;
    uint32_t flags;
    uint64_t a;
    uint64_t b;
} graaly__value_t;

graaly__value_t graaly__value_null(void);
graaly__value_t graaly__value_bool(bool value);
graaly__value_t graaly__value_i64(int64_t value);
graaly__value_t graaly__value_f64(double value);
graaly__value_t graaly__value_string(const char *value);
graaly__value_t graaly__value_string_n(const char *value, size_t length);
graaly__value_t graaly__value_handle(graaly_handle_t value);

typedef void (*graaly_text_callback_t)(const char *text, size_t length);
typedef void (*graaly_packet_callback_t)(graaly_packet_event_t event);

typedef enum graaly_root {
    GRAALY_ROOT_PLUGIN = 1,
    GRAALY_ROOT_SERVER = 2,
    GRAALY_ROOT_CONFIG = 3,
    GRAALY_ROOT_LOGGER = 4,
    GRAALY_ROOT_DATA_FOLDER = 5
} graaly_root_t;

/*
 * Reflection/raw ABI. Normal C plugins should not enable this.
 * The generated typed facade below covers the canonical API with named C
 * functions and opaque typed handles.
 */
#ifdef GRAALY_ENABLE_RAW_ABI
typedef graaly__value_kind_t graaly_value_kind_t;
typedef graaly__value_t graaly_value_t;
#define GRAALY_VALUE_NULL GRAALY__VALUE_NULL
#define GRAALY_VALUE_BOOL GRAALY__VALUE_BOOL
#define GRAALY_VALUE_I64 GRAALY__VALUE_I64
#define GRAALY_VALUE_F64 GRAALY__VALUE_F64
#define GRAALY_VALUE_STRING GRAALY__VALUE_STRING
#define GRAALY_VALUE_HANDLE GRAALY__VALUE_HANDLE
#define graaly_value_null graaly__value_null
#define graaly_value_bool graaly__value_bool
#define graaly_value_i64 graaly__value_i64
#define graaly_value_f64 graaly__value_f64
#define graaly_value_string graaly__value_string
#define graaly_value_string_n graaly__value_string_n
#define graaly_value_handle graaly__value_handle
typedef graaly_value_t (*graaly_callback_t)(
        size_t argument_count,
        const graaly_value_t *arguments);
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
#endif

#ifdef GRAALY_ENABLE_RAW_ABI
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
int __raw_graaly_config_save(void);
int __raw_graaly_config_reload(void);

int graaly_players_online(graaly_value_t *result);
int graaly_players_get(const char *name, graaly_value_t *result);
int graaly_players_exact(const char *name, graaly_value_t *result);
int graaly_players_is_player(graaly_value_t value, bool *is_player);
int __raw_graaly_players_broadcast(const char *message);

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

int __raw_graaly_http_request(
        const char *method,
        const char *url,
        const char *headers_json,
        const char *body,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id);
int __raw_graaly_http_get(
        const char *url,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id);
int __raw_graaly_http_post(
        const char *url,
        const char *body,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id);
int __raw_graaly_http_put(
        const char *url,
        const char *body,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id);
int __raw_graaly_http_delete(
        const char *url,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t callback,
        graaly_value_t *request_id);
int __raw_graaly_http_cancel(const char *request_id, bool *cancelled);

int __raw_graaly_websocket_connect(
        const char *url,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_callback_t event_callback,
        graaly_value_t *connection_id);
int __raw_graaly_websocket_send(
        const char *connection_id,
        const char *text,
        graaly_callback_t completion_callback);
int __raw_graaly_websocket_close(
        const char *connection_id,
        int code,
        const char *reason,
        graaly_callback_t completion_callback);
int __raw_graaly_websocket_state(const char *connection_id, graaly_value_t *state);

int __raw_graaly_ui_render(
        graaly_handle_t player,
        const char *snapshot_json,
        graaly_callback_t action_callback);
int __raw_graaly_ui_render_html(
        graaly_handle_t player,
        const char *markup,
        const char *css,
        graaly_callback_t action_callback);
int __raw_graaly_ui_clear(graaly_handle_t player);
int __raw_graaly_ui_dismiss(graaly_handle_t player, const char *surface);

int __raw_graaly_boards_state(
        const char *board,
        graaly_handle_t player,
        const char *state_json);
int __raw_graaly_boards_on_message(const char *board, graaly_callback_t callback);
int __raw_graaly_boards_listen(const char *board, graaly_callback_t callback);
int __raw_graaly_boards_refresh(const char *board, graaly_handle_t player);

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
#endif

/* Capability checks remain part of the typed public surface. */
int graaly_compat_supports(const char *feature, bool *supported);
int graaly_compat_require(const char *feature);
int graaly_type_available(const char *exported_name, bool *available);

/*
 * Preferred C-native module facade.
 * These avoid graaly_value_t for ordinary plugin code.
 */
graaly_status_t graaly_player_list(
        graaly_player_t *buffer,
        size_t capacity,
        size_t *count);
graaly_status_t graaly_player_find(const char *name, graaly_player_t *out);
graaly_status_t graaly_player_find_exact(const char *name, graaly_player_t *out);

graaly_status_t graaly_world_list(
        graaly_world_t *buffer,
        size_t capacity,
        size_t *count);
graaly_status_t graaly_world_find(const char *name, graaly_world_t *out);
graaly_status_t graaly_location_make(
        graaly_world_t world,
        double x,
        double y,
        double z,
        double yaw,
        double pitch,
        graaly_location_t *out);

graaly_status_t graaly_entity_type_find(const char *name, graaly_entity_type_t *out);
graaly_status_t graaly_entity_spawn_at(
        graaly_location_t location,
        graaly_entity_type_t type,
        graaly_entity_t *out);
graaly_status_t graaly_material_find(const char *name, graaly_material_t *out);

graaly_status_t graaly_contract_version(
        char *buffer,
        size_t capacity,
        size_t *required);
graaly_status_t graaly_minimum_game_version(
        char *buffer,
        size_t capacity,
        size_t *required);
graaly_status_t graaly_minecraft_version(
        char *buffer,
        size_t capacity,
        size_t *required);
graaly_status_t graaly_runtime_server_version(
        char *buffer,
        size_t capacity,
        size_t *required);

graaly_status_t graaly_config_bool(const char *path, bool fallback, bool *out);
graaly_status_t graaly_config_number(const char *path, double fallback, double *out);
graaly_status_t graaly_config_string(
        const char *path,
        const char *fallback,
        char *buffer,
        size_t capacity,
        size_t *required);
graaly_status_t graaly_config_bool_write(const char *path, bool value);
graaly_status_t graaly_config_number_write(const char *path, double value);
graaly_status_t graaly_config_string_write(const char *path, const char *value);
graaly_status_t graaly_config_save(void);
graaly_status_t graaly_config_reload(void);

graaly_status_t graaly_broadcast(const char *message);

graaly_status_t graaly_world_create(
        const char *name,
        const graaly_world_options_t *options,
        graaly_world_t *out);
graaly_status_t graaly_world_unload(
        graaly_world_t *world,
        bool save,
        bool *unloaded);

graaly_status_t graaly_diagnostics_read(graaly_diagnostics_t *out);

graaly_status_t graaly_command_dispatch(
        graaly_sender_t sender,
        const char *command_line,
        bool *dispatched);

graaly_status_t graaly_http_request(
        const char *method,
        const char *url,
        const char *headers_json,
        const char *body,
        uint64_t timeout_ms,
        graaly_text_callback_t callback,
        graaly_http_request_t *out);
graaly_status_t graaly_http_get(
        const char *url,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_text_callback_t callback,
        graaly_http_request_t *out);
graaly_status_t graaly_http_post(
        const char *url,
        const char *body,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_text_callback_t callback,
        graaly_http_request_t *out);
graaly_status_t graaly_http_put(
        const char *url,
        const char *body,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_text_callback_t callback,
        graaly_http_request_t *out);
graaly_status_t graaly_http_delete(
        const char *url,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_text_callback_t callback,
        graaly_http_request_t *out);
graaly_status_t graaly_http_cancel(graaly_http_request_t *request, bool *cancelled);

graaly_status_t graaly_websocket_connect(
        const char *url,
        const char *headers_json,
        uint64_t timeout_ms,
        graaly_text_callback_t event_callback,
        graaly_websocket_t *out);
graaly_status_t graaly_websocket_send(
        graaly_websocket_t socket,
        const char *text,
        graaly_text_callback_t completion_callback);
graaly_status_t graaly_websocket_close(
        graaly_websocket_t *socket,
        int code,
        const char *reason,
        graaly_text_callback_t completion_callback);
graaly_status_t graaly_websocket_state(
        graaly_websocket_t socket,
        char *buffer,
        size_t capacity,
        size_t *required);

graaly_status_t graaly_ui_render(
        graaly_player_t player,
        const char *snapshot_json,
        graaly_text_callback_t action_callback);
graaly_status_t graaly_ui_render_html(
        graaly_player_t player,
        const char *markup,
        const char *css,
        graaly_text_callback_t action_callback);
graaly_status_t graaly_ui_clear(graaly_player_t player);
graaly_status_t graaly_ui_dismiss(graaly_player_t player, const char *surface);

graaly_status_t graaly_board_on_message(
        const char *board,
        graaly_text_callback_t callback);

graaly_status_t graaly_packet_type_find(const char *path, graaly_packet_type_t *out);
graaly_status_t graaly_packet_on_receive(
        graaly_packet_type_t type,
        graaly_priority_t priority,
        graaly_packet_callback_t callback,
        graaly_packet_binding_t *binding);
graaly_status_t graaly_packet_on_send(
        graaly_packet_type_t type,
        graaly_priority_t priority,
        graaly_packet_callback_t callback,
        graaly_packet_binding_t *binding);
graaly_status_t graaly_packet_event_cancelled(graaly_packet_event_t event, bool *out);
graaly_status_t graaly_packet_event_cancelled_write(graaly_packet_event_t event, bool cancelled);
graaly_status_t graaly_packet_event_reencode(graaly_packet_event_t event);
graaly_status_t graaly_packet_event_player(graaly_packet_event_t event, graaly_player_t *out);
graaly_status_t graaly_packet_send(graaly_player_t player, graaly_packet_t packet);
graaly_status_t graaly_packet_send_all(graaly_packet_t packet);
graaly_status_t graaly_packet_receive(graaly_player_t player, graaly_packet_t packet);
graaly_status_t graaly_packet_user(graaly_player_t player, graaly_packet_user_t *out);
graaly_status_t graaly_packet_client_version(graaly_player_t player, graaly_client_version_t *out);
graaly_status_t graaly_packet_ping(graaly_player_t player, int *ping);

graaly_status_t graaly_board_state(
        const char *board,
        graaly_player_t player,
        const char *state_json);
graaly_status_t graaly_board_refresh(const char *board, graaly_player_t player);

size_t graaly_handle_string(graaly_handle_t handle, char *destination, size_t capacity);
void graaly_handle_release(graaly_handle_t handle);

/*
 * Any public Graaly opaque handle has the same single _handle field.
 * These macros are intentionally C-like and require an lvalue / lvalue pointer.
 */
#define graaly_is_valid(value) ((value)._handle != 0u)
#define graaly_cast(type, value) ((type){ ._handle = (value)._handle })
#define graaly_release(pointer) do { \
    if ((pointer) != NULL && (pointer)->_handle != 0u) { \
        graaly_handle_release((pointer)->_handle); \
        (pointer)->_handle = 0u; \
    } \
} while (0)

/* Preferred typed lifetime/text helpers. */
graaly_status_t graaly_object_text(
        graaly_object_t object,
        char *buffer,
        size_t capacity,
        size_t *required);
void graaly_object_release(graaly_object_t *object);
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

typedef void (*graaly_event_callback_t)(graaly_player_t player);
typedef void (*graaly_object_event_callback_t)(graaly_event_t event);
typedef void (*graaly_task_callback_t)(void);
typedef bool (*graaly_command_callback_t)(
        graaly_sender_t sender,
        int argc,
        const graaly_string_view_t *argv);
typedef size_t (*graaly_tab_complete_callback_t)(
        graaly_sender_t sender,
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

/* Preferred typed sender API. */
graaly_status_t graaly_sender_player(graaly_sender_t sender, graaly_player_t *out);
graaly_status_t graaly_sender_has_permission(
        graaly_sender_t sender,
        const char *permission,
        bool *allowed);
void graaly_sender_message(graaly_sender_t sender, const char *message);
void graaly_player_message(graaly_player_t player, const char *message);

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
double graaly__player_health_raw(graaly_player_handle_t player);
int graaly__player_level_raw(graaly_player_handle_t player);

/*
 * Register C function pointers. The SDK stores them in the module and sends
 * only an integer callback id to Java, so Java never sees or dereferences a C
 * function pointer.
 */
#ifdef GRAALY_ENABLE_RAW_ABI
int graaly_callback_register(graaly_callback_t callback);
#endif
int graaly_text_callback_register(graaly_text_callback_t callback);
int graaly_packet_callback_register(graaly_packet_callback_t callback);
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

/*
 * Private helpers used by the generated typed facade.
 * Plugin code should call graaly_player_health(), graaly_world_name(), etc.
 */
graaly_status_t graaly__read_bool(uint64_t target, const char *member, bool *out);
graaly_status_t graaly__read_number(uint64_t target, const char *member, double *out);
graaly_status_t graaly__read_string(
        uint64_t target, const char *member,
        char *buffer, size_t capacity, size_t *required);
graaly_status_t graaly__read_handle(uint64_t target, const char *member, uint64_t *out);
graaly_status_t graaly__write_bool(uint64_t target, const char *member, bool value);
graaly_status_t graaly__write_number(uint64_t target, const char *member, double value);
graaly_status_t graaly__write_string(uint64_t target, const char *member, const char *value);
graaly_status_t graaly__write_handle(uint64_t target, const char *member, uint64_t value);
graaly_status_t graaly__invoke_void(
        uint64_t target, const char *member,
        const graaly__value_t *arguments, size_t argument_count);
graaly_status_t graaly__invoke_bool(
        uint64_t target, const char *member,
        const graaly__value_t *arguments, size_t argument_count, bool *out);
graaly_status_t graaly__invoke_number(
        uint64_t target, const char *member,
        const graaly__value_t *arguments, size_t argument_count, double *out);
graaly_status_t graaly__invoke_string(
        uint64_t target, const char *member,
        const graaly__value_t *arguments, size_t argument_count,
        char *buffer, size_t capacity, size_t *required);
graaly_status_t graaly__invoke_handle(
        uint64_t target, const char *member,
        const graaly__value_t *arguments, size_t argument_count, uint64_t *out);
graaly_status_t graaly__packet_wrap_named(
        const char *wrapper_name,
        uint64_t event_handle,
        uint64_t *out);
graaly_status_t graaly__packet_construct_named(
        const char *wrapper_name,
        const graaly__value_t *arguments,
        size_t argument_count,
        uint64_t *out);

#ifdef __cplusplus
}
#endif

/* Generated canonical names and strongly C-like typed wrappers. */
#include "graaly/catalog.h"
#include "graaly/typed.h"

#endif
