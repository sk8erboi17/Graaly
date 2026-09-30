#include <graaly/packets.h>
#include <stdio.h>
#include <string.h>

/* docs:packet-thread-handoff:start */
/* Graaly serializes calls into this Wasm instance. Queue copied data, not callback handles. */
typedef struct Notice { char player_name[32]; char message[256]; } Notice;
static Notice notices[16];
static size_t notice_count;

static void flush_notices(void) {
    while (notice_count != 0u) {
        Notice notice = notices[--notice_count];
        graaly_player_t player = {0};
        if (graaly_player_find_exact(notice.player_name, &player) == GRAALY_OK) {
            graaly_player_message(player, notice.message); /* server thread */
            graaly_release(&player);
        }
    }
}

static void queue_notice(graaly_packet_event_t event, const char *message) {
    if (notice_count == sizeof notices / sizeof notices[0]) return; /* bounded queue */
    graaly_player_t player = {0};
    if (graaly_packet_event_player(event, &player) != GRAALY_OK) return;
    Notice *notice = &notices[notice_count];
    size_t required = 0u;
    graaly_status_t status = graaly_player_name(player, notice->player_name, sizeof notice->player_name, &required);
    graaly_release(&player);
    if (status != GRAALY_OK || required >= sizeof notice->player_name) return;
    snprintf(notice->message, sizeof notice->message, "C packet notice: %.230s", message);
    ++notice_count;
    if (notice_count == 1u && graaly_tasks_run(flush_notices) < 0) notice_count = 0u;
}
/* docs:packet-thread-handoff:end */

/* docs:wrap-read-change:start */
static void on_chat(graaly_packet_event_t event) {
    graaly_pe_wrapper_play_client_chat_message_t chat = {0};
    if (graaly_pe_wrapper_play_client_chat_message__from_event(event, &chat) != GRAALY_OK) return;
    char message[256] = {0};
    size_t required = 0u;
    if (graaly_pe_wrapper_play_client_chat_message__message(chat, message, sizeof message, &required) != GRAALY_OK
            || required >= sizeof message) {
        graaly_release(&chat);
        return;
    }
    size_t begin = 0u;
    size_t end = strlen(message);
    while (begin < end && message[begin] == ' ') ++begin;
    while (end > begin && message[end - 1u] == ' ') --end;
    memmove(message, message + begin, end - begin);
    message[end - begin] = '\0';
    if (strcmp(message, "stop") == 0) {
        graaly_packet_event_cancelled_write(event, true);
    } else if (graaly_pe_wrapper_play_client_chat_message__message_write(chat, message) == GRAALY_OK) {
        graaly_packet_event_reencode(event);
        queue_notice(event, message);
    }
    graaly_release(&chat);
}
/* docs:wrap-read-change:end */

/* docs:listen-send:start */
static graaly_packet_binding_t send_binding = {0};
static void on_health(graaly_packet_event_t event) {
    graaly_pe_wrapper_play_server_update_health_t packet = {0};
    if (graaly_pe_wrapper_play_server_update_health__from_event(event, &packet) != GRAALY_OK) return;
    double health = 0.0;
    if (graaly_pe_wrapper_play_server_update_health__health(packet, &health) == GRAALY_OK) {
        char note[80];
        snprintf(note, sizeof note, "Outgoing client health: %.1f", health);
        graaly_log(GRAALY_LOG_INFO, note);
    }
    graaly_release(&packet);
}

static void listen_outgoing(void) {
    graaly_packet_type_t type = {0};
    if (graaly_packet_type_find("Play.Server.UPDATE_HEALTH", &type) != GRAALY_OK) return;
    graaly_packet_on_send(type, GRAALY_PRIORITY_NORMAL, on_health, &send_binding);
    graaly_release(&type);
}
/* docs:listen-send:end */

/* docs:send-packet:start */
static bool send_health(graaly_sender_t sender, int argc, const graaly_string_view_t *argv) {
    (void) argc;
    (void) argv;
    graaly_player_t player = {0};
    if (graaly_sender_player(sender, &player) != GRAALY_OK) return false;
    graaly_pe_wrapper_play_server_update_health_t packet = {0};
    if (graaly_pe_wrapper_play_server_update_health__new(20.0, 20.0, 5.0, &packet) == GRAALY_OK) {
        /* Client display only: this does not change the server's player health. */
        graaly_packet_send(player, graaly_cast(graaly_packet_t, packet));
        graaly_release(&packet);
    }
    graaly_release(&player);
    return true;
}
/* docs:send-packet:end */

/* docs:packet-player-info:start */
static bool player_info(graaly_sender_t sender, int argc, const graaly_string_view_t *argv) {
    (void) argc;
    (void) argv;
    graaly_player_t player = {0};
    if (graaly_sender_player(sender, &player) != GRAALY_OK) return false;
    graaly_packet_user_t user = {0};
    graaly_client_version_t version = {0};
    int ping = 0;
    if (graaly_packet_user(player, &user) == GRAALY_OK
            && graaly_packet_client_version(player, &version) == GRAALY_OK
            && graaly_packet_ping(player, &ping) == GRAALY_OK) {
        char name[80] = {0};
        size_t required = 0u;
        graaly_object_text(graaly_cast(graaly_object_t, version), name, sizeof name, &required);
        char message[140];
        snprintf(message, sizeof message, "Client version: %s | ping: %d ms", name, ping);
        graaly_sender_message(sender, message);
    }
    graaly_release(&version);
    graaly_release(&user);
    graaly_release(&player);
    return true;
}
/* docs:packet-player-info:end */

/* docs:packet-availability:start */
static bool packet_ready(void) {
    bool available = false;
    if (graaly_packet_available(&available) != GRAALY_OK || !available) {
        graaly_log(GRAALY_LOG_WARNING, "PacketEvents is unavailable");
        return false;
    }
    char version[64] = {0};
    size_t required = 0u;
    if (graaly_packet_version(version, sizeof version, &required) == GRAALY_OK) {
        graaly_log(GRAALY_LOG_INFO, version);
    }
    return true;
}
/* docs:packet-availability:end */

/* docs:receive-packet:start */
static graaly_packet_binding_t receive_binding = {0};
static void listen_chat(void) {
    graaly_packet_type_t type = {0};
    if (graaly_packet_type_find("Play.Client.CHAT_MESSAGE", &type) != GRAALY_OK) return;
    graaly_packet_on_receive(type, GRAALY_PRIORITY_NORMAL, on_chat, &receive_binding);
    graaly_release(&type);
}
/* The runtime unregisters this plugin's listeners during disable/reload. */
/* docs:receive-packet:end */

void graaly_on_enable(void) {
    if (!packet_ready()) return;
    listen_chat();
    listen_outgoing();
    graaly_commands_on("cpackethealth", send_health);
    graaly_commands_on("cpacketinfo", player_info);
}

void graaly_on_disable(void) {
    notice_count = 0u;
    graaly_release(&receive_binding);
    graaly_release(&send_binding);
}
