import {
    commands,
    ClientPacket,
    Component,
    info,
    packets,
    players,
    tasks,
    text,
    WrapperPlayClientChatMessage,
    WrapperPlayServerSystemChatMessage,
    WrapperPlayServerUpdateHealth
} from "graaly";

packets.onReceive(ClientPacket.CHAT_MESSAGE, context => {
    const packet = context.wrap(WrapperPlayClientChatMessage);
    if (packet.message.toLowerCase() === "show packet") {
        context.cancel();
        tasks.run(() => context.player?.sendMessage(
            text.color(`&aIntercepted ${context.packetName} with TypeScript`)
        ));
    }
});

commands.on("packethealthts", context => {
    if (!players.isPlayer(context.sender)) {
        context.reply("&cThis command can only be used by a player.");
        return true;
    }
    const packet = WrapperPlayServerUpdateHealth(20, 20, 5);
    packets.send(context.sender, packet);
    packets.send(context.sender, WrapperPlayServerSystemChatMessage(
        false,
        Component.text("PacketEvents support types are native TypeScript symbols")
    ));
    context.reply("&aCustom health packet sent.");
    return true;
});

export function onEnable(): void {
    const probe = WrapperPlayServerUpdateHealth(20, 20, 5);
    if (probe.health !== 20) throw new Error("PacketEvents wrapper self-test failed");
    info(`PacketEvents ${packets.version} ready for TypeScript`);
}
