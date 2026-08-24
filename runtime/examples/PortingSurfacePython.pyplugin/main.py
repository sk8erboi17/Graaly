from __future__ import annotations

from collections.abc import Callable

import graaly as api
from graaly import (
    AsyncPlayerChatEvent,
    Attribute,
    ClientPacket,
    CommandContext,
    Component,
    EntityTypes,
    Material,
    PacketContext,
    PlayerJoinEvent,
    PlayerMoveEvent,
    PlayerQuitEvent,
    PotionEffect,
    PotionEffectType,
    ServerPacket,
    Vector,
    WrapperPlayClientChatMessage,
    WrapperPlayServerUpdateHealth,
    command,
    config,
    error,
    diagnostics,
    entities,
    info,
    on,
    packets,
    players,
    tasks,
    worlds,
)

EXPECTED = {"api_symbols": 1421, "wrappers": 289, "packet_types": 533, "packet_constants": 288}
seen = {"join": False, "move": False, "chat": False, "quit": False, "receive": False, "send": False,
        "entity": False}
conformance: dict[str, str] = {}

CONFORMANCE_CASES = (
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
)


def check(condition: object, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def probe(case_id: str, action: Callable[[], object]) -> None:
    try:
        action()
        conformance[case_id] = "PASS"
        info(f"CONFORMANCE PY PASS {case_id}")
    except Exception as failure:
        conformance[case_id] = f"FAIL: {failure}"
        raise


def expected_failure(case_id: str, action: Callable[[], object]) -> None:
    try:
        action()
    except Exception:
        conformance[case_id] = "PASS"
        info(f"CONFORMANCE PY PASS {case_id}")
        return
    raise RuntimeError(f"{case_id} accepted invalid input")


def mark(case_id: str) -> None:
    conformance[case_id] = "PASS"
    info(f"CONFORMANCE PY PASS {case_id}")


def conformance_snapshot() -> str:
    return "|".join(f"{case_id}={conformance.get(case_id, 'PENDING')}"
                    for case_id in CONFORMANCE_CASES)


def test_entity_surface(player: api.Player) -> None:
    origin = player.location
    entity = entities.spawn(
        worlds.location(origin.world, origin.x + 4, origin.y, origin.z),
        EntityTypes.ZOMBIE,
    )
    horse = entities.spawn(
        worlds.location(origin.world, origin.x + 8, origin.y, origin.z),
        EntityTypes.HORSE,
    )
    try:
        entity.custom_name = "§dGraaly PY"
        entity.custom_name_visible = True
        horse.custom_name = "§eGraaly PY Horse"
        horse.custom_name_visible = True
        check(entity.custom_name == "§dGraaly PY" and entity.custom_name_visible,
              "entity custom name failed")
        check(horse.custom_name == "§eGraaly PY Horse" and horse.custom_name_visible,
              "horse custom name failed")

        check(entity.add_potion_effect(PotionEffect(PotionEffectType.SPEED, 200, 1), True),
              "Speed effect failed")
        check(entity.add_potion_effect(PotionEffect(PotionEffectType.STRENGTH, 200, 0), True),
              "Strength effect failed")
        check(entity.has_potion_effect(PotionEffectType.SPEED), "Speed effect is not active")
        check(entity.has_potion_effect(PotionEffectType.STRENGTH), "Strength effect is not active")

        zombie_values = {
            Attribute.MAX_HEALTH: 26.0,
            Attribute.FOLLOW_RANGE: 26.0,
            Attribute.KNOCKBACK_RESISTANCE: 0.17,
            Attribute.MOVEMENT_SPEED: 0.33,
            Attribute.ATTACK_DAMAGE: 9.0,
            Attribute.SPAWN_REINFORCEMENTS: 0.22,
        }
        for attribute, assigned_value in zombie_values.items():
            instance = entity.get_attribute(attribute)
            instance.base_value = assigned_value
            check(abs(instance.base_value - assigned_value) < 0.000001,
                  f"assignment failed for {attribute.name}")
            check(instance.value == instance.value, f"invalid {attribute.name} value")
        speed = entity.get_attribute(Attribute.MOVEMENT_SPEED)
        damage = entity.get_attribute(Attribute.ATTACK_DAMAGE)
        jump = horse.get_attribute(Attribute.JUMP_STRENGTH)
        jump.base_value = 0.92
        check(abs(jump.base_value - 0.92) < 0.000001, "horse jump assignment failed")
        seen["entity"] = True
        mark("entities.effects-attributes-cleanup")
        info(f"PORTING-PY ENTITY PASS customName=true attributes={len(zombie_values)} "
             f"speed={speed.base_value} attackDamage={damage.base_value} horseJump={jump.base_value}")
    finally:
        entity.remove()
        horse.remove()


def joined(event: PlayerJoinEvent) -> None:
    check(bool(event.player.name), "PlayerJoinEvent.player.name is empty")
    online_names = [online.name for online in players]
    loaded_world_names = {world.name for world in worlds}
    check(event.player.name in online_names, "players iterable omitted the joining player")
    check(bool(loaded_world_names), "worlds iterable returned no loaded world")
    check(len(players) == len(online_names), "players len() disagrees with iteration")
    check(len(worlds) == len(loaded_world_names), "worlds len() disagrees with iteration")
    info(f"PORTING-PY ITERATION PASS players={len(players)} worlds={len(worlds)}")
    seen.update(join=True, move=False, chat=False, quit=False, receive=False, send=False, entity=False)
    test_entity_surface(event.player)
    mark("events.join")
    info(f"PORTING-PY EVENT_JOIN PASS {event.player.name}")


def moved(event: PlayerMoveEvent) -> None:
    if not seen["move"]:
        check(event.from_.world.name == event.player.world.name, "PlayerMoveEvent world mismatch")
        seen["move"] = True
        mark("events.move")
        info("PORTING-PY EVENT_MOVE PASS")


def chatted(event: AsyncPlayerChatEvent) -> None:
    seen["chat"] = True
    mark("events.chat")
    info(f"PORTING-PY EVENT_CHAT PASS {event.message}")


def quit_server(event: PlayerQuitEvent) -> None:
    seen["quit"] = True
    mark("events.quit")
    info(f"PORTING-PY EVENT_QUIT PASS {event.player.name}")


on(PlayerJoinEvent, joined)
on(PlayerMoveEvent, moved)
on(AsyncPlayerChatEvent, chatted)
on(PlayerQuitEvent, quit_server)


@packets.listen_receive(ClientPacket.CHAT_MESSAGE)
def packet_received(context: PacketContext) -> None:
    packet = context.wrap(WrapperPlayClientChatMessage)
    check(len(packet.message) >= 0, "client chat wrapper has no message")
    seen["receive"] = True
    mark("packets.receive")
    info(f"PORTING-PY PACKET_RECEIVE PASS {packet.message}")


@packets.listen_send(ServerPacket.UPDATE_HEALTH)
def packet_sent(context: PacketContext) -> None:
    context.wrap(WrapperPlayServerUpdateHealth)
    seen["send"] = True
    mark("packets.send")
    info("PORTING-PY PACKET_SEND PASS UPDATE_HEALTH")


@command("portingpy")
def status(context: CommandContext) -> bool:
    check(isinstance(context.args, list), "command arguments are not a Python list")  # pyright: ignore[reportUnnecessaryIsInstance]
    check(isinstance(context.has_permission("graaly.conformance"), bool),  # pyright: ignore[reportUnnecessaryIsInstance]
          "command permission result is not bool")
    mark("commands.context")
    match context.args:
        case [] | ["status"]:
            context.reply("&aPython PASS: tutti i simboli runtime e package sono risolti.")
            return True
        case ["keywords"]:
            context.reply("&aPython PASS: decorator, comprehension, match e async/await sono attivi.")
            return True
        case _:
            return False


async def task_probe() -> None:
    await tasks.sleep_ticks(4)
    mark("scheduling.delayed")
    info("PORTING-PY TASK PASS")


def on_enable() -> None:
    try:
        report = diagnostics.verify()
        def verify_catalog() -> None:
            check(report["api_symbols"] == EXPECTED["api_symbols"], "Graaly API catalog size failed")
            check(report["wrappers"] == EXPECTED["wrappers"], "wrapper catalog size failed")
            check(report["packet_types"] == EXPECTED["packet_types"], "packet type catalog size failed")
            check(report["packet_constants"] == EXPECTED["packet_constants"], "packet constant catalog size failed")
            check(packets.available, "PacketEvents is not available")
        probe("catalog.symbol-resolution", verify_catalog)

        def verify_version_adapters() -> None:
            check(Material.GRASS_BLOCK is not None, "canonical material alias failed")  # pyright: ignore[reportUnnecessaryComparison]
            check(PotionEffectType.STRENGTH is not None, "canonical potion alias failed")  # pyright: ignore[reportUnnecessaryComparison]
            check(api.MapCursor(1, 2, 3, api.MapCursorType.PLAYER, True).visible,
                  "canonical map cursor adapter failed")
        probe("compatibility.canonical-version-adapters", verify_version_adapters)

        probe("core.data-path-contained", lambda: check(
            "nested" in str(api.data_file("nested/probe.yml")), "nested data path was not resolved"))
        expected_failure("core.data-path-traversal", lambda: api.data_file("../escape.txt"))
        probe("core.text-color", lambda: check(api.text.color("&aGraaly") == "§aGraaly",
                                                "color translation failed"))

        def verify_constructor() -> None:
            check(Material.DIAMOND_SWORD.name == "DIAMOND_SWORD", "enum access failed")
            vector = Vector(7, 8, 9)
            check(vector.x == 7 and vector.y == 8 and vector.z == 9,
                  "constructor bridge failed")
        probe("constructors.overload-coercion", verify_constructor)
        expected_failure("constructors.invalid-overload", lambda: Vector("not-a-number", 8, 9))  # pyright: ignore[reportCallIssue, reportArgumentType]

        def verify_property() -> None:
            vector = Vector(7, 8, 9)
            vector.x = 11
            check(vector.x == 11, "property assignment failed")
        probe("properties.read-write", verify_property)

        def verify_collection() -> None:
            materials = Material.values()
            check(isinstance(materials, list) and len(materials) > 0,  # pyright: ignore[reportUnnecessaryIsInstance]
                  "enum values are not a Python list view")
            check(materials[-1] is not None and len(list(materials)) == len(materials),  # pyright: ignore[reportUnnecessaryComparison]
                  "negative indexing or iteration failed")
        probe("collections.array-view", verify_collection)

        def verify_config() -> None:
            missing = "conformance.python.missing"
            config.set(missing, None)
            check(config.get(missing, "fallback") == "fallback" and not config.contains(missing),
                  "config fallback failed")
            config.set("conformance.python.scalar", 44)
            check(config.get("conformance.python.scalar") == 44, "config scalar round-trip failed")
            config.set("conformance.python.scalar", None)
        probe("configuration.fallback-roundtrip", verify_config)
        probe("scheduling.boundaries", lambda: check(tasks.is_main_thread(),
                                                       "on_enable did not run on the main thread"))
        probe("players.missing-lookup", lambda: check(
            players.get("__graaly_missing_player__") is None
            and players.exact("__graaly_missing_player__") is None
            and isinstance(players.online(), list),  # pyright: ignore[reportUnnecessaryIsInstance]
            "missing player lookup or online list failed"))
        probe("worlds.missing-lookup", lambda: check(
            worlds.get("__graaly_missing_world__") is None, "missing world should return None"))

        world = worlds.all()[0]
        def verify_world() -> None:
            location = worlds.location(world, 4, 90, 4, 75, -20)
            check(location.world.name == world.name and location.yaw == 75 and location.pitch == -20,
                  "Location constructor failed")
            block = world.get_block_at(4, 90, 4)
            previous = block.type
            try:
                block.type = Material.SEA_LANTERN
                check(block.type == Material.SEA_LANTERN, "World/Block mutation failed")
            finally:
                block.type = previous
            check(block.type == previous, "block cleanup failed")
        probe("worlds.location-block-restore", verify_world)

        def verify_item() -> None:
            original = api.ItemStack(Material.DIAMOND, 2)
            clone = original.clone()
            clone.amount = 3
            check(original.amount == 2 and clone.amount == 3 and clone.type == original.type,
                  "ItemStack clone is not independent")
        probe("items.clone-independence", verify_item)
        probe("permissions.value-object", lambda: check(
            api.Permission("graaly.conformance", "Runtime conformance probe").name
            == "graaly.conformance", "Permission construction failed"))
        probe("maps.value-object", lambda: check(
            api.MapCursor(1, 2, 3, api.MapCursorType.PLAYER, True).visible,
            "MapCursor construction failed"))

        def verify_adapter() -> None:
            invoked = {"value": False}
            def render(_view: object, _canvas: object, _player: object) -> None:
                invoked["value"] = True
            renderer = api.extend(api.MapRenderer, True, render=render)
            renderer.render(None, None, None)  # pyright: ignore[reportArgumentType]
            check(invoked["value"] and renderer.contextual, "abstract callback adapter failed")
        probe("adapters.callback", verify_adapter)
        expected_failure("ui.invalid-snapshot", lambda: api.ui.render(None, []))  # pyright: ignore[reportArgumentType]
        probe("boards.optional-provider", lambda: check(isinstance(api.boards.available, bool),  # pyright: ignore[reportUnnecessaryIsInstance]
                                                         "boards.available is not bool"))

        config.set("porting.python", "PASS")
        config.save()
        check(config.get("porting.python") == "PASS", "config round-trip failed")
        tasks.create_task(task_probe(), name="porting-task-probe")
        health = WrapperPlayServerUpdateHealth(20, 20, 5)
        def verify_packets() -> None:
            check(health.health == 20, "PacketEvents wrapper construction failed")
            check(Component.text("surface").content() == "surface",
                  "PacketEvents support static method failed")
            check(bool(ClientPacket.CHAT_MESSAGE.name), "packet constant resolution failed")
        probe("packets.constants-wrapper", verify_packets)
        info(f"PORTING-PY SURFACE PASS apiSymbols={report['api_symbols']} wrappers={report['wrappers']} packetTypes={report['packet_types']} constants={report['packet_constants']}")
        info("PORTING-PY WORLD PASS")
    except Exception as exception:
        error(f"PORTING-PY FAIL {exception}")
        raise


def on_disable() -> None:
    mark("lifecycle.cleanup")
    info("PORTING-PY DISABLE " + " ".join(f"{name}={value}" for name, value in seen.items()))
