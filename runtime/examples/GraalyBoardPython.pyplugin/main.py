import asyncio
from typing import Any

from graaly import BoardMessage, Player, PlayerJoinEvent, boards, command, event, info, players, worlds


def publish_state(player: Player, status: str = "Choose an action") -> None:
    boards.state(
        "control-panel",
        player,
        online=len(players.online()),
        status=status,
    )


@event(PlayerJoinEvent)
def joined(event: Any) -> None:
    publish_state(event.player)


@command("boardpy")
def refresh_board(context: Any) -> bool:
    if not players.is_player(context.sender):
        context.reply("Players only.")
        return True
    publish_state(context.sender, "State refreshed from Python")
    boards.refresh("control-panel", context.sender)
    return True


@boards.on_message("control-panel")
async def board_message(message: BoardMessage) -> None:
    await asyncio.sleep(0)
    if message.type != "teleport" or not isinstance(message.data, dict):
        return
    destination_name = message.data.get("destination")
    player_name = message.player.get("name")
    if not isinstance(destination_name, str) or not isinstance(player_name, str):
        return
    viewer = players.exact(player_name)
    destination = worlds.get(destination_name)
    if viewer is None or destination is None:
        return
    viewer.teleport(destination.spawn_location)
    publish_state(viewer, f"Teleported to {destination.name}")


def on_enable() -> None:
    info(f"GraalyBoard Python bridge: {'ready' if boards.available else 'unavailable'}")
