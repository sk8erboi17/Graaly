import {
    boards,
    commands,
    events,
    info,
    PlayerJoinEvent,
    players,
    worlds,
    type BoardMessage,
    type Player,
} from "graaly";

type PanelState = {
    online: number;
    status: string;
};

type TeleportData = {
    destination?: unknown;
};

function publishState(player: Player, status = "Choose an action"): void {
    const state: PanelState = {
        online: players.online().length,
        status,
    };
    boards.state("control-panel", player, state);
}

events.on(PlayerJoinEvent, event => publishState(event.player));

commands.on("boardts", context => {
    if (!players.isPlayer(context.sender)) {
        context.reply("Players only.");
        return true;
    }
    publishState(context.sender, "State refreshed from TypeScript");
    boards.refresh("control-panel", context.sender);
    return true;
});

boards.onMessage("control-panel", (message: BoardMessage<TeleportData>) => {
    if (message.type !== "teleport" || typeof message.data?.destination !== "string") return;
    const viewer = message.player.name ? players.exact(message.player.name) : null;
    const destination = worlds.get(message.data.destination);
    if (!viewer || !destination) return;
    viewer.teleport(destination.spawnLocation);
    publishState(viewer, `Teleported to ${destination.name}`);
});

export function onEnable(): void {
    info(`GraalyBoard TypeScript bridge: ${boards.available ? "ready" : "unavailable"}`);
}
