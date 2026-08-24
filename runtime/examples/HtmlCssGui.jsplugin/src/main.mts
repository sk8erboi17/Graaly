import { commands, players, text, ui, type Player, type UiAction } from "graaly";

const menu = `
<div id="profile" aria-label="Profilo" data-rows="3">
  <style>
    #profile {
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      grid-template-rows: repeat(3, 1fr);
      background: white;
      border: 1px solid black;
      border-radius: 8px;
    }

    .title {
      grid-column: 2 / 9;
      grid-row: 1;
      color: yellow;
      font-weight: bold;
    }

    input {
      grid-column: 3 / 8;
      grid-row: 2;
      background: lightblue;
    }

    #confirm {
      grid-column: 4 / 7;
      grid-row: 3;
      background: lime;
      --minecraft-material: EMERALD_BLOCK;
    }
  </style>

  <span class="title">Configura il profilo</span>
  <input id="player-name" placeholder="Scrivi sul cartello">
  <button id="confirm">Conferma</button>
</div>`;

function openConfirmation(player: Player): void {
    ui.renderHtml(player, `
      <dialog id="save-profile" open aria-label="Sei sicuro?">
        <button id="yes" style="background: lime; --minecraft-material: EMERALD_BLOCK">Sì</button>
        <button id="no" style="background: red; --minecraft-material: REDSTONE_BLOCK">No</button>
      </dialog>
    `, {
        actions: {
            yes: () => player.sendMessage(text.color("&aConfermato.")),
            no: () => player.sendMessage(text.color("&cAnnullato.")),
        },
    });
}

function openMenu(player: Player): void {
    ui.renderHtml(player, menu, {
        actions: {
            "player-name": (action: UiAction) => {
                player.sendMessage(text.color(`&bTesto inserito: &f${action.value ?? ""}`));
            },
            confirm: () => openConfirmation(player),
        },
    });
}

commands.on("htmlgui", context => {
    if (!players.isPlayer(context.sender)) {
        context.reply("&cQuesto comando può essere eseguito solo da un player.");
        return true;
    }
    openMenu(context.sender);
    return true;
});

commands.on("confirmgui", context => {
    if (!players.isPlayer(context.sender)) {
        context.reply("&cQuesto comando può essere eseguito solo da un player.");
        return true;
    }
    openConfirmation(context.sender);
    return true;
});

