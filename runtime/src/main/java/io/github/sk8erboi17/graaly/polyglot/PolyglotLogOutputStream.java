package io.github.sk8erboi17.graaly.polyglot;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.logging.Level;
import java.util.logging.Logger;

final class PolyglotLogOutputStream extends OutputStream {
    private final Logger logger;
    private final Level level;
    private final ByteArrayOutputStream buffer = new ByteArrayOutputStream();

    PolyglotLogOutputStream(Logger logger, Level level) {
        this.logger = logger;
        this.level = level;
    }

    @Override
    public synchronized void write(int value) {
        if (value == '\n') {
            emitLine();
        } else if (value != '\r') {
            buffer.write(value);
        }
    }

    @Override
    public synchronized void write(byte[] bytes, int offset, int length) {
        for (int i = offset; i < offset + length; i++) {
            write(bytes[i]);
        }
    }

    @Override
    public synchronized void flush() {
        emitLine();
    }

    @Override
    public synchronized void close() throws IOException {
        emitLine();
        buffer.close();
    }

    private void emitLine() {
        if (buffer.size() == 0) {
            return;
        }
        String line = new String(buffer.toByteArray(), StandardCharsets.UTF_8);
        buffer.reset();
        logger.log(level, line);
    }
}
