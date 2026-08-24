from __future__ import annotations

from graaly import (
    CommandContext,
    Material,
    PlayerJoinEvent,
    command,
    event,
    info,
    players,
    tab_complete,
    text,
)


@event(PlayerJoinEvent)
def player_join(event: PlayerJoinEvent):
    event.player.send_message(text.color("&dBenvenuto dal plugin Python!"))


@command("pyhello")
def python_hello(context: CommandContext) -> bool:
    name = context.args[0] if context.args else context.sender.name
    context.reply(f"&dCiao {name}, questo plugin gira su GraalPy.")
    return True


@tab_complete("pyhello")
def complete_python_hello(context: CommandContext) -> list[str]:
    return [player.name for player in players.online()]


def on_enable():
    info(f"PythonHello abilitato con {Material.DIAMOND_SWORD.name}")


def on_disable():
    info("PythonHello disabilitato")
