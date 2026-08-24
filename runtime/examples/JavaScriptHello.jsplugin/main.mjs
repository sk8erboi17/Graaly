import { commands, events, info, Material, PlayerJoinEvent, players, text } from "graaly";

events.on(PlayerJoinEvent, event => {
    event.player.sendMessage(text.color("&aBenvenuto su Graaly!"));
});

commands.on("jshello", context => {
    const name = context.args[0] ?? context.sender.name;
    context.reply(`&aCiao ${name}, questo plugin gira su GraalJS.`);
    return true;
});

commands.complete("jshello", () =>
    players.online().map(player => player.name)
);

export function onEnable() {
    info(`JavaScriptHello abilitato con ${Material.DIAMOND_SWORD.name}`);
}

export function onDisable() {
    info("JavaScriptHello disabilitato");
}
