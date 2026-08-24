from graaly import CommandContext, Player, UiAction, command, players, text, ui


MENU = """
<div id="python-profile" aria-label="Profilo Python" data-rows="3">
  <style>
    #python-profile {
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      grid-template-rows: repeat(3, 1fr);
      background: white;
      border: 1px solid black;
      border-radius: 8px;
    }
    span { grid-column: 2 / 9; grid-row: 1; color: yellow; font-weight: bold; }
    input { grid-column: 3 / 8; grid-row: 2; background: lightblue; }
    button { grid-column: 4 / 7; grid-row: 3; --minecraft-material: EMERALD_BLOCK; }
  </style>
  <span>Configura il profilo</span>
  <input id="player-name" placeholder="Scrivi sul cartello">
  <button id="confirm">Conferma</button>
</div>
"""


def open_confirmation(player: Player) -> None:
    markup = """
    <dialog id="save-profile" open aria-label="Sei sicuro?">
      <button id="yes" style="background: lime">Sì</button>
      <button id="no" style="background: red">No</button>
    </dialog>
    """
    ui.render_html(
        player,
        markup,
        actions={
            "yes": lambda _action: player.send_message(text.color("&aConfermato.")),
            "no": lambda _action: player.send_message(text.color("&cAnnullato.")),
        },
    )


def open_menu(player: Player) -> None:
    def submitted(action: UiAction) -> None:
        player.send_message(text.color(f"&bTesto inserito: &f{action.value or ''}"))

    ui.render_html(
        player,
        MENU,
        actions={"player-name": submitted, "confirm": lambda _action: open_confirmation(player)},
    )


@command("pyhtmlgui")
def html_gui(context: CommandContext) -> bool:
    if not players.is_player(context.sender):
        context.reply("&cQuesto comando può essere eseguito solo da un player.")
        return True
    open_menu(context.sender)
    return True
