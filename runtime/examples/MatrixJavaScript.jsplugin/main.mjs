events.on(PlayerJoinEvent, event => {
    event.player.sendMessage(text.color("&aGraaly JavaScript is active."));
});

const CANONICAL_ATTRIBUTES = [
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
    "NAME_TAG_DISTANCE"
];

commands.on("graalyjsprobe", context => {
    info(`GRAALY_MATRIX_JS_COMMAND sender=${context.sender.name}`);
    context.reply("GRAALY_MATRIX_JS_REPLY");
    return true;
});

export function onLoad() {
    info("GRAALY_MATRIX_JS_LOAD");
}

export function onEnable() {
    const material = Materials.STONE;
    info(`GRAALY_MATRIX_JS_ENABLE material=${material.name}`);
    info(`GRAALY_MATRIX_JS_COMPAT mc=${compatibility.minecraftVersion} grass=${Materials.GRASS_BLOCK.name} displays=${compatibility.supports("display_entities")}`);
    if (compatibility.supports("attributes") !== compatibility.supports("attribute:MAX_HEALTH")) {
        throw new Error("MAX_HEALTH capability disagrees with the attribute feature");
    }
    if (!compatibility.supports("type:Player")) {
        throw new Error("Player must be present in Graaly's stable type catalog");
    }
    const availableAttributes = CANONICAL_ATTRIBUTES.filter(name => compatibility.supports(`attribute:${name}`));
    for (const name of availableAttributes) Attributes[name];
    info(`GRAALY_MATRIX_JS_CONSTANTS attributes=${availableAttributes.length}/${CANONICAL_ATTRIBUTES.length}`);
    const strength = PotionEffectType.STRENGTH;
    const cursor = MapCursor(1, 2, 3, MapCursorType.PLAYER, true);
    if (strength == null || !cursor.visible) {
        throw new Error("Canonical potion/map adapters did not resolve");
    }
    info("GRAALY_MATRIX_JS_LEGACY_ADAPTERS potion=STRENGTH map=PLAYER");
    if (compatibility.supports("attributes")) {
        compatibility.require("attributes");
        void Attributes.MAX_HEALTH;
        info("GRAALY_MATRIX_JS_UNSUPPORTED supported=true");
    } else {
        let nativeError = false;
        try {
            void Attributes.MAX_HEALTH;
        } catch (failure) {
            nativeError = failure instanceof GraalyUnsupportedFeature
                && failure.feature === "type:Attribute"
                && failure.minecraftVersion === compatibility.minecraftVersion;
        }
        if (!nativeError) {
            throw new Error("Unavailable constants must throw GraalyUnsupportedFeature");
        }
        info("GRAALY_MATRIX_JS_UNSUPPORTED supported=false native=true");
    }
    tasks.later(1, () => {
        info("GRAALY_MATRIX_JS_TASK");
        const world = worlds.all()[0];
        if (compatibility.typeAvailable("Particle")) {
            if (typeof world.spawnParticle !== "function") {
                throw new Error("Canonical World.spawnParticle must be callable");
            }
            info("GRAALY_MATRIX_JS_MEMBER supported=true");
        } else {
            let nativeError = false;
            try {
                void world.spawnParticle;
            } catch (failure) {
                nativeError = failure instanceof GraalyUnsupportedFeature
                    && failure.feature === "member:World.spawnParticle";
            }
            if (!nativeError) {
                throw new Error("Missing canonical members must throw GraalyUnsupportedFeature");
            }
            info("GRAALY_MATRIX_JS_MEMBER supported=false native=true");
        }
        const spawn = world.spawnLocation;
        const location = worlds.location(world, spawn.x, spawn.y + 2, spawn.z);
        const entity = entities.spawn(location, EntityTypes.SHEEP, {
            name: "Graaly matrix",
            nameVisible: true
        });
        info(`GRAALY_MATRIX_JS_ENTITY type=${entity.type.name} name=${entity.customName}`);
        if (compatibility.supports("attributes")) {
            const attribute = entities.attribute(entity, Attributes.MAX_HEALTH, 20);
            info(`GRAALY_MATRIX_JS_ATTRIBUTE value=${attribute.baseValue}`);
        } else {
            info("GRAALY_MATRIX_JS_ATTRIBUTE unsupported");
        }
        entities.remove(entity);
    });
}

export function onDisable() {
    info("GRAALY_MATRIX_JS_DISABLE");
}
