package io.github.sk8erboi17.graaly.polyglot;

import org.bukkit.Material;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Version adapters behind Graaly's stable JavaScript and Python contracts. */
final class GraalyCompatibility {
    static final String CONTRACT_VERSION = "1.0";
    static final String MINIMUM_GAME_VERSION = "1.7.10";
    private static final Pattern MC_VERSION = Pattern.compile("(?:MC: )?(\\d+(?:\\.\\d+){0,2})");
    private static final Pattern CONSTANT = Pattern.compile("[A-Z][A-Z0-9_]*");
    private static final Set<String> PORTABLE_ENUMS = Collections.unmodifiableSet(new LinkedHashSet<>(Arrays.asList(
            "org.bukkit.Material",
            "org.bukkit.Sound",
            "org.bukkit.Particle",
            "org.bukkit.DyeColor",
            "org.bukkit.entity.EntityType",
            "org.bukkit.attribute.Attribute",
            "org.bukkit.GameMode",
            "org.bukkit.Difficulty",
            "org.bukkit.World$Environment",
            "org.bukkit.WorldType",
            "org.bukkit.block.Biome",
            "org.bukkit.map.MapCursor$Type",
            "org.bukkit.potion.PotionEffectType",
            "org.bukkit.enchantments.Enchantment"
    )));
    private static final Map<String, String[]> ENUM_ALIASES = aliases();
    private static final Map<String, String> FEATURE_VERSIONS = featureVersions();

    private final PolyglotPlugin plugin;
    private final String minecraftVersion;

    GraalyCompatibility(PolyglotPlugin plugin) {
        this.plugin = plugin;
        this.minecraftVersion = detectMinecraftVersion();
    }

    String minecraftVersion() {
        return minecraftVersion;
    }

    String serverVersion() {
        return plugin.getServer().getVersion();
    }

    String contractVersion() {
        return CONTRACT_VERSION;
    }

    String minimumGameVersion() {
        return MINIMUM_GAME_VERSION;
    }

    boolean supports(String feature) {
        String normalized = normalizeFeature(feature);
        String required = FEATURE_VERSIONS.get(normalized);
        if (required != null) {
            return compareVersions(minecraftVersion, required) >= 0;
        }
        if (normalized.startsWith("type:")) {
            return typeAvailable(feature.substring(feature.indexOf(':') + 1).trim());
        }
        int separator = normalized.indexOf(':');
        if (separator > 0) {
            String type = normalized.substring(0, separator);
            String constant = normalized.substring(separator + 1);
            String className = portableClassName(type);
            return className != null && portableConstantAvailable(className, constant);
        }
        throw new IllegalArgumentException("Unknown Graaly capability '" + feature + "'");
    }

    void require(String feature) {
        if (supports(feature)) {
            return;
        }
        String normalized = normalizeFeature(feature);
        String minimum = FEATURE_VERSIONS.get(normalized);
        throw unsupported(normalized, minimum == null
                ? "This server does not expose a faithful implementation."
                : "It requires Minecraft " + minimum + " or newer.");
    }

    boolean typeAvailable(String exportedName) {
        String requested = exportedName == null ? "" : exportedName.trim();
        String className = PolyglotTypeCatalog.apiClass(requested);
        if (className == null) {
            for (String candidate : PolyglotTypeCatalog.apiNames()) {
                if (candidate.equalsIgnoreCase(requested)) {
                    className = PolyglotTypeCatalog.apiClass(candidate);
                    break;
                }
            }
        }
        if (className == null) {
            className = PolyglotTypeCatalog.constantRuntimeTypeForExport(requested);
        }
        if (className == null) {
            return false;
        }
        try {
            Class.forName(className, false, plugin.getHostClassLoader());
            return true;
        } catch (ClassNotFoundException | LinkageError ignored) {
            return false;
        }
    }

    Material material(String canonicalName) {
        Object resolved = portableConstant(Material.class, canonicalName);
        return (Material) resolved;
    }

    boolean isPortableEnum(Object type) {
        return type instanceof Class<?> && PORTABLE_ENUMS.contains(((Class<?>) type).getName());
    }

    boolean canRequestPortableConstant(Object type, String name) {
        return isPortableEnum(type) && name != null && CONSTANT.matcher(name).matches();
    }

    Object portableConstant(Object type, String requestedName) {
        if (!(type instanceof Class<?>) || !isPortableEnum(type)) {
            throw new IllegalArgumentException("The target is not a Graaly portable enum");
        }
        Class<?> enumType = (Class<?>) type;
        String canonical = normalizeConstant(requestedName);
        String key = enumType.getName() + "#" + canonical;
        String[] candidates = ENUM_ALIASES.getOrDefault(key, new String[] { canonical });
        for (String candidate : candidates) {
            try {
                Field field = enumType.getField(candidate);
                if (Modifier.isStatic(field.getModifiers())) {
                    return field.get(null);
                }
            } catch (ReflectiveOperationException ignored) {
                // Try the next historical spelling.
            }
        }
        throw unsupported(enumType.getSimpleName() + "." + canonical,
                "This value does not exist in this game version and Graaly has no faithful equivalent.");
    }

    GraalyUnsupportedFeatureException missingType(String exportedName, String className) {
        return unsupported("type:" + exportedName,
                "The underlying type " + className + " does not exist in this game version.");
    }

    GraalyUnsupportedFeatureException missingMember(String owner, String member) {
        String typeName = owner == null ? "ApiObject"
                : owner.substring(Math.max(owner.lastIndexOf('.'), owner.lastIndexOf('$')) + 1);
        return unsupported("member:" + typeName + "." + member,
                "This member belongs to Graaly's stable API but does not exist in this game version.");
    }

    private GraalyUnsupportedFeatureException unsupported(String feature, String explanation) {
        return new GraalyUnsupportedFeatureException(feature, minecraftVersion, explanation);
    }

    private String portableClassName(String type) {
        switch (type) {
            case "material": return "org.bukkit.Material";
            case "entity":
            case "entity_type": return "org.bukkit.entity.EntityType";
            case "attribute": return "org.bukkit.attribute.Attribute";
            case "sound": return "org.bukkit.Sound";
            case "dye_color": return "org.bukkit.DyeColor";
            default: return null;
        }
    }

    private boolean portableConstantAvailable(String className, String constant) {
        if (constant == null || constant.trim().isEmpty()) {
            return false;
        }
        try {
            Class<?> type = Class.forName(className, false, plugin.getHostClassLoader());
            portableConstant(type, constant.toUpperCase(Locale.ENGLISH));
            return true;
        } catch (ClassNotFoundException | LinkageError | GraalyUnsupportedFeatureException ignored) {
            return false;
        }
    }

    private String detectMinecraftVersion() {
        String api = plugin.getServer().getBukkitVersion();
        Matcher apiMatcher = MC_VERSION.matcher(api == null ? "" : api);
        if (apiMatcher.find()) {
            return apiMatcher.group(1);
        }
        Matcher serverMatcher = MC_VERSION.matcher(plugin.getServer().getVersion());
        return serverMatcher.find() ? serverMatcher.group(1) : "unknown";
    }

    private static String normalizeFeature(String feature) {
        if (feature == null || feature.trim().isEmpty()) {
            throw new IllegalArgumentException("Graaly capability cannot be empty");
        }
        return feature.trim().toLowerCase(Locale.ENGLISH).replace('-', '_').replace(' ', '_');
    }

    private static String normalizeConstant(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Graaly enum value cannot be empty");
        }
        return name.trim().toUpperCase(Locale.ENGLISH).replace('-', '_').replace(' ', '_');
    }

    static int compareVersions(String left, String right) {
        int[] a = versionParts(left);
        int[] b = versionParts(right);
        for (int index = 0; index < Math.max(a.length, b.length); index++) {
            int av = index < a.length ? a[index] : 0;
            int bv = index < b.length ? b[index] : 0;
            if (av != bv) {
                return Integer.compare(av, bv);
            }
        }
        return 0;
    }

    private static int[] versionParts(String version) {
        Matcher matcher = MC_VERSION.matcher(version == null ? "" : version);
        if (!matcher.find()) {
            return new int[0];
        }
        String[] parts = matcher.group(1).split("\\.");
        int[] values = new int[parts.length];
        for (int index = 0; index < parts.length; index++) {
            values[index] = Integer.parseInt(parts[index]);
        }
        return values;
    }

    private static Map<String, String> featureVersions() {
        Map<String, String> versions = new LinkedHashMap<>();
        versions.put("off_hand", "1.9");
        versions.put("attributes", "1.9");
        versions.put("entity_ai", "1.9");
        versions.put("entity_invulnerable", "1.9");
        versions.put("entity_gravity", "1.10");
        versions.put("glowing", "1.9");
        versions.put("elytra", "1.9");
        versions.put("persistent_data", "1.14");
        versions.put("custom_model_data", "1.14");
        versions.put("allay", "1.19");
        versions.put("display_entities", "1.19.4");
        versions.put("data_components", "1.20.5");
        versions.put("bundles", "1.21.2");
        versions.put("dialogs", "1.21.6");
        return Collections.unmodifiableMap(versions);
    }

    private static Map<String, String[]> aliases() {
        Map<String, String[]> values = new LinkedHashMap<>();
        alias(values, "org.bukkit.Material", "GRASS_BLOCK", "GRASS_BLOCK", "GRASS");
        alias(values, "org.bukkit.Material", "SHORT_GRASS", "SHORT_GRASS", "GRASS", "LONG_GRASS");
        alias(values, "org.bukkit.Material", "OAK_LOG", "OAK_LOG", "LOG");
        alias(values, "org.bukkit.Material", "SPRUCE_LOG", "SPRUCE_LOG", "LOG");
        alias(values, "org.bukkit.Material", "BIRCH_LOG", "BIRCH_LOG", "LOG");
        alias(values, "org.bukkit.Material", "JUNGLE_LOG", "JUNGLE_LOG", "LOG");
        alias(values, "org.bukkit.Material", "ACACIA_LOG", "ACACIA_LOG", "LOG_2");
        alias(values, "org.bukkit.Material", "DARK_OAK_LOG", "DARK_OAK_LOG", "LOG_2");
        alias(values, "org.bukkit.Material", "OAK_PLANKS", "OAK_PLANKS", "WOOD");
        alias(values, "org.bukkit.Material", "SPRUCE_PLANKS", "SPRUCE_PLANKS", "WOOD");
        alias(values, "org.bukkit.Material", "BIRCH_PLANKS", "BIRCH_PLANKS", "WOOD");
        alias(values, "org.bukkit.Material", "JUNGLE_PLANKS", "JUNGLE_PLANKS", "WOOD");
        alias(values, "org.bukkit.Material", "ACACIA_PLANKS", "ACACIA_PLANKS", "WOOD");
        alias(values, "org.bukkit.Material", "DARK_OAK_PLANKS", "DARK_OAK_PLANKS", "WOOD");
        alias(values, "org.bukkit.Material", "OAK_LEAVES", "OAK_LEAVES", "LEAVES");
        alias(values, "org.bukkit.Material", "SPRUCE_LEAVES", "SPRUCE_LEAVES", "LEAVES");
        alias(values, "org.bukkit.Material", "BIRCH_LEAVES", "BIRCH_LEAVES", "LEAVES");
        alias(values, "org.bukkit.Material", "JUNGLE_LEAVES", "JUNGLE_LEAVES", "LEAVES");
        alias(values, "org.bukkit.Material", "ACACIA_LEAVES", "ACACIA_LEAVES", "LEAVES_2");
        alias(values, "org.bukkit.Material", "DARK_OAK_LEAVES", "DARK_OAK_LEAVES", "LEAVES_2");
        alias(values, "org.bukkit.Material", "OAK_SAPLING", "OAK_SAPLING", "SAPLING");
        alias(values, "org.bukkit.Material", "SPRUCE_SAPLING", "SPRUCE_SAPLING", "SAPLING");
        alias(values, "org.bukkit.Material", "BIRCH_SAPLING", "BIRCH_SAPLING", "SAPLING");
        alias(values, "org.bukkit.Material", "JUNGLE_SAPLING", "JUNGLE_SAPLING", "SAPLING");
        alias(values, "org.bukkit.Material", "ACACIA_SAPLING", "ACACIA_SAPLING", "SAPLING");
        alias(values, "org.bukkit.Material", "DARK_OAK_SAPLING", "DARK_OAK_SAPLING", "SAPLING");
        alias(values, "org.bukkit.Material", "OAK_SIGN", "OAK_SIGN", "SIGN", "SIGN_POST");
        alias(values, "org.bukkit.Material", "OAK_WALL_SIGN", "OAK_WALL_SIGN", "WALL_SIGN");
        alias(values, "org.bukkit.Material", "OAK_DOOR", "OAK_DOOR", "WOOD_DOOR", "WOODEN_DOOR");
        alias(values, "org.bukkit.Material", "IRON_DOOR", "IRON_DOOR", "IRON_DOOR_BLOCK");
        alias(values, "org.bukkit.Material", "OAK_FENCE", "OAK_FENCE", "FENCE");
        alias(values, "org.bukkit.Material", "OAK_FENCE_GATE", "OAK_FENCE_GATE", "FENCE_GATE");
        alias(values, "org.bukkit.Material", "BRICKS", "BRICKS", "BRICK");
        alias(values, "org.bukkit.Material", "BRICK_STAIRS", "BRICK_STAIRS");
        alias(values, "org.bukkit.Material", "NETHER_BRICKS", "NETHER_BRICKS", "NETHER_BRICK");
        alias(values, "org.bukkit.Material", "NETHER_BRICK_FENCE", "NETHER_BRICK_FENCE");
        alias(values, "org.bukkit.Material", "NETHER_BRICK_STAIRS", "NETHER_BRICK_STAIRS");
        alias(values, "org.bukkit.Material", "MELON", "MELON", "MELON_BLOCK");
        alias(values, "org.bukkit.Material", "CARVED_PUMPKIN", "CARVED_PUMPKIN", "PUMPKIN");
        alias(values, "org.bukkit.Material", "JACK_O_LANTERN", "JACK_O_LANTERN");
        alias(values, "org.bukkit.Material", "LILY_PAD", "LILY_PAD", "WATER_LILY");
        alias(values, "org.bukkit.Material", "SUGAR_CANE", "SUGAR_CANE", "SUGAR_CANE_BLOCK");
        alias(values, "org.bukkit.Material", "NETHER_PORTAL", "NETHER_PORTAL", "PORTAL");
        alias(values, "org.bukkit.Material", "SPAWNER", "SPAWNER", "MOB_SPAWNER");
        alias(values, "org.bukkit.Material", "NOTE_BLOCK", "NOTE_BLOCK", "NOTE_BLOCK");
        alias(values, "org.bukkit.Material", "CRAFTING_TABLE", "CRAFTING_TABLE", "WORKBENCH");
        alias(values, "org.bukkit.Material", "COBWEB", "COBWEB", "WEB");
        alias(values, "org.bukkit.Material", "STONE_BRICKS", "STONE_BRICKS", "SMOOTH_BRICK");
        alias(values, "org.bukkit.Material", "TERRACOTTA", "TERRACOTTA", "HARD_CLAY");
        alias(values, "org.bukkit.Material", "WHITE_WOOL", "WHITE_WOOL", "WOOL");
        alias(values, "org.bukkit.Material", "WHITE_STAINED_GLASS_PANE", "WHITE_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "ORANGE_STAINED_GLASS_PANE", "ORANGE_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "MAGENTA_STAINED_GLASS_PANE", "MAGENTA_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "LIGHT_BLUE_STAINED_GLASS_PANE", "LIGHT_BLUE_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "YELLOW_STAINED_GLASS_PANE", "YELLOW_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "LIME_STAINED_GLASS_PANE", "LIME_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "PINK_STAINED_GLASS_PANE", "PINK_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "GRAY_STAINED_GLASS_PANE", "GRAY_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "LIGHT_GRAY_STAINED_GLASS_PANE", "LIGHT_GRAY_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "CYAN_STAINED_GLASS_PANE", "CYAN_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "PURPLE_STAINED_GLASS_PANE", "PURPLE_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "BLUE_STAINED_GLASS_PANE", "BLUE_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "BROWN_STAINED_GLASS_PANE", "BROWN_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "GREEN_STAINED_GLASS_PANE", "GREEN_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "RED_STAINED_GLASS_PANE", "RED_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "BLACK_STAINED_GLASS_PANE", "BLACK_STAINED_GLASS_PANE", "STAINED_GLASS_PANE");
        alias(values, "org.bukkit.Material", "DIRT_PATH", "DIRT_PATH", "GRASS_PATH");
        alias(values, "org.bukkit.entity.EntityType", "ZOMBIFIED_PIGLIN", "ZOMBIFIED_PIGLIN", "PIG_ZOMBIE");
        alias(values, "org.bukkit.entity.EntityType", "MOOSHROOM", "MOOSHROOM", "MUSHROOM_COW");
        alias(values, "org.bukkit.entity.EntityType", "SNOW_GOLEM", "SNOW_GOLEM", "SNOWMAN");
        alias(values, "org.bukkit.entity.EntityType", "LEASH_KNOT", "LEASH_KNOT", "LEASH_HITCH");
        alias(values, "org.bukkit.DyeColor", "LIGHT_GRAY", "LIGHT_GRAY", "SILVER");
        alias(values, "org.bukkit.map.MapCursor$Type", "PLAYER", "PLAYER", "WHITE_POINTER");
        alias(values, "org.bukkit.potion.PotionEffectType", "STRENGTH", "STRENGTH", "INCREASE_DAMAGE");
        alias(values, "org.bukkit.attribute.Attribute", "MAX_HEALTH", "MAX_HEALTH", "GENERIC_MAX_HEALTH");
        alias(values, "org.bukkit.attribute.Attribute", "FOLLOW_RANGE", "FOLLOW_RANGE", "GENERIC_FOLLOW_RANGE");
        alias(values, "org.bukkit.attribute.Attribute", "KNOCKBACK_RESISTANCE", "KNOCKBACK_RESISTANCE", "GENERIC_KNOCKBACK_RESISTANCE");
        alias(values, "org.bukkit.attribute.Attribute", "MOVEMENT_SPEED", "MOVEMENT_SPEED", "GENERIC_MOVEMENT_SPEED");
        alias(values, "org.bukkit.attribute.Attribute", "FLYING_SPEED", "FLYING_SPEED", "GENERIC_FLYING_SPEED");
        alias(values, "org.bukkit.attribute.Attribute", "ATTACK_DAMAGE", "ATTACK_DAMAGE", "GENERIC_ATTACK_DAMAGE");
        alias(values, "org.bukkit.attribute.Attribute", "ATTACK_KNOCKBACK", "ATTACK_KNOCKBACK", "GENERIC_ATTACK_KNOCKBACK");
        alias(values, "org.bukkit.attribute.Attribute", "ATTACK_SPEED", "ATTACK_SPEED", "GENERIC_ATTACK_SPEED");
        alias(values, "org.bukkit.attribute.Attribute", "ARMOR", "ARMOR", "GENERIC_ARMOR");
        alias(values, "org.bukkit.attribute.Attribute", "ARMOR_TOUGHNESS", "ARMOR_TOUGHNESS", "GENERIC_ARMOR_TOUGHNESS");
        alias(values, "org.bukkit.attribute.Attribute", "FALL_DAMAGE_MULTIPLIER", "FALL_DAMAGE_MULTIPLIER", "GENERIC_FALL_DAMAGE_MULTIPLIER");
        alias(values, "org.bukkit.attribute.Attribute", "LUCK", "LUCK", "GENERIC_LUCK");
        alias(values, "org.bukkit.attribute.Attribute", "MAX_ABSORPTION", "MAX_ABSORPTION", "GENERIC_MAX_ABSORPTION");
        alias(values, "org.bukkit.attribute.Attribute", "SAFE_FALL_DISTANCE", "SAFE_FALL_DISTANCE", "GENERIC_SAFE_FALL_DISTANCE");
        alias(values, "org.bukkit.attribute.Attribute", "SCALE", "SCALE", "GENERIC_SCALE");
        alias(values, "org.bukkit.attribute.Attribute", "STEP_HEIGHT", "STEP_HEIGHT", "GENERIC_STEP_HEIGHT");
        alias(values, "org.bukkit.attribute.Attribute", "GRAVITY", "GRAVITY", "GENERIC_GRAVITY");
        alias(values, "org.bukkit.attribute.Attribute", "JUMP_STRENGTH", "JUMP_STRENGTH", "HORSE_JUMP_STRENGTH", "GENERIC_JUMP_STRENGTH");
        alias(values, "org.bukkit.attribute.Attribute", "BURNING_TIME", "BURNING_TIME", "GENERIC_BURNING_TIME");
        alias(values, "org.bukkit.attribute.Attribute", "CAMERA_DISTANCE", "CAMERA_DISTANCE", "GENERIC_CAMERA_DISTANCE");
        alias(values, "org.bukkit.attribute.Attribute", "EXPLOSION_KNOCKBACK_RESISTANCE", "EXPLOSION_KNOCKBACK_RESISTANCE", "GENERIC_EXPLOSION_KNOCKBACK_RESISTANCE");
        alias(values, "org.bukkit.attribute.Attribute", "MOVEMENT_EFFICIENCY", "MOVEMENT_EFFICIENCY", "GENERIC_MOVEMENT_EFFICIENCY");
        alias(values, "org.bukkit.attribute.Attribute", "OXYGEN_BONUS", "OXYGEN_BONUS", "GENERIC_OXYGEN_BONUS");
        alias(values, "org.bukkit.attribute.Attribute", "WATER_MOVEMENT_EFFICIENCY", "WATER_MOVEMENT_EFFICIENCY", "GENERIC_WATER_MOVEMENT_EFFICIENCY");
        alias(values, "org.bukkit.attribute.Attribute", "TEMPT_RANGE", "TEMPT_RANGE", "GENERIC_TEMPT_RANGE");
        alias(values, "org.bukkit.attribute.Attribute", "BLOCK_INTERACTION_RANGE", "BLOCK_INTERACTION_RANGE", "PLAYER_BLOCK_INTERACTION_RANGE");
        alias(values, "org.bukkit.attribute.Attribute", "ENTITY_INTERACTION_RANGE", "ENTITY_INTERACTION_RANGE", "PLAYER_ENTITY_INTERACTION_RANGE");
        alias(values, "org.bukkit.attribute.Attribute", "BLOCK_BREAK_SPEED", "BLOCK_BREAK_SPEED", "PLAYER_BLOCK_BREAK_SPEED");
        alias(values, "org.bukkit.attribute.Attribute", "MINING_EFFICIENCY", "MINING_EFFICIENCY", "PLAYER_MINING_EFFICIENCY");
        alias(values, "org.bukkit.attribute.Attribute", "SNEAKING_SPEED", "SNEAKING_SPEED", "PLAYER_SNEAKING_SPEED");
        alias(values, "org.bukkit.attribute.Attribute", "SUBMERGED_MINING_SPEED", "SUBMERGED_MINING_SPEED", "PLAYER_SUBMERGED_MINING_SPEED");
        alias(values, "org.bukkit.attribute.Attribute", "SWEEPING_DAMAGE_RATIO", "SWEEPING_DAMAGE_RATIO", "PLAYER_SWEEPING_DAMAGE_RATIO");
        alias(values, "org.bukkit.attribute.Attribute", "SPAWN_REINFORCEMENTS", "SPAWN_REINFORCEMENTS", "ZOMBIE_SPAWN_REINFORCEMENTS");
        alias(values, "org.bukkit.attribute.Attribute", "WAYPOINT_TRANSMIT_RANGE", "WAYPOINT_TRANSMIT_RANGE", "GENERIC_WAYPOINT_TRANSMIT_RANGE");
        alias(values, "org.bukkit.attribute.Attribute", "WAYPOINT_RECEIVE_RANGE", "WAYPOINT_RECEIVE_RANGE", "GENERIC_WAYPOINT_RECEIVE_RANGE");
        alias(values, "org.bukkit.attribute.Attribute", "AIR_DRAG_MODIFIER", "AIR_DRAG_MODIFIER");
        alias(values, "org.bukkit.attribute.Attribute", "BELOW_NAME_DISTANCE", "BELOW_NAME_DISTANCE");
        alias(values, "org.bukkit.attribute.Attribute", "BOUNCINESS", "BOUNCINESS");
        alias(values, "org.bukkit.attribute.Attribute", "FRICTION_MODIFIER", "FRICTION_MODIFIER");
        alias(values, "org.bukkit.attribute.Attribute", "NAME_TAG_DISTANCE", "NAME_TAG_DISTANCE");
        alias(values, "org.bukkit.Sound", "ENTITY_PLAYER_LEVELUP", "ENTITY_PLAYER_LEVELUP", "LEVEL_UP");
        alias(values, "org.bukkit.Sound", "BLOCK_NOTE_BLOCK_PLING", "BLOCK_NOTE_BLOCK_PLING", "NOTE_PLING");
        alias(values, "org.bukkit.Sound", "ENTITY_EXPERIENCE_ORB_PICKUP", "ENTITY_EXPERIENCE_ORB_PICKUP", "ORB_PICKUP");
        return Collections.unmodifiableMap(values);
    }

    private static void alias(Map<String, String[]> aliases, String type, String canonical, String... candidates) {
        aliases.put(type + "#" + canonical, candidates);
    }
}
