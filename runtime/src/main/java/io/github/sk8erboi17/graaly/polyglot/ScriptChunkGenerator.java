package io.github.sk8erboi17.graaly.polyglot;

import org.bukkit.World;
import org.bukkit.generator.ChunkGenerator;
import org.bukkit.generator.BlockPopulator;
import org.bukkit.Location;
import org.graalvm.polyglot.Value;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

/**
 * Adapts a language callback to Bukkit's abstract {@link ChunkGenerator}
 * without making JavaScript or Python authors subclass a Java type.
 */
final class ScriptChunkGenerator extends ChunkGenerator {
    private final PolyglotPlugin plugin;
    private final Value generate;
    private final Value canSpawn;
    private final Value defaultPopulators;
    private final Value fixedSpawn;

    ScriptChunkGenerator(PolyglotPlugin plugin, Value generate, Value canSpawn,
                         Value defaultPopulators, Value fixedSpawn) {
        this.plugin = plugin;
        this.generate = generate;
        this.canSpawn = canSpawn;
        this.defaultPopulators = defaultPopulators;
        this.fixedSpawn = fixedSpawn;
    }

    @Override
    public boolean canSpawn(World world, int x, int z) {
        if (canSpawn == null) {
            // Script generators commonly build void or island worlds where
            // the vanilla sand/gravel check would never succeed.
            return true;
        }
        Value result = plugin.invoke(canSpawn, world, x, z);
        if (result == null || result.isNull() || !result.isBoolean()) {
            throw new IllegalStateException("world generator canSpawn/can_spawn must return bool");
        }
        return result.asBoolean();
    }

    @Override
    public ChunkData generateChunkData(World world,
                                       Random random,
                                       int chunkX,
                                       int chunkZ,
                                       BiomeGrid biomes) {
        ChunkData chunk = createChunkData(world);
        Value result = plugin.invoke(generate, world, random, chunkX, chunkZ, biomes, chunk);
        if (result != null && !result.isNull()) {
            Object selected = HostInterop.unwrap(result);
            if (selected instanceof ChunkData) {
                return (ChunkData) selected;
            }
            throw new IllegalStateException("world generator generate callback must return ChunkData or None/undefined");
        }
        return chunk;
    }

    @Override
    public List<BlockPopulator> getDefaultPopulators(World world) {
        if (defaultPopulators == null) {
            return Collections.emptyList();
        }
        Value result = plugin.invoke(defaultPopulators, world);
        if (result == null || result.isNull()) {
            return Collections.emptyList();
        }
        List<BlockPopulator> populators = new ArrayList<>();
        for (Object item : HostInterop.packedArguments(result)) {
            Object raw = HostInterop.unwrap(item);
            if (!(raw instanceof BlockPopulator)) {
                throw new IllegalStateException("defaultPopulators/default_populators must return block populators");
            }
            populators.add((BlockPopulator) raw);
        }
        return populators;
    }

    @Override
    public Location getFixedSpawnLocation(World world, Random random) {
        if (fixedSpawn == null) {
            return null;
        }
        Value result = plugin.invoke(fixedSpawn, world, random);
        if (result == null || result.isNull()) {
            return null;
        }
        Object raw = HostInterop.unwrap(result);
        if (!(raw instanceof Location)) {
            throw new IllegalStateException("fixedSpawn/fixed_spawn must return Location or None/undefined");
        }
        return (Location) raw;
    }
}
