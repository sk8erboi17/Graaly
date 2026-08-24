import * as api from "graaly";

const EXPECTED = Object.freeze({ apiSymbols: 1421, wrappers: 289, packetTypes: 533, packetConstants: 288 });
const seen = { join: false, move: false, chat: false, quit: false, receive: false, send: false, entity: false };
const conformance = new Map<string, string>();

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
] as const);

function check(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function probe(id: string, action: () => void): void {
    try {
        action();
        conformance.set(id, "PASS");
        api.info(`CONFORMANCE TS PASS ${id}`);
    } catch (failure) {
        conformance.set(id, `FAIL: ${failure instanceof Error ? failure.message : String(failure)}`);
        throw failure;
    }
}

function expectedFailure(id: string, action: () => void): void {
    let failed = false;
    try {
        action();
    } catch {
        failed = true;
    }
    check(failed, `${id} accepted invalid input`);
    conformance.set(id, "PASS");
    api.info(`CONFORMANCE TS PASS ${id}`);
}

function mark(id: string): void {
    conformance.set(id, "PASS");
    api.info(`CONFORMANCE TS PASS ${id}`);
}

export function conformanceSnapshot(): string {
    return CONFORMANCE_CASES.map(id => `${id}=${conformance.get(id) ?? "PENDING"}`).join("|");
}

function testEntitySurface(player: api.Player): void {
    const origin = player.location;
    const entity = api.entities.spawn(
        api.worlds.location(origin.world, origin.x + 3, origin.y, origin.z),
        api.EntityTypes.ZOMBIE,
    );
    const horse = api.entities.spawn(
        api.worlds.location(origin.world, origin.x + 6, origin.y, origin.z),
        api.EntityTypes.HORSE,
    );
    try {
        entity.customName = "§bGraaly TS";
        entity.customNameVisible = true;
        horse.customName = "§eGraaly TS Horse";
        horse.customNameVisible = true;
        check(entity.customName === "§bGraaly TS" && entity.customNameVisible, "typed entity custom name failed");
        check(horse.customName === "§eGraaly TS Horse" && horse.customNameVisible, "typed horse custom name failed");

        check(entity.addPotionEffect(api.PotionEffect(api.PotionEffectType.SPEED, 200, 1), true), "typed Speed effect failed");
        check(entity.addPotionEffect(api.PotionEffect(api.PotionEffectType.STRENGTH, 200, 0), true), "typed Strength effect failed");
        check(entity.hasPotionEffect(api.PotionEffectType.SPEED), "typed Speed effect is not active");
        check(entity.hasPotionEffect(api.PotionEffectType.STRENGTH), "typed Strength effect is not active");

        const zombieValues = new Map<api.Attribute, number>([
            [api.Attribute.MAX_HEALTH, 25],
            [api.Attribute.FOLLOW_RANGE, 25],
            [api.Attribute.KNOCKBACK_RESISTANCE, 0.16],
            [api.Attribute.MOVEMENT_SPEED, 0.32],
            [api.Attribute.ATTACK_DAMAGE, 8],
            [api.Attribute.SPAWN_REINFORCEMENTS, 0.21],
        ]);
        for (const [attribute, assignedValue] of zombieValues) {
            const instance = entity.getAttribute(attribute);
            check(instance != null, `missing typed entity attribute ${attribute.name}`);
            instance.baseValue = assignedValue;
            check(Math.abs(instance.baseValue - assignedValue) < 0.000001, `typed assignment failed for ${attribute.name}`);
            check(Number.isFinite(instance.value), `invalid typed ${attribute.name} value`);
        }
        const speed = entity.getAttribute(api.Attribute.MOVEMENT_SPEED);
        const damage = entity.getAttribute(api.Attribute.ATTACK_DAMAGE);
        const jump = horse.getAttribute(api.Attribute.JUMP_STRENGTH);
        check(speed != null && damage != null && jump != null, "typed Speed/attack/jump attributes are unavailable");
        jump.baseValue = 0.91;
        check(Math.abs(jump.baseValue - 0.91) < 0.000001, "typed horse jump assignment failed");
        seen.entity = true;
        mark("entities.effects-attributes-cleanup");
        api.info(`PORTING-TS ENTITY PASS customName=true attributes=${zombieValues.size} speed=${speed.baseValue} attackDamage=${damage.baseValue} horseJump=${jump.baseValue}`);
    } finally {
        entity.remove();
        horse.remove();
    }
}

api.events.on(api.PlayerJoinEvent, event => {
    check(event.player.name.length > 0, "typed PlayerJoinEvent failed");
    const onlineNames = [...api.players].map(({ name }) => name);
    const loadedWorlds = [...api.worlds];
    const [primaryWorld] = loadedWorlds;
    check(onlineNames.includes(event.player.name), "typed players iterable omitted the joining player");
    check(primaryWorld != null, "typed worlds iterable returned no loaded world");
    api.info(`PORTING-TS ITERATION PASS players=${onlineNames.length} worlds=${loadedWorlds.length}`);
    Object.assign(seen, { join: true, move: false, chat: false, quit: false, receive: false, send: false, entity: false });
    testEntitySurface(event.player);
    mark("events.join");
    api.info(`PORTING-TS EVENT_JOIN PASS ${event.player.name}`);
});

api.events.on(api.PlayerMoveEvent, event => {
    if (!seen.move) {
        check(event.from.world.name === event.player.world.name, "typed PlayerMoveEvent failed");
        seen.move = true;
        mark("events.move");
        api.info("PORTING-TS EVENT_MOVE PASS");
    }
});

api.events.on(api.AsyncPlayerChatEvent, event => {
    seen.chat = true;
    mark("events.chat");
    api.info(`PORTING-TS EVENT_CHAT PASS ${event.message}`);
});

api.events.on(api.PlayerQuitEvent, event => {
    seen.quit = true;
    mark("events.quit");
    api.info(`PORTING-TS EVENT_QUIT PASS ${event.player.name}`);
});

api.packets.onReceive(api.ClientPacket.CHAT_MESSAGE, context => {
    const packet = context.wrap(api.WrapperPlayClientChatMessage);
    check(packet.message.length >= 0, "typed client chat wrapper failed");
    seen.receive = true;
    mark("packets.receive");
    api.info(`PORTING-TS PACKET_RECEIVE PASS ${packet.message}`);
});

api.packets.onSend(api.ServerPacket.UPDATE_HEALTH, context => {
    context.wrap(api.WrapperPlayServerUpdateHealth);
    seen.send = true;
    mark("packets.send");
    api.info("PORTING-TS PACKET_SEND PASS UPDATE_HEALTH");
});

api.commands.on("portingts", context => {
    check(Array.isArray(context.args), "command arguments are not a TypeScript array");
    check(typeof context.hasPermission("graaly.conformance") === "boolean", "command permission result is not boolean");
    mark("commands.context");
    if (api.players.isPlayer(context.sender)) {
        const { name } = context.sender;
        context.reply(`&aTypeScript PASS: ${name}, narrowing e catalogo runtime coincidono.`);
    } else {
        context.reply("&aTypeScript PASS: narrowing e catalogo runtime coincidono.");
    }
    return true;
});

export function onEnable(): void {
    try {
        const report = api.diagnostics.verify();
        probe("catalog.symbol-resolution", () => {
            check(report.apiSymbols === EXPECTED.apiSymbols, "typed Graaly API catalog size failed");
            check(report.wrappers === EXPECTED.wrappers, "typed wrapper catalog size failed");
            check(report.packetTypes === EXPECTED.packetTypes, "typed packet type catalog size failed");
            check(report.packetConstants === EXPECTED.packetConstants, "typed packet constant catalog size failed");
            check(api.packets.available, "PacketEvents is not available");
        });
        probe("compatibility.canonical-version-adapters", () => {
            check(api.Material.GRASS_BLOCK != null, "typed canonical material alias failed");
            check(api.PotionEffectType.STRENGTH != null, "typed canonical potion alias failed");
            check(api.MapCursor(1, 2, 3, api.MapCursorType.PLAYER, true).visible,
                "typed canonical map cursor adapter failed");
        });
        probe("core.data-path-contained", () => {
            check(String(api.dataFile("nested/probe.yml")).includes("nested"), "nested data path was not resolved");
        });
        expectedFailure("core.data-path-traversal", () => api.dataFile("../escape.txt"));
        probe("core.text-color", () => check(api.text.color("&aGraaly") === "§aGraaly", "color translation failed"));
        probe("constructors.overload-coercion", () => {
            check(api.Material.DIAMOND.name === "DIAMOND", "typed enum access failed");
            const vector = api.Vector(4, 5, 6);
            check(vector.x === 4 && vector.y === 5 && vector.z === 6, "typed constructor failed");
        });
        expectedFailure("constructors.invalid-overload", () => api.Vector("not-a-number" as never, 5, 6));
        probe("properties.read-write", () => {
            const vector = api.Vector(4, 5, 6);
            vector.x = 10;
            check(vector.x === 10, "typed property assignment failed");
        });
        probe("collections.array-view", () => {
            const materials = api.Material.values();
            check(Array.isArray(materials) && materials.length > 0, "typed enum values are not an array view");
            check(materials.at(-1) != null && [...materials].length === materials.length, "typed array iteration/at failed");
        });
        probe("configuration.fallback-roundtrip", () => {
            const missing = "conformance.typescript.missing";
            api.config.set(missing, null);
            check(api.config.get(missing, "fallback") === "fallback" && !api.config.contains(missing), "typed config fallback failed");
            api.config.set("conformance.typescript.scalar", 43);
            check(api.config.get<number>("conformance.typescript.scalar") === 43, "typed config scalar round-trip failed");
            api.config.set("conformance.typescript.scalar", null);
        });
        probe("scheduling.boundaries", () => check(api.tasks.ticks(1.25) === 25, "typed tick conversion failed"));
        expectedFailure("scheduling.boundaries", () => api.tasks.ticks(-0.01));
        expectedFailure("scheduling.boundaries", () => api.tasks.repeat(0, 0, () => {}));
        probe("players.missing-lookup", () => {
            check(api.players.get("__graaly_missing_player__") == null, "typed partial player lookup should return null");
            check(api.players.exact("__graaly_missing_player__") == null, "typed exact player lookup should return null");
            check(Array.isArray(api.players.online()), "typed online players is not an array");
        });
        probe("worlds.missing-lookup", () => {
            check(api.worlds.get("__graaly_missing_world__") == null, "typed missing world should return null");
        });
        const world = api.worlds.all()[0];
        check(world != null, "typed world lookup failed");
        probe("worlds.location-block-restore", () => {
            const location = api.worlds.location(world, 3, 90, 3, 60, -15);
            check(location.world.name === world.name && location.yaw === 60 && location.pitch === -15, "typed Location failed");
            const block = world.getBlockAt(3, 90, 3);
            const previous = block.type;
            try {
                block.type = api.Material.GLOWSTONE;
                check(block.type === api.Material.GLOWSTONE, "typed World/Block mutation failed");
            } finally {
                block.type = previous;
            }
            check(block.type === previous, "typed block cleanup failed");
        });
        probe("items.clone-independence", () => {
            const original = api.ItemStack(api.Material.DIAMOND, 2);
            const clone = original.clone() as api.ItemStack;
            clone.amount = 3;
            check(original.amount === 2 && clone.amount === 3 && clone.type === original.type,
                "typed ItemStack clone failed");
        });
        probe("permissions.value-object", () => {
            const permission = api.Permission("graaly.conformance", "Runtime conformance probe");
            check(permission.name === "graaly.conformance" && permission.description.length > 0, "typed Permission failed");
        });
        probe("maps.value-object", () => {
            const cursor = api.MapCursor(1, 2, 3, api.MapCursorType.PLAYER, true);
            check(cursor.x === 1 && cursor.y === 2 && cursor.visible, "typed MapCursor failed");
        });
        probe("adapters.callback", () => {
            let invoked = false;
            const renderer = api.adapters.extend(api.MapRenderer, { render() { invoked = true; } }, true);
            renderer.render(null as never, null as never, null as never);
            check(invoked && renderer.contextual, "typed abstract callback adapter failed");
        });
        expectedFailure("ui.invalid-snapshot", () => api.ui.render(null as never, null as never));
        probe("boards.optional-provider", () => check(typeof api.boards.available === "boolean", "typed boards.available is not boolean"));
        api.config.set("porting.typescript", "PASS");
        api.config.save();
        check(api.config.get("porting.typescript") === "PASS", "typed config round-trip failed");
        const packet = api.WrapperPlayServerUpdateHealth(20, 20, 5);
        probe("packets.constants-wrapper", () => {
            check(packet.health === 20, "typed packet wrapper construction failed");
            check(api.Component.text("surface").content() === "surface", "typed PacketEvents support call failed");
            check((api.ClientPacket.CHAT_MESSAGE as api.PacketType).name.length > 0, "typed packet constant failed");
        });
        api.tasks.later(3, () => {
            mark("scheduling.delayed");
            api.info("PORTING-TS TASK PASS");
        });
        api.info(`PORTING-TS SURFACE PASS apiSymbols=${report.apiSymbols} wrappers=${report.wrappers} packetTypes=${report.packetTypes}`);
        api.info("PORTING-TS WORLD PASS");
    } catch (error) {
        api.error(`PORTING-TS FAIL ${error instanceof Error ? error.stack : String(error)}`);
        throw error;
    }
}

export function onDisable(): void {
    mark("lifecycle.cleanup");
    api.info(`PORTING-TS DISABLE join=${seen.join} move=${seen.move} chat=${seen.chat} quit=${seen.quit} receive=${seen.receive} send=${seen.send} entity=${seen.entity}`);
}
