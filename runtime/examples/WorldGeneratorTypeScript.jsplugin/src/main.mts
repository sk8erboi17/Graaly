import { Biome, commands, info, Location, Material, worlds } from "graaly";

const orePopulator = worlds.populator(({ chunk, random }) => {
  for (let vein = 0; vein < 3; vein++) {
    const block = chunk.getBlock(random.nextInt(16), 12 + random.nextInt(28), random.nextInt(16));
    block.type = Material.DIAMOND_ORE;
  }
});

const islandGenerator = worlds.generator({
  generate({ biomes, chunk, chunkX, chunkZ }) {
    chunk.setRegion(0, 0, 0, 16, 1, 16, Material.BEDROCK);

    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) biomes.setBiome(x, z, Biome.PLAINS);
    }

    if (chunkX === 0 && chunkZ === 0) {
      chunk.setRegion(4, 60, 4, 12, 63, 12, Material.STONE);
      chunk.setRegion(4, 63, 4, 12, 64, 12, Material.GRASS_BLOCK);
    }
  },
  canSpawn: ({ x, z }) => Math.abs(x) <= 8 && Math.abs(z) <= 8,
  defaultPopulators: [orePopulator],
  fixedSpawn: ({ world }) => Location(world, 8.5, 65, 8.5),
});

commands.on("voidworldts", context => {
  if (!context.hasPermission("graaly.world.create.ts")) {
    context.reply("&cNon hai il permesso graaly.world.create.ts.");
    return true;
  }

  const world = worlds.get("graaly_void_ts") ?? worlds.create("graaly_void_ts", {
    seed: 20260822,
    environment: "NORMAL",
    generateStructures: false,
    generator: islandGenerator,
  });
  world.setSpawnLocation(8, 65, 8);
  context.reply(`&aMondo ${world.name} pronto.`);
  return true;
});

export function onEnable(): void {
  info("WorldGeneratorTypeScript pronto: /voidworldts");
}
