package io.github.sk8erboi17.graaly.polyglot;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.event.player.AsyncPlayerChatEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.scoreboard.DisplaySlot;
import org.bukkit.scoreboard.Objective;
import org.bukkit.scoreboard.Scoreboard;
import org.bukkit.scoreboard.Team;
import org.graalvm.polyglot.Value;

import java.lang.reflect.Array;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.IdentityHashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;

/** Host target for the Graaly React renderer and the Python declarative UI. */
public final class GraalyUiScriptApi {
    private static final Gson GSON = new Gson();
    private static final int MAX_MESSAGES_REMEMBERED = 256;
    private static final int MAX_SCOREBOARD_LINES = 15;
    private static final ChatColor[] SCORE_ENTRIES = {
            ChatColor.BLACK, ChatColor.DARK_BLUE, ChatColor.DARK_GREEN,
            ChatColor.DARK_AQUA, ChatColor.DARK_RED, ChatColor.DARK_PURPLE,
            ChatColor.GOLD, ChatColor.GRAY, ChatColor.DARK_GRAY,
            ChatColor.BLUE, ChatColor.GREEN, ChatColor.AQUA,
            ChatColor.RED, ChatColor.LIGHT_PURPLE, ChatColor.YELLOW
    };

    private final PolyglotPlugin plugin;
    private final GraalyCompatibility compatibility;
    private final UiListener listener = new UiListener();
    private final Map<UUID, PlayerSession> sessions = new ConcurrentHashMap<>();
    private final Map<Inventory, InventorySession> inventories = new IdentityHashMap<>();
    private BukkitTask bossBarTracker;
    private boolean active;
    private boolean listenersRegistered;

    GraalyUiScriptApi(PolyglotPlugin plugin, GraalyCompatibility compatibility) {
        this.plugin = plugin;
        this.compatibility = compatibility;
    }

    /** Apply one immutable renderer snapshot for a player. */
    public void render(Object viewer, String snapshotJson, Value actionCallback) {
        Player player = requirePlayer(viewer);
        if (actionCallback == null || !actionCallback.canExecute()) {
            throw new IllegalArgumentException("UI action callback must be executable");
        }
        JsonElement parsed = JsonParser.parseString(snapshotJson == null ? "{}" : snapshotJson);
        if (!parsed.isJsonObject()) {
            throw new IllegalArgumentException("Graaly UI snapshot must be a JSON object");
        }
        Runnable apply = () -> apply(player, parsed.getAsJsonObject(), actionCallback);
        if (plugin.getServer().isPrimaryThread()) {
            apply.run();
        } else {
            plugin.getServer().getScheduler().runTask(plugin.asPlugin(), apply);
        }
    }

    public void clear(Object viewer) {
        Player player = requirePlayer(viewer);
        Runnable clear = () -> clearPlayer(player.getUniqueId(), true);
        if (plugin.getServer().isPrimaryThread()) {
            clear.run();
        } else {
            plugin.getServer().getScheduler().runTask(plugin.asPlugin(), clear);
        }
    }

    /** Imperative escape hatch used by typed React refs. The next React commit remains authoritative. */
    public void dismiss(Object viewer, String surface) {
        Player player = requirePlayer(viewer);
        String selected = surface == null ? "" : surface.trim();
        Runnable dismiss = () -> dismissSurface(player.getUniqueId(), selected);
        if (plugin.getServer().isPrimaryThread()) {
            dismiss.run();
        } else {
            plugin.getServer().getScheduler().runTask(plugin.asPlugin(), dismiss);
        }
    }

    synchronized void activate() {
        if (active) {
            return;
        }
        active = true;
    }

    synchronized void deactivate() {
        if (!active) {
            return;
        }
        active = false;
        if (listenersRegistered) {
            HandlerList.unregisterAll(listener);
            listenersRegistered = false;
        }
        if (bossBarTracker != null) {
            bossBarTracker.cancel();
            bossBarTracker = null;
        }
        for (UUID playerId : new ArrayList<>(sessions.keySet())) {
            clearPlayer(playerId, true);
        }
        sessions.clear();
        inventories.clear();
    }

    private void apply(Player player, JsonObject snapshot, Value callback) {
        if (!active || !player.isOnline()) {
            return;
        }
        ensureListeners();
        PlayerSession session = sessions.computeIfAbsent(player.getUniqueId(), ignored -> new PlayerSession(player));
        session.player = player;
        session.callback = callback;
        renderMessages(session, array(snapshot, "messages"));
        renderInventory(session, object(snapshot, "inventory"));
        renderScoreboard(session, object(snapshot, "scoreboard"));
        renderBossBar(session, object(snapshot, "bossBar"));
        renderTab(session, object(snapshot, "tab"));
        renderChatInput(session, object(snapshot, "input"));
    }

    /** Keep plugins that never render UI free from listeners and tracking tasks. */
    private synchronized void ensureListeners() {
        if (!active || listenersRegistered) {
            return;
        }
        plugin.getServer().getPluginManager().registerEvents(listener, plugin.asPlugin());
        bossBarTracker = plugin.getServer().getScheduler().runTaskTimer(plugin.asPlugin(),
                this::trackBossBars, 20L, 20L);
        listenersRegistered = true;
    }

    private void renderMessages(PlayerSession session, JsonArray messages) {
        for (JsonElement element : messages) {
            if (!element.isJsonObject()) {
                continue;
            }
            JsonObject message = element.getAsJsonObject();
            String id = text(message, "id", "");
            if (id.isEmpty() || !session.deliveredMessages.add(id)) {
                continue;
            }
            while (session.deliveredMessages.size() > MAX_MESSAGES_REMEMBERED) {
                Iterator<String> iterator = session.deliveredMessages.iterator();
                iterator.next();
                iterator.remove();
            }
            String content = color(text(message, "text", ""));
            String channel = text(message, "channel", "chat").toLowerCase(java.util.Locale.ENGLISH);
            if ("actionbar".equals(channel)) {
                sendActionBar(session.player, content);
            } else if ("title".equals(channel)) {
                sendTitle(session.player, content, color(text(message, "subtitle", "")));
            } else {
                session.player.sendMessage(content);
            }
        }
    }

    private void renderInventory(PlayerSession session, JsonObject definition) {
        if (definition == null) {
            removeInventory(session, true);
            return;
        }
        String viewId = requiredText(definition, "id", "Inventory id");
        int rows = clamp(integer(definition, "rows", 3), 1, 6);
        String title = clip(color(text(definition, "title", "Inventory")), 32);
        InventorySession inventorySession = session.inventory;
        if (inventorySession == null || !inventorySession.viewId.equals(viewId)
                || inventorySession.inventory.getSize() != rows * 9
                || !inventorySession.title.equals(title)) {
            removeInventory(session, false);
            Inventory inventory = Bukkit.createInventory(null, rows * 9, title);
            inventorySession = new InventorySession(viewId, title, inventory);
            session.inventory = inventorySession;
            inventories.put(inventory, inventorySession);
            session.player.openInventory(inventory);
        }

        inventorySession.closeActionId = text(definition, "closeActionId", "");
        inventorySession.actions.clear();
        Set<Integer> nextSlots = new LinkedHashSet<>();
        for (JsonElement itemElement : array(definition, "items")) {
            if (!itemElement.isJsonObject()) {
                continue;
            }
            JsonObject item = itemElement.getAsJsonObject();
            int slot = integer(item, "slot", -1);
            if (slot < 0 || slot >= inventorySession.inventory.getSize()) {
                throw new IllegalArgumentException("Inventory item slot " + slot + " is outside 0.."
                        + (inventorySession.inventory.getSize() - 1));
            }
            nextSlots.add(slot);
            String fingerprint = GSON.toJson(item);
            if (!fingerprint.equals(inventorySession.itemFingerprints.get(slot))) {
                inventorySession.inventory.setItem(slot, createItem(item));
                inventorySession.itemFingerprints.put(slot, fingerprint);
            }
            String actionId = text(item, "actionId", "");
            if (!actionId.isEmpty()) {
                inventorySession.actions.put(slot, actionId);
            }
        }
        for (Integer previousSlot : new ArrayList<>(inventorySession.itemFingerprints.keySet())) {
            if (!nextSlots.contains(previousSlot)) {
                inventorySession.inventory.clear(previousSlot);
                inventorySession.itemFingerprints.remove(previousSlot);
            }
        }
    }

    private ItemStack createItem(JsonObject definition) {
        String materialName = requiredText(definition, "material", "Item material").toUpperCase(java.util.Locale.ENGLISH);
        Material material = compatibility.material(materialName);
        int amount = clamp(integer(definition, "amount", 1), 1, Math.max(1, material.getMaxStackSize()));
        ItemStack stack = new ItemStack(material, amount);
        int durability = integer(definition, "durability", 0);
        if (durability != 0) {
            stack.setDurability((short) durability);
        }
        ItemMeta meta = stack.getItemMeta();
        if (meta != null) {
            if (definition.has("name")) {
                meta.setDisplayName(color(text(definition, "name", "")));
            }
            JsonArray lore = array(definition, "lore");
            if (!lore.isEmpty()) {
                List<String> lines = new ArrayList<>();
                for (JsonElement line : lore) {
                    lines.add(color(line.getAsString()));
                }
                meta.setLore(lines);
            }
            stack.setItemMeta(meta);
        }
        return stack;
    }

    private void renderScoreboard(PlayerSession session, JsonObject definition) {
        if (definition == null) {
            removeScoreboard(session);
            return;
        }
        if (session.scoreboard == null) {
            Scoreboard previous = session.player.getScoreboard();
            Scoreboard board = plugin.getServer().getScoreboardManager().getNewScoreboard();
            Objective objective = board.registerNewObjective("graaly", "dummy");
            objective.setDisplaySlot(DisplaySlot.SIDEBAR);
            session.scoreboard = new ScoreboardSession(previous, board, objective);
            session.player.setScoreboard(board);
        }
        ScoreboardSession scoreboard = session.scoreboard;
        scoreboard.objective.setDisplayName(clip(color(text(definition, "title", "Graaly")), 32));
        JsonArray lines = array(definition, "lines");
        int count = Math.min(MAX_SCOREBOARD_LINES, lines.size());
        for (int index = 0; index < MAX_SCOREBOARD_LINES; index++) {
            String entry = SCORE_ENTRIES[index].toString() + ChatColor.RESET;
            Team team = scoreboard.board.getTeam("graaly" + index);
            if (team == null) {
                team = scoreboard.board.registerNewTeam("graaly" + index);
                team.addEntry(entry);
            }
            if (index >= count) {
                scoreboard.board.resetScores(entry);
                team.setPrefix("");
                team.setSuffix("");
                continue;
            }
            JsonElement rawLine = lines.get(index);
            String line = rawLine.isJsonObject()
                    ? text(rawLine.getAsJsonObject(), "text", "") : rawLine.getAsString();
            applyTeamText(team, color(line));
            scoreboard.objective.getScore(entry).setScore(count - index);
        }
    }

    private void renderBossBar(PlayerSession session, JsonObject definition) {
        if (definition == null) {
            removeBossBar(session);
            return;
        }
        String title = clip(color(text(definition, "text", "")), 64);
        double progress = Math.max(0.0D, Math.min(1.0D, decimal(definition, "progress", 1.0D)));
        BossBarSession bossBar = session.bossBar;
        if (bossBar == null) {
            removeBossBar(session);
            bossBar = new BossBarSession(createBossBar(session.player, title, progress), title, progress);
            session.bossBar = bossBar;
        } else if (!bossBar.title.equals(title) || Double.compare(bossBar.progress, progress) != 0) {
            try {
                bossBar.handle.update(title, progress);
            } catch (Exception failure) {
                throw new IllegalStateException("Could not update boss bar", failure);
            }
            bossBar.title = title;
            bossBar.progress = progress;
        }
    }

    private void renderTab(PlayerSession session, JsonObject definition) {
        if (definition == null) {
            if (session.hasTab) {
                setTab(session.player, "", "");
                session.hasTab = false;
                session.tabHeader = "";
                session.tabFooter = "";
            }
            return;
        }
        String headerText = color(text(definition, "header", ""));
        String footerText = color(text(definition, "footer", ""));
        if (session.hasTab && session.tabHeader.equals(headerText) && session.tabFooter.equals(footerText)) {
            return;
        }
        setTab(session.player, headerText, footerText);
        session.hasTab = true;
        session.tabHeader = headerText;
        session.tabFooter = footerText;
    }

    private void renderChatInput(PlayerSession session, JsonObject definition) {
        if (definition == null) {
            session.input = null;
            return;
        }
        String inputId = requiredText(definition, "id", "ChatInput id");
        boolean created = session.input == null || !session.input.inputId.equals(inputId);
        ChatInputSession input = created ? new ChatInputSession(inputId) : session.input;
        input.prompt = text(definition, "prompt", "Type your answer in chat.");
        input.value = text(definition, "value", "");
        input.cancelWord = text(definition, "cancelWord", "cancel");
        input.submitActionId = text(definition, "submitActionId", "");
        input.cancelActionId = text(definition, "cancelActionId", "");
        session.input = input;
        if (created && !input.prompt.isEmpty()) {
            session.player.sendMessage(color(input.prompt));
        }
    }

    private BossBarHandle createBossBar(Player player, String title, double progress) {
        try {
            ClassLoader apiLoader = Bukkit.class.getClassLoader();
            Class<?> colorType = Class.forName("org.bukkit.boss.BarColor", false, apiLoader);
            Class<?> styleType = Class.forName("org.bukkit.boss.BarStyle", false, apiLoader);
            Class<?> flagType = Class.forName("org.bukkit.boss.BarFlag", false, apiLoader);
            Object color = Enum.valueOf(colorType.asSubclass(Enum.class), "PURPLE");
            Object style = Enum.valueOf(styleType.asSubclass(Enum.class), "SOLID");
            Object flags = Array.newInstance(flagType, 0);
            Method factory = Bukkit.class.getMethod("createBossBar", String.class,
                    colorType, styleType, flags.getClass());
            Object bar = factory.invoke(null, title, color, style, flags);
            call(bar, "setProgress", progress);
            call(bar, "addPlayer", player);
            return new ModernBossBarHandle(bar);
        } catch (ClassNotFoundException | NoSuchMethodException unavailable) {
            try {
                return new LegacyBossBarHandle(player, title, progress);
            } catch (Throwable legacyFailure) {
                plugin.getLogger().log(Level.WARNING,
                        "Boss bars are unavailable on this server; using action-bar fallback", legacyFailure);
                sendActionBar(player, title);
                return new ActionBarBossBarHandle(player);
            }
        } catch (Throwable failure) {
            throw new IllegalStateException("Could not create boss bar", failure);
        }
    }

    private static void sendActionBar(Player player, String message) {
        try {
            call(player, "sendActionBar", message);
            return;
        } catch (Throwable ignored) {
        }
        try {
            ClassLoader loader = player.getClass().getClassLoader();
            Class<?> chatType = Class.forName("net.md_5.bungee.api.ChatMessageType", false, loader);
            Class<?> textType = Class.forName("net.md_5.bungee.api.chat.TextComponent", false, loader);
            Object components = textType.getMethod("fromLegacyText", String.class).invoke(null, message);
            Object actionBar = Enum.valueOf(chatType.asSubclass(Enum.class), "ACTION_BAR");
            Object spigot = call(player, "spigot");
            call(spigot, "sendMessage", actionBar, components);
            return;
        } catch (Throwable ignored) {
        }
        player.sendMessage(message);
    }

    private static void sendTitle(Player player, String title, String subtitle) {
        try {
            call(player, "sendTitle", title, subtitle);
        } catch (Throwable unavailable) {
            player.sendMessage(title + (subtitle.isEmpty() ? "" : " " + subtitle));
        }
    }

    private static void setTab(Player player, String header, String footer) {
        try {
            call(player, "setPlayerListHeaderFooter", header, footer);
            return;
        } catch (Throwable ignored) {
        }
        try {
            ClassLoader loader = player.getClass().getClassLoader();
            Class<?> textType = Class.forName("net.md_5.bungee.api.chat.TextComponent", false, loader);
            Object headerComponents = textType.getMethod("fromLegacyText", String.class).invoke(null, header);
            Object footerComponents = textType.getMethod("fromLegacyText", String.class).invoke(null, footer);
            call(player, "setPlayerListHeaderFooter", headerComponents, footerComponents);
        } catch (Throwable ignored) {
            // Very old Spigot releases have no public tab header/footer API.
        }
    }

    private static Object call(Object target, String methodName, Object... arguments) throws Exception {
        Class<?> type = target instanceof Class<?> ? (Class<?>) target : target.getClass();
        for (Method method : allMethods(type)) {
            if (!method.getName().equals(methodName)
                    || method.getParameterTypes().length != arguments.length
                    || !compatible(method.getParameterTypes(), arguments)) {
                continue;
            }
            method.setAccessible(true);
            return method.invoke(target instanceof Class<?> ? null : target, arguments);
        }
        throw new NoSuchMethodException(type.getName() + '.' + methodName);
    }

    private static Object construct(Class<?> type, Object... arguments) throws Exception {
        for (Constructor<?> constructor : type.getDeclaredConstructors()) {
            if (constructor.getParameterTypes().length == arguments.length
                    && compatible(constructor.getParameterTypes(), arguments)) {
                constructor.setAccessible(true);
                return constructor.newInstance(arguments);
            }
        }
        throw new NoSuchMethodException("No compatible constructor for " + type.getName());
    }

    private static List<Method> allMethods(Class<?> type) {
        LinkedHashMap<String, Method> methods = new LinkedHashMap<>();
        for (Class<?> current = type; current != null; current = current.getSuperclass()) {
            for (Method method : current.getDeclaredMethods()) {
                String key = method.getName() + java.util.Arrays.toString(method.getParameterTypes());
                methods.putIfAbsent(key, method);
            }
        }
        for (Method method : type.getMethods()) {
            String key = method.getName() + java.util.Arrays.toString(method.getParameterTypes());
            methods.putIfAbsent(key, method);
        }
        return new ArrayList<>(methods.values());
    }

    private static boolean compatible(Class<?>[] parameters, Object[] arguments) {
        for (int index = 0; index < parameters.length; index++) {
            Object value = arguments[index];
            if (value == null) {
                if (parameters[index].isPrimitive()) return false;
                continue;
            }
            Class<?> expected = wrap(parameters[index]);
            if (!expected.isAssignableFrom(value.getClass())) return false;
        }
        return true;
    }

    private static Class<?> wrap(Class<?> type) {
        if (!type.isPrimitive()) return type;
        if (type == boolean.class) return Boolean.class;
        if (type == byte.class) return Byte.class;
        if (type == short.class) return Short.class;
        if (type == int.class) return Integer.class;
        if (type == long.class) return Long.class;
        if (type == float.class) return Float.class;
        if (type == double.class) return Double.class;
        if (type == char.class) return Character.class;
        return type;
    }

    private static Object field(Object target, String name) throws Exception {
        for (Class<?> current = target.getClass(); current != null; current = current.getSuperclass()) {
            try {
                Field field = current.getDeclaredField(name);
                field.setAccessible(true);
                return field.get(target);
            } catch (NoSuchFieldException ignored) {
            }
        }
        throw new NoSuchFieldException(target.getClass().getName() + '.' + name);
    }

    private static Class<?> nmsClass(Player player, String simpleName) throws ClassNotFoundException {
        String craftPackage = player.getClass().getPackage().getName();
        String prefix = "org.bukkit.craftbukkit";
        String version = craftPackage.startsWith(prefix + ".")
                ? craftPackage.substring(prefix.length() + 1).split("\\.")[0] : "";
        String name = version.startsWith("v")
                ? "net.minecraft.server." + version + '.' + simpleName
                : "net.minecraft.server." + simpleName;
        return Class.forName(name, false, player.getClass().getClassLoader());
    }

    private interface BossBarHandle {
        void update(String title, double progress) throws Exception;
        void track(Player player) throws Exception;
        void remove();
    }

    private static final class ModernBossBarHandle implements BossBarHandle {
        private final Object bar;

        private ModernBossBarHandle(Object bar) {
            this.bar = bar;
        }

        @Override
        public void update(String title, double progress) throws Exception {
            call(bar, "setTitle", title);
            call(bar, "setProgress", progress);
        }

        @Override
        public void track(Player player) {
        }

        @Override
        public void remove() {
            try {
                call(bar, "removeAll");
            } catch (Throwable ignored) {
            }
        }
    }

    private static final class ActionBarBossBarHandle implements BossBarHandle {
        private final Player player;

        private ActionBarBossBarHandle(Player player) {
            this.player = player;
        }

        @Override
        public void update(String title, double progress) {
            sendActionBar(player, title);
        }

        @Override
        public void track(Player player) {
        }

        @Override
        public void remove() {
        }
    }

    /** Reflection-only 1.8 boss bar; no CraftBukkit or NMS class is linked. */
    private static final class LegacyBossBarHandle implements BossBarHandle {
        private final Player player;
        private final Object playerHandle;
        private final Object world;
        private final Object wither;

        private LegacyBossBarHandle(Player player, String title, double progress) throws Exception {
            this.player = player;
            this.playerHandle = call(player, "getHandle");
            this.world = field(playerHandle, "world");
            this.wither = construct(nmsClass(player, "EntityWither"), world);
            call(wither, "setInvisible", true);
            call(wither, "setCustomNameVisible", true);
            updateEntity(title, progress);
            move(player);
            send(construct(nmsClass(player, "PacketPlayOutSpawnEntityLiving"), wither));
        }

        @Override
        public void update(String title, double progress) throws Exception {
            updateEntity(title, progress);
            Object id = call(wither, "getId");
            Object watcher = call(wither, "getDataWatcher");
            send(construct(nmsClass(player, "PacketPlayOutEntityMetadata"), id, watcher, true));
        }

        @Override
        public void track(Player current) throws Exception {
            Object currentHandle = call(current, "getHandle");
            if (field(currentHandle, "world") != world) {
                throw new IllegalStateException("Player changed world");
            }
            move(current);
            send(construct(nmsClass(player, "PacketPlayOutEntityTeleport"), wither));
        }

        @Override
        public void remove() {
            try {
                int id = ((Number) call(wither, "getId")).intValue();
                Class<?> packet = nmsClass(player, "PacketPlayOutEntityDestroy");
                Object destroy;
                try {
                    destroy = construct(packet, (Object) new int[]{id});
                } catch (Exception oneIdConstructor) {
                    destroy = construct(packet, id);
                }
                send(destroy);
            } catch (Throwable ignored) {
            }
        }

        private void updateEntity(String title, double progress) throws Exception {
            call(wither, "setCustomName", title);
            float maximum = ((Number) call(wither, "getMaxHealth")).floatValue();
            call(wither, "setHealth", Math.max(1.0F, maximum * (float) progress));
        }

        private void move(Player current) throws Exception {
            double yaw = Math.toRadians(current.getLocation().getYaw());
            double x = current.getLocation().getX() - Math.sin(yaw) * 24.0D;
            double z = current.getLocation().getZ() + Math.cos(yaw) * 24.0D;
            double y = current.getLocation().getY() - 12.0D;
            call(wither, "setLocation", x, y, z, 0.0F, 0.0F);
        }

        private void send(Object packet) throws Exception {
            Object connection = field(playerHandle, "playerConnection");
            call(connection, "sendPacket", packet);
        }
    }

    private void trackBossBars() {
        for (PlayerSession session : new ArrayList<>(sessions.values())) {
            if (session.bossBar == null || !session.player.isOnline()) {
                continue;
            }
            try {
                session.bossBar.handle.track(session.player);
            } catch (Throwable failure) {
                plugin.getLogger().log(Level.WARNING, "Could not update a boss bar", failure);
                removeBossBar(session);
            }
        }
    }

    private void emitAction(PlayerSession session, Map<String, Object> action) {
        if (!active || session.callback == null || !session.callback.canExecute()) {
            return;
        }
        Map<String, Object> player = new LinkedHashMap<>();
        player.put("id", session.player.getUniqueId().toString());
        player.put("name", session.player.getName());
        action.put("player", player);
        String payload = GSON.toJson(action);
        plugin.getServer().getScheduler().runTask(plugin.asPlugin(), () -> {
            if (!active || !session.player.isOnline()) {
                return;
            }
            try {
                plugin.invoke(session.callback, payload);
            } catch (Throwable throwable) {
                plugin.getLogger().log(Level.SEVERE, "Could not dispatch a Graaly UI action", throwable);
            }
        });
    }

    private void removeInventory(PlayerSession session, boolean close) {
        InventorySession current = session.inventory;
        if (current == null) {
            return;
        }
        inventories.remove(current.inventory);
        session.inventory = null;
        if (close && session.player.getOpenInventory() != null
                && session.player.getOpenInventory().getTopInventory() == current.inventory) {
            session.player.closeInventory();
        }
    }

    private void removeScoreboard(PlayerSession session) {
        if (session.scoreboard == null) {
            return;
        }
        if (session.player.getScoreboard() == session.scoreboard.board) {
            session.player.setScoreboard(session.scoreboard.previous);
        }
        session.scoreboard = null;
    }

    private void removeBossBar(PlayerSession session) {
        if (session.bossBar == null) {
            return;
        }
        session.bossBar.handle.remove();
        session.bossBar = null;
    }

    private void clearPlayer(UUID playerId, boolean closeInventory) {
        PlayerSession session = sessions.remove(playerId);
        if (session == null) {
            return;
        }
        removeInventory(session, closeInventory);
        removeScoreboard(session);
        removeBossBar(session);
        if (session.hasTab && session.player.isOnline()) {
            setTab(session.player, "", "");
        }
        session.input = null;
    }

    private void dismissSurface(UUID playerId, String surface) {
        PlayerSession session = sessions.get(playerId);
        if (session == null) {
            return;
        }
        switch (surface.toLowerCase(java.util.Locale.ENGLISH)) {
            case "inventory":
                removeInventory(session, true);
                return;
            case "scoreboard":
                removeScoreboard(session);
                return;
            case "bossbar":
                removeBossBar(session);
                return;
            case "tab":
                if (session.hasTab) {
                    setTab(session.player, "", "");
                    session.hasTab = false;
                    session.tabHeader = "";
                    session.tabFooter = "";
                }
                return;
            case "input":
                session.input = null;
                return;
            default:
                throw new IllegalArgumentException("Unknown Graaly UI surface " + surface);
        }
    }

    private static void applyTeamText(Team team, String value) {
        String selected = clip(value, 30);
        int boundary = Math.min(16, selected.length());
        if (boundary > 0 && selected.charAt(boundary - 1) == ChatColor.COLOR_CHAR) {
            boundary--;
        }
        String prefix = selected.substring(0, boundary);
        String remainder = selected.substring(boundary);
        String colors = ChatColor.getLastColors(prefix);
        String suffix = clip(colors + remainder, 16);
        if (!team.getPrefix().equals(prefix)) {
            team.setPrefix(prefix);
        }
        if (!team.getSuffix().equals(suffix)) {
            team.setSuffix(suffix);
        }
    }

    private static JsonObject object(JsonObject source, String name) {
        JsonElement element = source.get(name);
        return element == null || element.isJsonNull() ? null
                : element.isJsonObject() ? element.getAsJsonObject() : null;
    }

    private static JsonArray array(JsonObject source, String name) {
        JsonElement element = source.get(name);
        return element != null && element.isJsonArray() ? element.getAsJsonArray() : new JsonArray();
    }

    private static String text(JsonObject source, String name, String fallback) {
        JsonElement element = source.get(name);
        return element == null || element.isJsonNull() ? fallback : element.getAsString();
    }

    private static String requiredText(JsonObject source, String name, String description) {
        String value = text(source, name, "").trim();
        if (value.isEmpty()) {
            throw new IllegalArgumentException(description + " cannot be empty");
        }
        return value;
    }

    private static int integer(JsonObject source, String name, int fallback) {
        JsonElement element = source.get(name);
        return element == null || element.isJsonNull() ? fallback : element.getAsInt();
    }

    private static double decimal(JsonObject source, String name, double fallback) {
        JsonElement element = source.get(name);
        return element == null || element.isJsonNull() ? fallback : element.getAsDouble();
    }

    private static int clamp(int value, int minimum, int maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }

    private static String clip(String value, int maximum) {
        if (value == null || value.length() <= maximum) {
            return value == null ? "" : value;
        }
        int end = maximum;
        if (end > 0 && value.charAt(end - 1) == ChatColor.COLOR_CHAR) {
            end--;
        }
        return value.substring(0, end);
    }

    private static String color(String value) {
        return ChatColor.translateAlternateColorCodes('&', value == null ? "" : value);
    }

    private static Player requirePlayer(Object viewer) {
        Object value = viewer;
        if (viewer instanceof Value && ((Value) viewer).isHostObject()) {
            value = ((Value) viewer).asHostObject();
        }
        if (!(value instanceof Player)) {
            throw new IllegalArgumentException("Graaly UI requires a Player viewer");
        }
        return (Player) value;
    }

    private final class UiListener implements Listener {
        @EventHandler
        public void onChat(AsyncPlayerChatEvent event) {
            PlayerSession current = sessions.get(event.getPlayer().getUniqueId());
            if (current == null || current.input == null) {
                return;
            }
            event.setCancelled(true);
            UUID playerId = event.getPlayer().getUniqueId();
            String message = event.getMessage();
            plugin.getServer().getScheduler().runTask(plugin.asPlugin(), () -> {
                PlayerSession session = sessions.get(playerId);
                if (session == null || session.input == null) {
                    return;
                }
                ChatInputSession input = session.input;
                boolean cancelled = !input.cancelWord.isEmpty()
                        && input.cancelWord.equalsIgnoreCase(message.trim());
                Map<String, Object> action = new LinkedHashMap<>();
                action.put("type", cancelled ? "input.cancel" : "input.submit");
                action.put("viewId", input.inputId);
                action.put("actionId", cancelled ? input.cancelActionId : input.submitActionId);
                action.put("value", cancelled ? input.value : message);
                emitAction(session, action);
            });
        }

        @EventHandler
        public void onClick(InventoryClickEvent event) {
            Inventory top = event.getView().getTopInventory();
            InventorySession inventory = inventories.get(top);
            if (inventory == null || !(event.getWhoClicked() instanceof Player)) {
                return;
            }
            PlayerSession session = sessions.get(event.getWhoClicked().getUniqueId());
            if (session == null || session.inventory != inventory) {
                return;
            }
            event.setCancelled(true);
            if (event.getRawSlot() < 0 || event.getRawSlot() >= top.getSize()) {
                return;
            }
            String actionId = inventory.actions.get(event.getRawSlot());
            if (actionId == null) {
                return;
            }
            Map<String, Object> action = new LinkedHashMap<>();
            action.put("type", "inventory.click");
            action.put("viewId", inventory.viewId);
            action.put("actionId", actionId);
            action.put("slot", event.getRawSlot());
            action.put("click", event.getClick().name());
            action.put("shift", event.isShiftClick());
            action.put("right", event.isRightClick());
            emitAction(session, action);
        }

        @EventHandler
        public void onDrag(InventoryDragEvent event) {
            if (inventories.containsKey(event.getView().getTopInventory())) {
                event.setCancelled(true);
            }
        }

        @EventHandler
        public void onClose(InventoryCloseEvent event) {
            InventorySession inventory = inventories.get(event.getInventory());
            if (inventory == null || !(event.getPlayer() instanceof Player)) {
                return;
            }
            PlayerSession session = sessions.get(event.getPlayer().getUniqueId());
            if (session == null || session.inventory != inventory) {
                return;
            }
            Map<String, Object> action = new LinkedHashMap<>();
            action.put("type", "inventory.close");
            action.put("viewId", inventory.viewId);
            action.put("actionId", inventory.closeActionId);
            emitAction(session, action);
        }

        @EventHandler
        public void onQuit(PlayerQuitEvent event) {
            clearPlayer(event.getPlayer().getUniqueId(), false);
        }
    }

    private static final class PlayerSession {
        private Player player;
        private Value callback;
        private final Set<String> deliveredMessages = new LinkedHashSet<>();
        private InventorySession inventory;
        private ScoreboardSession scoreboard;
        private BossBarSession bossBar;
        private volatile ChatInputSession input;
        private boolean hasTab;
        private String tabHeader = "";
        private String tabFooter = "";

        private PlayerSession(Player player) {
            this.player = player;
        }
    }

    private static final class ChatInputSession {
        private final String inputId;
        private String prompt = "";
        private String value = "";
        private String cancelWord = "cancel";
        private String submitActionId = "";
        private String cancelActionId = "";

        private ChatInputSession(String inputId) {
            this.inputId = inputId;
        }
    }

    private static final class InventorySession {
        private final String viewId;
        private final String title;
        private final Inventory inventory;
        private final Map<Integer, String> actions = new LinkedHashMap<>();
        private final Map<Integer, String> itemFingerprints = new LinkedHashMap<>();
        private String closeActionId = "";

        private InventorySession(String viewId, String title, Inventory inventory) {
            this.viewId = viewId;
            this.title = title;
            this.inventory = inventory;
        }
    }

    private static final class ScoreboardSession {
        private final Scoreboard previous;
        private final Scoreboard board;
        private final Objective objective;

        private ScoreboardSession(Scoreboard previous, Scoreboard board, Objective objective) {
            this.previous = previous;
            this.board = board;
            this.objective = objective;
        }
    }

    private static final class BossBarSession {
        private final BossBarHandle handle;
        private String title;
        private double progress;

        private BossBarSession(BossBarHandle handle, String title, double progress) {
            this.handle = handle;
            this.title = title;
            this.progress = progress;
        }
    }
}
