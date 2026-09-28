#include <graaly/graaly.h>

void core_api(graaly_player_t player, graaly_sender_t sender) {
    double health = 0.0;
    bool allowed = false;
    char name[32] = {0};
    size_t required = 0u;

    graaly_player_health(player, &health);
    graaly_player_health_write(player, health);
    graaly_player_name(player, name, sizeof name, &required);
    graaly_player_has_permission(player, "graaly.test", &allowed);
    graaly_player_message(player, "typed");
    graaly_sender_has_permission(sender, "graaly.test", &allowed);

    graaly_location_t location = {0};
    graaly_player_location(player, &location);
    graaly_release(&location);
}
