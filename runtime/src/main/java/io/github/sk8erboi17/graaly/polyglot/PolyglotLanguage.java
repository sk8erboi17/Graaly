package io.github.sk8erboi17.graaly.polyglot;

import java.io.File;
import java.util.Locale;

enum PolyglotLanguage {
    JAVASCRIPT("js", ".jsplugin", new String[]{".js", ".mjs"}),
    PYTHON("python", ".pyplugin", new String[]{".py"});

    private final String id;
    private final String bundleSuffix;
    private final String[] sourceSuffixes;

    PolyglotLanguage(String id, String bundleSuffix, String[] sourceSuffixes) {
        this.id = id;
        this.bundleSuffix = bundleSuffix;
        this.sourceSuffixes = sourceSuffixes;
    }

    String getId() {
        return id;
    }

    boolean acceptsMain(String filename) {
        String lower = filename.toLowerCase(Locale.ENGLISH);
        for (String suffix : sourceSuffixes) {
            if (lower.endsWith(suffix)) {
                return true;
            }
        }
        return false;
    }

    static PolyglotLanguage fromBundle(File bundle) {
        String lower = bundle.getName().toLowerCase(Locale.ENGLISH);
        for (PolyglotLanguage language : values()) {
            if (lower.endsWith(language.bundleSuffix)) {
                return language;
            }
        }
        return null;
    }
}
