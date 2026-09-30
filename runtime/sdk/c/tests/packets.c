#include <graaly/packets.h>

static void on_chat(graaly_packet_event_t event) {
    graaly_pe_wrapper_play_client_chat_message_t chat = {0};
    if (graaly_pe_wrapper_play_client_chat_message__from_event(event, &chat) != GRAALY_OK) {
        return;
    }

    char message[256] = {0};
    size_t required = 0u;
    if (graaly_pe_wrapper_play_client_chat_message__message(
                chat, message, sizeof message, &required) == GRAALY_OK) {
        graaly_pe_wrapper_play_client_chat_message__message_write(chat, message);
    }
    graaly_release(&chat);
}

void packet_api(graaly_packet_type_t type) {
    bool available = false;
    char version[64] = {0};
    size_t required = 0u;
    graaly_packet_available(&available);
    if (available) graaly_packet_version(version, sizeof version, &required);
    graaly_packet_binding_t binding = {0};
    graaly_packet_on_receive(type, GRAALY_PRIORITY_NORMAL, on_chat, &binding);
    graaly_release(&binding);
}
