package io.github.sk8erboi17.graaly.polyglot;

import org.bukkit.Chunk;
import org.bukkit.World;
import org.bukkit.generator.BlockPopulator;
import org.graalvm.polyglot.Value;

import java.util.Random;

/** Native callback adapter for Bukkit's abstract BlockPopulator extension point. */
final class ScriptBlockPopulator extends BlockPopulator {
    private final PolyglotPlugin plugin;
    private final Value callback;

    ScriptBlockPopulator(PolyglotPlugin plugin, Value callback) {
        this.plugin = plugin;
        this.callback = callback;
    }

    @Override
    public void populate(World world, Random random, Chunk source) {
        plugin.invoke(callback, world, random, source);
    }
}
