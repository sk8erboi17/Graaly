#include <graaly/graaly.h>

#include <stdio.h>
#include <string.h>

static void marker(const char *value) {
    graaly_log(GRAALY_LOG_INFO, value);
}

static void task_probe(void) {
    marker("GRAALY_MATRIX_C_TASK");

    graaly_world_t worlds[8] = {0};
    size_t world_count = 0u;
    graaly_status_t list_status =
            graaly_world_list(worlds, sizeof worlds / sizeof worlds[0], &world_count);
    if ((list_status != GRAALY_OK && list_status != GRAALY_ERANGE)
            || world_count == 0u
            || !graaly_is_valid(worlds[0])) {
        return;
    }

    graaly_location_t location = {0};
    graaly_entity_type_t zombie = {0};
    graaly_entity_t entity = {0};

    if (graaly_location_make(worlds[0], 0.5, 80.0, 0.5, 0.0, 0.0, &location) == GRAALY_OK
            && graaly_entity_type_find("ZOMBIE", &zombie) == GRAALY_OK
            && graaly_entity_spawn_at(location, zombie, &entity) == GRAALY_OK) {
        marker("GRAALY_MATRIX_C_ENTITY");
        graaly_entity_remove(entity);
    }

    graaly_release(&entity);
    graaly_release(&zombie);
    graaly_release(&location);

    size_t copied = world_count < (sizeof worlds / sizeof worlds[0])
            ? world_count
            : (sizeof worlds / sizeof worlds[0]);
    for (size_t index = 0; index < copied; index++) {
        graaly_release(&worlds[index]);
    }
}

static bool probe_command(
        graaly_sender_t sender,
        int argc,
        const graaly_string_view_t *argv) {
    (void) argc;
    (void) argv;
    marker("GRAALY_MATRIX_C_COMMAND");
    graaly_sender_message(sender, "&aGraaly C matrix command OK");
    return true;
}

void graaly_on_load(void) {
    marker("GRAALY_MATRIX_C_LOAD");
}

void graaly_on_enable(void) {
    marker("GRAALY_MATRIX_C_ENABLE");

    char version[64] = {0};
    size_t required = 0u;
    if (graaly_minecraft_version(version, sizeof version, &required) == GRAALY_OK
            && version[0] != '\0') {
        marker("GRAALY_MATRIX_C_COMPAT");
    }

    graaly_material_t stone = {0};
    char material_name[32] = {0};
    if (graaly_material_find("STONE", &stone) == GRAALY_OK) {
        marker("GRAALY_MATRIX_C_CONSTANTS");
        if (graaly_material_name(
                    stone,
                    material_name,
                    sizeof material_name,
                    &required) == GRAALY_OK
                && strcmp(material_name, "STONE") == 0) {
            marker("GRAALY_MATRIX_C_MEMBER");
        }
    }
    graaly_release(&stone);

    graaly_commands_on("graalycprobe", probe_command);
    graaly_tasks_later(1u, task_probe);
}

void graaly_on_disable(void) {
}
