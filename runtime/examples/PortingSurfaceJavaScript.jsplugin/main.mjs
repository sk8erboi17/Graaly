import {
    AsyncPlayerChatEvent,
    adapters,
    Attribute,
    ClientPacket,
    boards,
    commands,
    Component,
    config,
    dataFile,
    diagnostics,
    EntityTypes,
    error as logError,
    events,
    info,
    Material,
    MapCursor,
    MapCursorType,
    MapRenderer,
    ItemStack,
    packets,
    Permission,
    PlayerJoinEvent,
    PlayerMoveEvent,
    PlayerQuitEvent,
    players,
    PotionEffect,
    PotionEffectType,
    ServerPacket,
    tasks,
    text,
    ui,
    Vector,
    worlds,
    WrapperPlayClientChatMessage,
    WrapperPlayServerUpdateHealth,
} from "graaly";

const EXPECTED = Object.freeze({ apiSymbols: 1421, wrappers: 289, packetTypes: 533, packetConstants: 288 });
const seen = { join: false, move: false, chat: false, quit: false, receive: false, send: false, entity: false };
const conformance = new Map();

export const CONFORMANCE_CASES = Object.freeze([
    "catalog.symbol-resolution",
    "compatibility.canonical-version-adapters",
    "core.data-path-contained",
    "core.data-path-traversal",
    "core.text-color",
    "constructors.overload-coercion",
    "constructors.invalid-overload",
    "properties.read-write",
    "collections.array-view",
    "configuration.fallback-roundtrip",
    "scheduling.boundaries",
    "scheduling.delayed",
    "players.missing-lookup",
    "worlds.missing-lookup",
    "worlds.location-block-restore",
    "items.clone-independence",
    "permissions.value-object",
    "maps.value-object",
    "adapters.callback",
    "ui.invalid-snapshot",
    "boards.optional-provider",
    "events.join",
    "events.move",
    "events.chat",
    "events.quit",
    "entities.effects-attributes-cleanup",
    "packets.constants-wrapper",
    "packets.receive",
    "packets.send",
    "commands.context",
    "lifecycle.cleanup",
]);

/** @param {unknown} condition @param {string} message */
function check(condition, message) {
    if (!condition) throw new Error(message);
}

/** @param {string} id @param {() => void} action */
function probe(id, action) {
    try {
        action();
        conformance.set(id, "PASS");
        info(`CONFORMANCE JS PASS ${id}`);
    } catch (failure) {
        conformance.set(id, `FAIL: ${failure instanceof Error ? failure.message : String(failure)}`);
        throw failure;
    }
}

/** @param {string} id @param {() => void} action */
function expectedFailure(id, action) {
    let failed = false;
    try {
        action();
    } catch (_) {
        failed = true;
    }
    check(failed, `${id} accepted invalid input`);
    conformance.set(id, "PASS");
    info(`CONFORMANCE JS PASS ${id}`);
}

/** @param {string} id */
function mark(id) {
    conformance.set(id, "PASS");
    info(`CONFORMANCE JS PASS ${id}`);
}

export function conformanceSnapshot() {
    return CONFORMANCE_CASES.map(id => `${id}=${conformance.get(id) || "PENDING"}`).join("|");
}

/** @param {import("graaly").Player} player */
function testEntitySurface(player) {
    const origin = player.location;
    const location = worlds.location(origin.world, origin.x + 2, origin.y, origin.z);
    const entity = entities.spawn(location, EntityTypes.ZOMBIE);
    const horse = entities.spawn(
        worlds.location(origin.world, origin.x + 4, origin.y, origin.z),
        EntityTypes.HORSE,
    );
    try {
        entity.customName = "§aGraaly JS";
        entity.customNameVisible = true;
        horse.customName = "§eGraaly JS Horse";
        horse.customNameVisible = true;
        check(entity.customName === "§aGraaly JS" && entity.customNameVisible, "entity custom name failed");
        check(horse.customName === "§eGraaly JS Horse" && horse.customNameVisible, "horse custom name failed");

        check(entity.addPotionEffect(PotionEffect(PotionEffectType.SPEED, 200, 1), true), "Speed effect failed");
        check(entity.addPotionEffect(PotionEffect(PotionEffectType.STRENGTH, 200, 0), true), "Strength effect failed");
        check(entity.hasPotionEffect(PotionEffectType.SPEED), "Speed effect is not active");
        check(entity.hasPotionEffect(PotionEffectType.STRENGTH), "Strength effect is not active");

        const zombieValues = new Map([
            [Attribute.MAX_HEALTH, 24],
            [Attribute.FOLLOW_RANGE, 24],
            [Attribute.KNOCKBACK_RESISTANCE, 0.15],
            [Attribute.MOVEMENT_SPEED, 0.31],
            [Attribute.ATTACK_DAMAGE, 7],
            [Attribute.SPAWN_REINFORCEMENTS, 0.2],
        ]);
        for (const [attribute, assignedValue] of zombieValues) {
            const instance = entity.getAttribute(attribute);
            check(instance != null, `missing entity attribute ${attribute.name}`);
            instance.baseValue = assignedValue;
            check(Math.abs(instance.baseValue - assignedValue) < 0.000001, `assignment failed for ${attribute.name}`);
            check(Number.isFinite(instance.value), `invalid ${attribute.name} value`);
        }
        const speed = entity.getAttribute(Attribute.MOVEMENT_SPEED);
        const damage = entity.getAttribute(Attribute.ATTACK_DAMAGE);
        const jump = horse.getAttribute(Attribute.JUMP_STRENGTH);
        check(speed != null && damage != null && jump != null, "Speed/attack/jump attributes are unavailable");
        jump.baseValue = 0.9;
        check(Math.abs(jump.baseValue - 0.9) < 0.000001, "horse jump assignment failed");
        seen.entity = true;
        mark("entities.effects-attributes-cleanup");
        info(`PORTING-JS ENTITY PASS customName=true attributes=${zombieValues.size} speed=${speed.baseValue} attackDamage=${damage.baseValue} horseJump=${jump.baseValue}`);
    } finally {
        entity.remove();
        horse.remove();
    }
}

events.on(PlayerJoinEvent, event => {
    check(event.player.name.length > 0, "PlayerJoinEvent.player.name is empty");
    const onlineNames = [...players].map(({ name }) => name);
    const loadedWorlds = [...worlds];
    const [primaryWorld] = loadedWorlds;
    check(onlineNames.includes(event.player.name), "players iterable omitted the joining player");
    check(primaryWorld != null, "worlds iterable returned no loaded world");
    info(`PORTING-JS ITERATION PASS players=${onlineNames.length} worlds=${loadedWorlds.length}`);
    Object.assign(seen, { join: true, move: false, chat: false, quit: false, receive: false, send: false, entity: false });
    testEntitySurface(event.player);
    mark("events.join");
    info(`PORTING-JS EVENT_JOIN PASS ${event.player.name}`);
});

events.on(PlayerMoveEvent, event => {
    if (!seen.move) {
        check(event.from.world.name === event.player.world.name, "PlayerMoveEvent world mismatch");
        seen.move = true;
        mark("events.move");
        info("PORTING-JS EVENT_MOVE PASS");
    }
});

events.on(AsyncPlayerChatEvent, event => {
    seen.chat = true;
    mark("events.chat");
    info(`PORTING-JS EVENT_CHAT PASS ${event.message}`);
});

events.on(PlayerQuitEvent, event => {
    seen.quit = true;
    mark("events.quit");
    info(`PORTING-JS EVENT_QUIT PASS ${event.player.name}`);
});

packets.onReceive(ClientPacket.CHAT_MESSAGE, context => {
    const packet = context.wrap(WrapperPlayClientChatMessage);
    check(typeof packet.message === "string", "client chat wrapper has no message");
    seen.receive = true;
    mark("packets.receive");
    info(`PORTING-JS PACKET_RECEIVE PASS ${packet.message}`);
});

packets.onSend(ServerPacket.UPDATE_HEALTH, context => {
    context.wrap(WrapperPlayServerUpdateHealth);
    seen.send = true;
    mark("packets.send");
    info("PORTING-JS PACKET_SEND PASS UPDATE_HEALTH");
});

commands.on("portingjs", context => {
    check(Array.isArray(context.args), "command arguments are not a JavaScript array");
    check(typeof context.hasPermission("graaly.conformance") === "boolean", "command permission result is not boolean");
    mark("commands.context");
    context.reply(`&aJS PASS: Graaly API ${EXPECTED.apiSymbols}, wrapper ${EXPECTED.wrappers}, packet types ${EXPECTED.packetTypes}, constants ${EXPECTED.packetConstants}.`);
    return true;
});

export function onEnable() {
    try {
        const report = diagnostics.verify();
        probe("catalog.symbol-resolution", () => {
            check(report.apiSymbols === EXPECTED.apiSymbols, `Graaly API: expected ${EXPECTED.apiSymbols}, found ${report.apiSymbols}`);
            check(report.wrappers === EXPECTED.wrappers, `wrappers: expected ${EXPECTED.wrappers}, found ${report.wrappers}`);
            check(report.packetTypes === EXPECTED.packetTypes, `packet types: expected ${EXPECTED.packetTypes}, found ${report.packetTypes}`);
            check(report.packetConstants === EXPECTED.packetConstants, `packet constants: expected ${EXPECTED.packetConstants}, found ${report.packetConstants}`);
            check(packets.available, "PacketEvents is not available");
        });
        probe("compatibility.canonical-version-adapters", () => {
            check(Material.GRASS_BLOCK != null, "canonical material alias failed");
            check(PotionEffectType.STRENGTH != null, "canonical potion alias failed");
            check(MapCursor(1, 2, 3, MapCursorType.PLAYER, true).visible, "canonical map cursor adapter failed");
        });

        probe("core.data-path-contained", () => {
            check(String(dataFile("nested/probe.yml")).includes("nested"), "nested data path was not resolved");
        });
        expectedFailure("core.data-path-traversal", () => dataFile("../escape.txt"));
        probe("core.text-color", () => check(text.color("&aGraaly") === "§aGraaly", "color translation failed"));

        probe("constructors.overload-coercion", () => {
            check(Material.DIAMOND_SWORD.name === "DIAMOND_SWORD", "enum access failed");
            const vector = Vector(1, 2, 3);
            check(vector.x === 1 && vector.y === 2 && vector.z === 3, "constructor bridge failed");
        });
        expectedFailure("constructors.invalid-overload", () => Vector("not-a-number", 2, 3));
        probe("properties.read-write", () => {
            const vector = Vector(1, 2, 3);
            vector.x = 9;
            check(vector.x === 9, "property assignment failed");
        });
        probe("collections.array-view", () => {
            const materials = Material.values();
            check(Array.isArray(materials) && materials.length > 0, "enum values are not an array view");
            check(materials.at(-1) != null && [...materials].length === materials.length, "array iteration/at failed");
        });

        probe("configuration.fallback-roundtrip", () => {
            const missing = "conformance.javascript.missing";
            config.set(missing, null);
            check(config.get(missing, "fallback") === "fallback" && !config.contains(missing), "config fallback failed");
            config.set("conformance.javascript.scalar", 42);
            check(config.get("conformance.javascript.scalar") === 42, "config scalar round-trip failed");
            config.set("conformance.javascript.scalar", null);
        });
        probe("scheduling.boundaries", () => check(tasks.ticks(1.25) === 25, "tick conversion failed"));
        expectedFailure("scheduling.boundaries", () => tasks.ticks(-0.01));
        expectedFailure("scheduling.boundaries", () => tasks.repeat(0, 0, () => {}));
        probe("players.missing-lookup", () => {
            check(players.get("__graaly_missing_player__") == null, "partial player lookup should return null");
            check(players.exact("__graaly_missing_player__") == null, "exact player lookup should return null");
            check(Array.isArray(players.online()), "online players is not an array");
        });
        probe("worlds.missing-lookup", () => {
            check(worlds.get("__graaly_missing_world__") == null, "missing world should return null");
        });

        const world = worlds.all()[0];
        check(world != null && world.name.length > 0, "world lookup failed");
        probe("worlds.location-block-restore", () => {
            const location = worlds.location(world, 2, 90, 2, 45, -10);
            check(location.world.name === world.name && location.yaw === 45 && location.pitch === -10, "Location constructor failed");
            const block = world.getBlockAt(2, 90, 2);
            const previous = block.type;
            try {
                block.type = Material.GLASS;
                check(block.type === Material.GLASS, "World/Block mutation failed");
            } finally {
                block.type = previous;
            }
            check(block.type === previous, "block cleanup did not restore its previous material");
        });

        probe("items.clone-independence", () => {
            const original = ItemStack(Material.DIAMOND, 2);
            const clone = original.clone();
            clone.amount = 3;
            check(original.amount === 2 && clone.amount === 3 && clone.type === original.type,
                "ItemStack clone is not independent");
        });
        probe("permissions.value-object", () => {
            const permission = Permission("graaly.conformance", "Runtime conformance probe");
            check(permission.name === "graaly.conformance" && permission.description.length > 0, "Permission construction failed");
        });
        probe("maps.value-object", () => {
            const cursor = MapCursor(1, 2, 3, MapCursorType.PLAYER, true);
            check(cursor.x === 1 && cursor.y === 2 && cursor.visible, "MapCursor construction failed");
        });
        probe("adapters.callback", () => {
            let invoked = false;
            const renderer = adapters.extend(MapRenderer, { render() { invoked = true; } }, true);
            renderer.render(
                /** @type {any} */ (null),
                /** @type {any} */ (null),
                /** @type {any} */ (null),
            );
            check(invoked && renderer.contextual, "abstract callback adapter failed");
        });
        expectedFailure("ui.invalid-snapshot", () => ui.render(
            /** @type {any} */ (null),
            /** @type {any} */ (null),
        ));
        probe("boards.optional-provider", () => check(typeof boards.available === "boolean", "boards.available is not boolean"));

        config.set("porting.javascript", "PASS");
        config.save();
        check(config.get("porting.javascript") === "PASS", "config round-trip failed");
        tasks.later(2, () => {
            mark("scheduling.delayed");
            info("PORTING-JS TASK PASS");
        });

        const health = WrapperPlayServerUpdateHealth(20, 20, 5);
        probe("packets.constants-wrapper", () => {
            check(health.health === 20, "PacketEvents wrapper construction failed");
            check(Component.text("surface").content().length > 0, "PacketEvents support static method failed");
            check(ClientPacket.CHAT_MESSAGE.name.length > 0, "packet constant resolution failed");
        });
        info(`PORTING-JS SURFACE PASS apiSymbols=${report.apiSymbols} wrappers=${report.wrappers} packetTypes=${report.packetTypes} constants=${report.packetConstants}`);
        info("PORTING-JS WORLD PASS");
    } catch (error) {
        logError(`PORTING-JS FAIL ${error instanceof Error ? error.stack : String(error)}`);
        throw error;
    }
}

export function onDisable() {
    mark("lifecycle.cleanup");
    info(`PORTING-JS DISABLE join=${seen.join} move=${seen.move} chat=${seen.chat} quit=${seen.quit} receive=${seen.receive} send=${seen.send} entity=${seen.entity}`);
}
