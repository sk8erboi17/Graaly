import { ClientPacket, packets } from "graaly";

packets.onReceive(ClientPacket.CHAT_MESSAGE, context => {
    context.cancel();
});

// PacketEvents must observe cancellation before its network callback returns.
// @ts-expect-error async listeners are rejected by Graaly's public contract
packets.onReceive(ClientPacket.CHAT_MESSAGE, async context => {
    context.cancel();
});
