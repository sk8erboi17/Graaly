import graaly as api
from graaly import Attributes, EntityTypes, Materials, GraalyUnsupportedFeature, PlayerJoinEvent, command, compatibility, entities, event, info, tasks, text, worlds


CANONICAL_ATTRIBUTES = (
    "MAX_HEALTH", "FOLLOW_RANGE", "KNOCKBACK_RESISTANCE", "MOVEMENT_SPEED",
    "FLYING_SPEED", "ATTACK_DAMAGE", "ATTACK_KNOCKBACK", "ATTACK_SPEED",
    "ARMOR", "ARMOR_TOUGHNESS", "FALL_DAMAGE_MULTIPLIER", "LUCK",
    "MAX_ABSORPTION", "SAFE_FALL_DISTANCE", "SCALE", "STEP_HEIGHT", "GRAVITY",
    "JUMP_STRENGTH", "BURNING_TIME", "CAMERA_DISTANCE",
    "EXPLOSION_KNOCKBACK_RESISTANCE", "MOVEMENT_EFFICIENCY", "OXYGEN_BONUS",
    "WATER_MOVEMENT_EFFICIENCY", "TEMPT_RANGE", "BLOCK_INTERACTION_RANGE",
    "ENTITY_INTERACTION_RANGE", "BLOCK_BREAK_SPEED", "MINING_EFFICIENCY",
    "SNEAKING_SPEED", "SUBMERGED_MINING_SPEED", "SWEEPING_DAMAGE_RATIO",
    "SPAWN_REINFORCEMENTS", "WAYPOINT_TRANSMIT_RANGE", "WAYPOINT_RECEIVE_RANGE",
    "AIR_DRAG_MODIFIER", "BELOW_NAME_DISTANCE", "BOUNCINESS", "FRICTION_MODIFIER",
    "NAME_TAG_DISTANCE",
)


@event(PlayerJoinEvent)
def on_join(event):
    event.player.send_message(text.color("&bGraaly Python is active."))


@command("graalypyprobe")
def probe(context):
    info(f"GRAALY_MATRIX_PY_COMMAND sender={context.sender.name}")
    context.reply("GRAALY_MATRIX_PY_REPLY")
    return True


def on_load():
    info("GRAALY_MATRIX_PY_LOAD")


async def on_enable():
    info(f"GRAALY_MATRIX_PY_ENABLE material={Materials.STONE.name}")
    info(
        f"GRAALY_MATRIX_PY_COMPAT mc={compatibility.minecraft_version} "
        f"grass={Materials.GRASS_BLOCK.name} "
        f"displays={compatibility.supports('display_entities')}"
    )
    if compatibility.supports("attributes") != compatibility.supports("attribute:MAX_HEALTH"):
        raise RuntimeError("MAX_HEALTH capability disagrees with the attribute feature")
    if not compatibility.supports("type:Player"):
        raise RuntimeError("Player must be present in Graaly's stable type catalog")
    available_attributes = [
        name for name in CANONICAL_ATTRIBUTES
        if compatibility.supports(f"attribute:{name}")
    ]
    for name in available_attributes:
        getattr(Attributes, name)
    info(f"GRAALY_MATRIX_PY_CONSTANTS attributes={len(available_attributes)}/{len(CANONICAL_ATTRIBUTES)}")
    strength = api.PotionEffectType.STRENGTH
    cursor = api.MapCursor(1, 2, 3, api.MapCursorType.PLAYER, True)
    if strength is None or not cursor.visible:
        raise RuntimeError("Canonical potion/map adapters did not resolve")
    info("GRAALY_MATRIX_PY_LEGACY_ADAPTERS potion=STRENGTH map=PLAYER")
    if compatibility.supports("attributes"):
        compatibility.require("attributes")
        _ = Attributes.MAX_HEALTH
        info("GRAALY_MATRIX_PY_UNSUPPORTED supported=true")
    else:
        native_error = False
        try:
            _ = Attributes.MAX_HEALTH
        except GraalyUnsupportedFeature as failure:
            native_error = (
                failure.feature == "type:Attribute"
                and failure.minecraft_version == compatibility.minecraft_version
            )
        if not native_error:
            raise RuntimeError("Unavailable constants must raise GraalyUnsupportedFeature")
        info("GRAALY_MATRIX_PY_UNSUPPORTED supported=false native=true")
    await tasks.sleep_ticks(1)
    info("GRAALY_MATRIX_PY_TASK")
    world = worlds.all()[0]
    if compatibility.type_available("Particle"):
        if not callable(world.spawn_particle):
            raise RuntimeError("Canonical World.spawn_particle must be callable")
        info("GRAALY_MATRIX_PY_MEMBER supported=true")
    else:
        native_error = False
        try:
            _ = world.spawn_particle
        except GraalyUnsupportedFeature as failure:
            native_error = failure.feature == "member:World.spawnParticle"
        if not native_error:
            raise RuntimeError("Missing canonical members must raise GraalyUnsupportedFeature")
        info("GRAALY_MATRIX_PY_MEMBER supported=false native=true")
    spawn = world.spawn_location
    location = worlds.location(world, spawn.x, spawn.y + 2, spawn.z)
    entity = entities.spawn(location, EntityTypes.SHEEP, name="Graaly matrix", name_visible=True)
    info(f"GRAALY_MATRIX_PY_ENTITY type={entity.type.name} name={entity.custom_name}")
    if compatibility.supports("attributes"):
        attribute = entities.attribute(entity, Attributes.MAX_HEALTH, 20)
        info(f"GRAALY_MATRIX_PY_ATTRIBUTE value={attribute.base_value}")
    else:
        info("GRAALY_MATRIX_PY_ATTRIBUTE unsupported")
    entities.remove(entity)


def on_disable():
    info("GRAALY_MATRIX_PY_DISABLE")
