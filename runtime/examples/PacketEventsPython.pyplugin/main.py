from __future__ import annotations

from graaly import (
    ClientPacket,
    CommandContext,
    Component,
    PacketContext,
    Player,
    WrapperPlayClientChatMessage,
    WrapperPlayServerSystemChatMessage,
    WrapperPlayServerUpdateHealth,
    command,
    info,
    packets,
    players,
    tasks,
    text,
)


async def notify_intercepted_chat(player: Player, packet_name: str) -> None:
    # This coroutine is advanced by Graaly on Bukkit's main thread.
    player.send_message(text.color(
        f"&aIntercepted {packet_name} with GraalPy"
    ))


@packets.listen_receive(ClientPacket.CHAT_MESSAGE)
def intercept_chat(context: PacketContext) -> None:
    packet = context.wrap(WrapperPlayClientChatMessage)
    if packet.message.lower() == "show packet":
        context.cancel()
        player = context.player
        if player is None:
            return
        # Read packet data synchronously, then start Bukkit work as a coroutine.
        tasks.create_task(
            notify_intercepted_chat(player, context.packet_name),
            name="notify-intercepted-chat",
        )


@command("packethealthpy")
def send_health(context: CommandContext) -> bool:
    if not players.is_player(context.sender):
        context.reply("&cThis command can only be used by a player.")
        return True
    packet = WrapperPlayServerUpdateHealth(20, 20, 5)
    packets.send(context.sender, packet)
    packets.send(context.sender, WrapperPlayServerSystemChatMessage(
        False,
        Component.text("PacketEvents support types are native Python symbols"),
    ))
    context.reply("&aCustom health packet sent.")
    return True


def on_enable() -> None:
    probe = WrapperPlayServerUpdateHealth(20, 20, 5)
    if probe.health != 20:
        raise RuntimeError("PacketEvents wrapper self-test failed")
    info(f"PacketEvents {packets.version} ready for Python")
