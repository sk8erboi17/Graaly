import {
    ClientPacket,
    commands,
    Component,
    info,
    packets,
    players,
    tasks,
    text,
    WrapperPlayClientChatMessage,
    WrapperPlayServerSystemChatMessage,
    WrapperPlayServerUpdateHealth,
} from "graaly";

packets.onReceive(ClientPacket.CHAT_MESSAGE, context => {
    const packet = context.wrap(WrapperPlayClientChatMessage);
    if (packet.message.toLowerCase() === "show packet") {
        context.cancel();
        // Packet callbacks run on a network thread: return to the server's main thread.
        tasks.run(() => context.player?.sendMessage(
            text.color(`&aIntercepted ${context.packetName} with GraalJS`)
        ));
    }
});

commands.on("packethealthjs", context => {
    if (!players.isPlayer(context.sender)) {
        context.reply("&cThis command can only be used by a player.");
        return true;
    }
    const packet = WrapperPlayServerUpdateHealth(20, 20, 5);
    packets.send(context.sender, packet);
    packets.send(context.sender, WrapperPlayServerSystemChatMessage(
        false,
        Component.text("PacketEvents support types are native JavaScript symbols")
    ));
    context.reply("&aCustom health packet sent.");
    return true;
});

export function onEnable() {
    const probe = WrapperPlayServerUpdateHealth(20, 20, 5);
    if (probe.health !== 20) throw new Error("PacketEvents wrapper self-test failed");
    info(`PacketEvents ${packets.version} ready for JavaScript`);
}
