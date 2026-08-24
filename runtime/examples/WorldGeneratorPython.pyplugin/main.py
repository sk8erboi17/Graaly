from graaly import (
    Biome,
    CommandContext,
    Location,
    Material,
    WorldFixedSpawnContext,
    WorldGenerationContext,
    WorldPopulateContext,
    WorldSpawnContext,
    command,
    info,
    worlds,
)


def generate_island(context: WorldGenerationContext) -> None:
    context.chunk.set_region(0, 0, 0, 16, 1, 16, Material.BEDROCK)

    for x in range(16):
        for z in range(16):
            context.biomes.set_biome(x, z, Biome.PLAINS)

    if context.chunk_x == 0 and context.chunk_z == 0:
        context.chunk.set_region(4, 60, 4, 12, 63, 12, Material.STONE)
        context.chunk.set_region(4, 63, 4, 12, 64, 12, Material.GRASS_BLOCK)


def populate_ores(context: WorldPopulateContext) -> None:
    for _ in range(3):
        block = context.chunk.get_block(
            context.random.next_int(16),
            12 + context.random.next_int(28),
            context.random.next_int(16),
        )
        block.type = Material.DIAMOND_ORE


def can_spawn(context: WorldSpawnContext) -> bool:
    return abs(context.x) <= 8 and abs(context.z) <= 8


def fixed_spawn(context: WorldFixedSpawnContext) -> Location:
    return Location(context.world, 8.5, 65, 8.5)


ore_populator = worlds.populator(populate_ores)
island_generator = worlds.generator(
    generate=generate_island,
    can_spawn=can_spawn,
    default_populators=[ore_populator],
    fixed_spawn=fixed_spawn,
)


@command("voidworldpy")
def create_void_world(context: CommandContext) -> bool:
    if not context.has_permission("graaly.world.create.py"):
        context.reply("&cNon hai il permesso graaly.world.create.py.")
        return True

    world = worlds.get("graaly_void_py")
    if world is None:
        world = worlds.create(
            "graaly_void_py",
            seed=20260822,
            environment="NORMAL",
            generate_structures=False,
            generator=island_generator,
        )
    world.set_spawn_location(8, 65, 8)
    context.reply(f"&aMondo {world.name} pronto.")
    return True


def on_enable() -> None:
    info("WorldGeneratorPython pronto: /voidworldpy")
