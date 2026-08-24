package io.github.sk8erboi17.graaly.polyglot;

/** A stable, language-facing error for functionality absent on this server. */
public final class GraalyUnsupportedFeatureException extends UnsupportedOperationException {
    private final String feature;
    private final String minecraftVersion;

    GraalyUnsupportedFeatureException(String feature, String minecraftVersion, String explanation) {
        super("Graaly feature '" + feature + "' is unavailable on Minecraft "
                + minecraftVersion + ". " + explanation);
        this.feature = feature;
        this.minecraftVersion = minecraftVersion;
    }

    public String getFeature() {
        return feature;
    }

    public String getMinecraftVersion() {
        return minecraftVersion;
    }
}
