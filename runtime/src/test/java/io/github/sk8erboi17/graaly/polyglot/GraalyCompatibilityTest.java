package io.github.sk8erboi17.graaly.polyglot;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.bukkit.World;

final class GraalyCompatibilityTest {
    @Test
    void comparesHistoricalAndCalendarVersionsNumerically() {
        assertTrue(GraalyCompatibility.compareVersions("1.7.10", "1.8") < 0);
        assertTrue(GraalyCompatibility.compareVersions("1.19.4", "1.20") < 0);
        assertTrue(GraalyCompatibility.compareVersions("1.21.10", "26.1") < 0);
        assertTrue(GraalyCompatibility.compareVersions("26.2", "1.21.10") > 0);
        assertEquals(0, GraalyCompatibility.compareVersions("1.20", "1.20.0"));
    }

    @Test
    void canonicalConstantNamespacesAlsoResolveAsPublicTypes() {
        assertEquals("org.bukkit.Material",
                PolyglotTypeCatalog.constantRuntimeTypeForExport("Materials"));
        assertEquals("org.bukkit.Material",
                PolyglotTypeCatalog.constantRuntimeTypeForExport("Material"));
        assertEquals("org.bukkit.Particle",
                PolyglotTypeCatalog.constantRuntimeTypeForExport("Particle"));
        assertEquals("org.bukkit.potion.PotionEffectType",
                PolyglotTypeCatalog.constantRuntimeTypeForExport("PotionEffectType"));
    }

    @Test
    void canonicalLatestMembersRemainKnownWhenCompilingAgainstTheOldBaseline() {
        assertEquals("org.bukkit.World",
                PolyglotTypeCatalog.canonicalInstanceOwner(World.class, "spawnParticle"));
    }

    @Test
    void canonicalEnumsAdaptToHistoricalNumericConstructors() {
        LegacyNumericTarget target = (LegacyNumericTarget) HostInterop.construct(
                LegacyNumericTarget.class, CanonicalCursor.PLAYER);
        assertEquals(7, target.value);
    }

    public enum CanonicalCursor {
        PLAYER;

        public byte getValue() {
            return 7;
        }
    }

    public static final class LegacyNumericTarget {
        final byte value;

        public LegacyNumericTarget(byte value) {
            this.value = value;
        }
    }
}
