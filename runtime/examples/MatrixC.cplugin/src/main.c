#include <graaly/graaly.h>

#include <stdio.h>
#include <string.h>

static void marker(const char *value) {
    graaly_log(GRAALY_LOG_INFO, value);
}

static bool handle_text(graaly_value_t value, char *out, size_t capacity) {
    if (value.kind != GRAALY_VALUE_HANDLE || value.a == 0u || capacity == 0u) {
        return false;
    }
    size_t required = graaly_handle_string(value.a, out, capacity);
    return required > 0u && out[0] != '\0';
}

static void release_value(graaly_value_t *value) {
    if (value != NULL && value->kind == GRAALY_VALUE_HANDLE && value->a != 0u) {
        graaly_handle_release(value->a);
        value->a = 0u;
    }
}

static void task_probe(void) {
    marker("GRAALY_MATRIX_C_TASK");

    graaly_value_t worlds = graaly_value_null();
    if (graaly_worlds_all(&worlds) != 0 || worlds.kind != GRAALY_VALUE_HANDLE) {
        return;
    }

    size_t count = 0u;
    if (graaly_collection_size(worlds.a, &count) != 0 || count == 0u) {
        release_value(&worlds);
        return;
    }

    graaly_value_t world = graaly_value_null();
    graaly_value_t location = graaly_value_null();
    graaly_value_t zombie_type = graaly_value_null();
    graaly_value_t entity = graaly_value_null();

    if (graaly_collection_get(worlds.a, 0u, &world) == 0
            && world.kind == GRAALY_VALUE_HANDLE
            && graaly_worlds_location(world.a, 0.5, 80.0, 0.5, 0.0, 0.0, &location) == 0
            && location.kind == GRAALY_VALUE_HANDLE
            && graaly_entities_type("ZOMBIE", &zombie_type) == 0
            && zombie_type.kind == GRAALY_VALUE_HANDLE
            && graaly_entities_spawn(location.a, zombie_type.a, &entity) == 0
            && entity.kind == GRAALY_VALUE_HANDLE) {
        marker("GRAALY_MATRIX_C_ENTITY");
        graaly_entities_remove(entity.a);
    }

    release_value(&entity);
    release_value(&zombie_type);
    release_value(&location);
    release_value(&world);
    release_value(&worlds);
}

static bool probe_command(
        graaly_sender_handle_t sender,
        int argc,
        const graaly_string_view_t *argv) {
    (void) argc;
    (void) argv;
    marker("GRAALY_MATRIX_C_COMMAND");
    graaly_sender_send_message(sender, "&aGraaly C matrix command OK");
    return true;
}

void graaly_on_load(void) {
    marker("GRAALY_MATRIX_C_LOAD");
}

void graaly_on_enable(void) {
    marker("GRAALY_MATRIX_C_ENABLE");

    graaly_value_t version = graaly_value_null();
    char version_text[64] = {0};
    if (graaly_compat_minecraft_version(&version) == 0
            && handle_text(version, version_text, sizeof version_text)) {
        marker("GRAALY_MATRIX_C_COMPAT");
    }
    release_value(&version);

    graaly_value_t stone = graaly_value_null();
    graaly_value_t name = graaly_value_null();
    char stone_text[32] = {0};
    if (graaly_constant(
                GRAALY_NAMESPACE_MATERIAL,
                GRAALY_MATERIAL_STONE,
                &stone) == 0
            && stone.kind == GRAALY_VALUE_HANDLE) {
        marker("GRAALY_MATRIX_C_CONSTANTS");
        if (graaly_get(stone.a, GRAALY_MEMBER_NAME, &name) == 0
                && handle_text(name, stone_text, sizeof stone_text)
                && strcmp(stone_text, "STONE") == 0) {
            marker("GRAALY_MATRIX_C_MEMBER");
        }
    }
    release_value(&name);
    release_value(&stone);

    graaly_commands_on("graalycprobe", probe_command);
    graaly_tasks_later(1u, task_probe);
}

void graaly_on_disable(void) {
}
