import {
    commands,
    events,
    info,
    Material,
    PlayerJoinEvent,
    players,
    text
} from "graaly";

events.on(PlayerJoinEvent, event => {
    event.player.sendMessage(text.color("&bBenvenuto dal plugin TypeScript!"));
});

commands.on("tshello", context => {
    const name = context.args[0] ?? context.sender.name;
    context.reply(`&bCiao ${name}, autocomplete e tipi stanno funzionando.`);
    return true;
});

commands.complete("tshello", () => players.online().map(player => player.name));

export function onEnable(): void {
    info(`TypeScriptHello abilitato con ${Material.DIAMOND_SWORD.name}`);
}

export function onDisable(): void {
    info("TypeScriptHello disabilitato");
}
