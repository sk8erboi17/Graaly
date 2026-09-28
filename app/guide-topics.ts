import latestConstants from "./generated/latest-constants.json" with { type: "json" };

export type GuideLanguage = "js" | "ts" | "py" | "c" | "java";
export type AuthoredGuideLanguage = Exclude<GuideLanguage, "c">;
export type GuideCatalogKind = "bukkit" | "support" | "wrappers" | "packets";

export type GuideOperation = {
  native: string;
  python: string;
  c: string;
  java: string;
};

export type GuideTopic = {
  id: string;
  group: string;
  title: string;
  summary: string;
  when: string;
  does: string;
  input: string;
  output: string;
  operations: readonly GuideOperation[];
  code: Record<AuthoredGuideLanguage, string>;
  javaEquivalent: string;
  flags?: readonly string[];
  note?: string;
  api?: {
    kind: GuideCatalogKind;
    name: string;
    label: string;
  };
};

function nativeCode(
  typeScriptImports: readonly string[],
  nativeLines: readonly string[],
  pythonImports: readonly string[],
  pythonLines: readonly string[],
  javaLines: readonly string[],
): Record<AuthoredGuideLanguage, string> {
  return {
    js: [
      `import { ${typeScriptImports.join(", ")} } from "graaly";`,
      "",
      ...nativeLines,
    ].join("\n"),
    ts: [
      `import { ${typeScriptImports.join(", ")} } from "graaly";`,
      "",
      ...nativeLines,
    ].join("\n"),
    py: [
      `from graaly import ${pythonImports.join(", ")}`,
      "",
      ...pythonLines,
    ].join("\n"),
    java: javaLines.join("\n"),
  };
}

function cSnake(name: string): string {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function cReceiverType(receiver: string): string | null {
  const value = receiver.trim();
  if (/^(player|target|online|senderPlayer)$/.test(value)) return "player";
  if (value === "world") return "world";
  if (/^(entity|mob)$/.test(value)) return "entity";
  if (value === "block") return "block";
  if (/^(location|spawn)$/.test(value)) return "location";
  if (value === "inventory") return "inventory";
  return null;
}

function cOperation(native: string, java: string): string {
  const value = native.trim();

  const direct: Array<[RegExp, string]> = [
    [/^commands\.on\(([^,]+),\s*handler\)$/, "graaly_commands_on($1, handler)"],
    [/^commands\.complete\(([^,]+),\s*handler\)$/, "graaly_commands_complete_on($1, completer)"],
    [/^commands\.dispatch\(([^,]+),\s*([^)]+)\)$/, "graaly_command_dispatch(sender, $2, &dispatched)"],
    [/^tasks\.run\(callback\)$/, "graaly_tasks_run(callback)"],
    [/^tasks\.later\(delay,\s*callback\)$/, "graaly_tasks_later(delay, callback)"],
    [/^tasks\.repeat\(delay,\s*period,\s*callback\)$/, "graaly_tasks_repeat(delay, period, callback)"],
    [/^tasks\.runAsync\(callback\)$/, "graaly_tasks_run_async(callback)"],
    [/^tasks\.cancel\(task\)$/, "graaly_tasks_cancel(task_id)"],
    [/^tasks\.sleep\(seconds\)$/, "graaly_ticks(seconds)"],
    [/^players(?:\.online\(\))?$/, "graaly_player_list(players, capacity, &count)"],
    [/^players\.get\(([^)]+)\)$/, "graaly_player_find($1, &player)"],
    [/^players\.exact\(([^)]+)\)$/, "graaly_player_find_exact($1, &player)"],
    [/^players\.isPlayer\(([^)]+)\)$/, "graaly_sender_player(sender, &player) == GRAALY_OK"],
    [/^players\.broadcast\(([^)]+)\)$/, "graaly_broadcast($1)"],
    [/^worlds\.all\(\)$/, "graaly_world_list(worlds, capacity, &count)"],
    [/^worlds\.get\(([^)]+)\)$/, "graaly_world_find($1, &world)"],
    [/^packets\.send\(([^,]+),\s*([^)]+)\)$/, "graaly_packet_send(player, packet)"],
    [/^packets\.sendToAll\(([^)]+)\)$/, "graaly_packet_send_all(packet)"],
    [/^packets\.receive\(([^,]+),\s*([^)]+)\)$/, "graaly_packet_receive(player, packet)"],
    [/^packets\.user\(([^)]+)\)$/, "graaly_packet_user(player, &user)"],
    [/^packets\.clientVersion\(([^)]+)\)$/, "graaly_packet_client_version(player, &version)"],
    [/^packets\.ping\(([^)]+)\)$/, "graaly_packet_ping(player, &ping)"],
  ];
  for (const [pattern, replacement] of direct) {
    if (pattern.test(value)) return value.replace(pattern, replacement);
  }

  if (value.startsWith("packets.onReceive(")) {
    return "graaly_packet_on_receive(packet_type, GRAALY_PRIORITY_NORMAL, on_packet, &binding)";
  }
  if (value.startsWith("packets.onSend(")) {
    return "graaly_packet_on_send(packet_type, GRAALY_PRIORITY_NORMAL, on_packet, &binding)";
  }
  if (value.startsWith("events.on(")) {
    return "graaly_events_on_type(event_type, \"NORMAL\", false, on_event)";
  }
  if (value.includes(".sendMessage(")) {
    return "graaly_player_message(player, message)";
  }
  if (value === "context.sender") return "graaly_sender_t sender";
  if (value === "context.args") return "argc + argv";
  if (value === "context.reply(message)") return "graaly_sender_message(sender, message)";
  if (value === "context.hasPermission(node)") return "graaly_sender_has_permission(sender, node, &allowed)";

  const assignment = value.match(/^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\s*=\s*(.+)$/);
  if (assignment) {
    const [, receiver, property] = assignment;
    const type = cReceiverType(receiver);
    if (type) return `graaly_${type}_${cSnake(property)}_write(${receiver}, value)`;
  }

  const propertyRead = value.match(/^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)$/);
  if (propertyRead) {
    const [, receiver, property] = propertyRead;
    const type = cReceiverType(receiver);
    if (type) return `graaly_${type}_${cSnake(property)}(${receiver}, &value)`;
  }

  const method = value.match(/^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\((.*)\)$/);
  if (method) {
    const [, receiver, methodName] = method;
    const type = cReceiverType(receiver);
    if (type) return `graaly_${type}_${cSnake(methodName)}(${receiver}, ...)`;
  }

  return `/* C equivalent uses the generated typed facade for: ${java.replaceAll("*/", "* /")} */`;
}

const op = (native: string, python: string, java: string, c = cOperation(native, java)): GuideOperation => ({
  native,
  python,
  c,
  java,
});

export const commandTopics: readonly GuideTopic[] = [
  {
    id: "register-command",
    group: "Commands",
    title: "Register a command",
    summary: "Handle a plugin.yml command and safely access the player who ran it.",
    when: "Use this after declaring the command name in plugin.yml.",
    does: "Runs your callback with the sender, label, arguments, reply helper, and permission helper already adapted.",
    input: "Command name and a callback",
    output: "true when handled; false to show plugin.yml usage",
    operations: [
      op("commands.on(name, handler)", "@command(name)", "PluginCommand#setExecutor(CommandExecutor)"),
      op("context.sender", "context.sender", "CommandSender sender"),
      op("players.isPlayer(sender)", "players.is_player(sender)", "sender instanceof Player"),
      op("context.reply(message)", "context.reply(message)", "CommandSender#sendMessage(String)"),
      op("context.hasPermission(node)", "context.has_permission(node)", "CommandSender#hasPermission(String)"),
    ],
    code: nativeCode(
      ["commands", "players"],
      [
        "commands.on(\"graaly\", context => {",
        "  if (!players.isPlayer(context.sender)) {",
        "    context.reply(\"&cOnly players can use this command.\");",
        "    return true;",
        "  }",
        "",
        "  const player = context.sender; // narrowed to Player",
        "  if (!context.hasPermission(\"graaly.admin\")) {",
        "    context.reply(\"&cYou do not have permission.\");",
        "    return true;",
        "  }",
        "",
        "  player.sendMessage(`§aHello ${player.name} from Graaly`);",
        "  return true;",
        "});",
      ],
      ["command", "players"],
      [
        "@command(\"graaly\")",
        "def graaly(context):",
        "    if not players.is_player(context.sender):",
        "        context.reply(\"&cOnly players can use this command.\")",
        "        return True",
        "",
        "    player = context.sender",
        "    if not context.has_permission(\"graaly.admin\"):",
        "        context.reply(\"&cYou do not have permission.\")",
        "        return True",
        "",
        "    player.send_message(f\"§aHello {player.name} from Graaly\")",
        "    return True",
      ],
      [
        "getCommand(\"graaly\").setExecutor((sender, command, label, args) -> {",
        "    if (!(sender instanceof Player player)) {",
        "        sender.sendMessage(\"§cOnly players can use this command.\");",
        "        return true;",
        "    }",
        "",
        "    if (!sender.hasPermission(\"graaly.admin\")) {",
        "        sender.sendMessage(\"§cYou do not have permission.\");",
        "        return true;",
        "    }",
        "",
        "    player.sendMessage(\"§aHello \" + player.getName() + \" from Graaly\");",
        "    return true;",
        "});",
      ],
    ),
    javaEquivalent: "JavaPlugin#getCommand(String) → PluginCommand#setExecutor(CommandExecutor)",
    flags: ["Main thread", "plugin.yml"],
    note: "context.sender is always the command sender, but it is not necessarily a Player: it may be the console or a command block. players.isPlayer(context.sender) safely narrows it to Player. players.broadcast(...) only sends a message to every online player; it does not return the player who ran the command.",
    api: { kind: "bukkit", name: "PluginCommand", label: "Open the complete PluginCommand API" },
  },
  {
    id: "command-player",
    group: "Commands",
    title: "Get the player who ran a command",
    summary: "Distinguish the executing player from the console and from a named target player.",
    when: "Use this before reading player-only state such as location, health, inventory, or world inside a command handler.",
    does: "Checks whether context.sender is a Player, narrows its type, and optionally resolves another online player from context.args.",
    input: "CommandContext and an optional player-name argument",
    output: "The executing Player, a target Player, or null/None when no target matches",
    operations: [
      op("context.sender", "context.sender", "CommandSender sender"),
      op("players.isPlayer(sender)", "players.is_player(sender)", "sender instanceof Player"),
      op("players.exact(name)", "players.exact(name)", "Bukkit.getPlayerExact(name)"),
    ],
    code: nativeCode(
      ["commands", "players"],
      [
        "commands.on(\"heal\", context => {",
        "  if (!players.isPlayer(context.sender)) {",
        "    context.reply(\"&cOnly players can use this command.\");",
        "    return true;",
        "  }",
        "",
        "  const player = context.sender; // the player who ran /heal",
        "  const targetName = context.args[0];",
        "  const target = targetName ? players.exact(targetName) : player;",
        "",
        "  if (!target) {",
        "    context.reply(`&cPlayer ${targetName} is not online.`);",
        "    return true;",
        "  }",
        "",
        "  target.health = target.maxHealth;",
        "  context.reply(`&aHealed ${target.name}.`);",
        "  return true;",
        "});",
      ],
      ["command", "players"],
      [
        "@command(\"heal\")",
        "def heal(context):",
        "    if not players.is_player(context.sender):",
        "        context.reply(\"&cOnly players can use this command.\")",
        "        return True",
        "",
        "    player = context.sender  # the player who ran /heal",
        "    target_name = context.args[0] if context.args else None",
        "    target = players.exact(target_name) if target_name else player",
        "",
        "    if target is None:",
        "        context.reply(f\"&cPlayer {target_name} is not online.\")",
        "        return True",
        "",
        "    target.health = target.max_health",
        "    context.reply(f\"&aHealed {target.name}.\")",
        "    return True",
      ],
      [
        "getCommand(\"heal\").setExecutor((sender, command, label, args) -> {",
        "    if (!(sender instanceof Player player)) {",
        "        sender.sendMessage(\"§cOnly players can use this command.\");",
        "        return true;",
        "    }",
        "",
        "    Player target = args.length > 0",
        "        ? Bukkit.getPlayerExact(args[0])",
        "        : player;",
        "",
        "    if (target == null) {",
        "        sender.sendMessage(\"§cThat player is not online.\");",
        "        return true;",
        "    }",
        "",
        "    target.setHealth(target.getMaxHealth());",
        "    sender.sendMessage(\"§aHealed \" + target.getName() + \".\");",
        "    return true;",
        "});",
      ],
    ),
    javaEquivalent: "CommandSender → instanceof Player; Bukkit#getPlayerExact(String) for a named target",
    flags: ["Main thread", "Player-only guard", "Nullable lookup"],
    note: "Use context.sender for whoever executed the command. Guard it with players.isPlayer(...) before using Player-only members. Use players.exact(context.args[0]) only when the command names a different target; the lookup can return null. context.reply(...) replies to the sender, while players.broadcast(...) messages everyone online.",
    api: { kind: "bukkit", name: "Player", label: "Open the complete Player API" },
  },
  {
    id: "command-modules",
    group: "Commands",
    title: "Load command files from main",
    summary: "Keep handlers in separate modules and include them in the deployed entry bundle.",
    when: "Use this when commands live under src/commands instead of directly inside main.mts, main.mjs, or main.py.",
    does: "Evaluates the imported module when the entry point loads, so its commands.on registration becomes active. The TypeScript build follows the import and includes the module in dist/main.mjs.",
    input: "A side-effect import in the main entry and the same command name under plugin.yml commands",
    output: "A command module loaded and registered with the rest of the plugin",
    operations: [
      op("import \"./commands/fly.mts\"", "import commands.fly", "setExecutor(new FlyCommand())"),
      op("commands.on(\"fly\", handler)", "@command(\"fly\")", "plugin.yml + PluginCommand#setExecutor"),
      op("npm run build", "source is loaded directly", "mvn package"),
    ],
    code: nativeCode(
      ["info"],
      [
        "// src/main.mts",
        "import \"./commands/fly.mts\";",
        "",
        "export function onEnable() {",
        "  info(\"Essentials enabled\");",
        "}",
      ],
      ["info"],
      [
        "# main.py",
        "import commands.fly",
        "",
        "def on_enable():",
        "    info(\"Essentials enabled\")",
      ],
      [
        "public final class Essentials extends JavaPlugin {",
        "    @Override",
        "    public void onEnable() {",
        "        getCommand(\"fly\").setExecutor(new FlyCommand());",
        "    }",
        "}",
      ],
    ),
    javaEquivalent: "Import/evaluate a module; JavaPlugin#getCommand(String) → setExecutor(CommandExecutor)",
    flags: ["Entry import", "plugin.yml", "Build before reload"],
    note: "Put commands.on(\"fly\", ...) in src/commands/fly.mts, add import \"./commands/fly.mts\" to src/main.mts, and declare fly under commands in plugin.yml. Run npm run build before /graaly reload. Graaly re-reads command declarations during reload, including new names, aliases, usage, permissions, and removed commands. Changing name, main, depend, softdepend, or loadbefore still requires a full server restart.",
    api: { kind: "bukkit", name: "PluginCommand", label: "Open the complete PluginCommand API" },
  },
  {
    id: "tab-completion",
    group: "Commands",
    title: "Add tab completion",
    summary: "Return suggestions that match the text the player has typed.",
    when: "Use it for subcommands, player names, worlds, kits, or any finite argument list.",
    does: "The server asks your callback for suggestions; returning an empty list displays no custom matches.",
    input: "Command name and completion callback",
    output: "An iterable of strings or null/None",
    operations: [
      op("commands.complete(name, handler)", "@tab_complete(name)", "PluginCommand#setTabCompleter(TabCompleter)"),
      op("context.args", "context.args", "String[] args"),
    ],
    code: nativeCode(
      ["commands"],
      [
        "commands.complete(\"graaly\", context => {",
        "  const typed = (context.args[0] ?? \"\").toLowerCase();",
        "  return [\"announce\", \"reload\", \"who\"]",
        "    .filter(value => value.startsWith(typed));",
        "});",
      ],
      ["tab_complete"],
      [
        "@tab_complete(\"graaly\")",
        "def complete_graaly(context):",
        "    typed = context.args[0].lower() if context.args else \"\"",
        "    return [value for value in (\"announce\", \"reload\", \"who\")",
        "            if value.startswith(typed)]",
      ],
      [
        "getCommand(\"graaly\").setTabCompleter((sender, command, alias, args) -> {",
        "    String typed = args.length == 0 ? \"\" : args[0].toLowerCase();",
        "    return Stream.of(\"announce\", \"reload\", \"who\")",
        "        .filter(value -> value.startsWith(typed))",
        "        .collect(Collectors.toList());",
        "});",
      ],
    ),
    javaEquivalent: "PluginCommand#setTabCompleter(TabCompleter)",
    flags: ["Main thread", "Keep it fast"],
  },
  {
    id: "dispatch-command",
    group: "Commands",
    title: "Dispatch another command",
    summary: "Run an existing command as the console or a player.",
    when: "Use it to compose existing server commands without duplicating their implementation.",
    does: "Passes a command line through the server's normal command map and permission checks.",
    input: "A CommandSender and command line without the leading slash",
    output: "Whether the server accepted the command",
    operations: [op("commands.dispatch(sender, line)", "server.dispatch_command(sender, line)", "Bukkit.dispatchCommand(sender, line)")],
    code: nativeCode(
      ["commands", "info", "server"],
      ["const accepted = commands.dispatch(server.consoleSender, \"say Server ready\");", "info(`Dispatched: ${accepted}`);"],
      ["info", "server"],
      ["accepted = server.dispatch_command(server.console_sender, \"say Server ready\")", "info(f\"Dispatched: {accepted}\")"],
      ["boolean accepted = Bukkit.dispatchCommand(Bukkit.getConsoleSender(), \"say Server ready\");", "getLogger().info(\"Dispatched: \" + accepted);"],
    ),
    javaEquivalent: "Bukkit#dispatchCommand(CommandSender, String)",
    flags: ["Main thread"],
    api: { kind: "bukkit", name: "Bukkit", label: "Open the complete Java server API" },
  },
  {
    id: "next-tick",
    group: "Tasks",
    title: "Run on the main thread",
    summary: "Schedule work for the next safe server tick.",
    when: "Use it after async I/O or inside a PacketEvents callback before changing live server state.",
    does: "Queues work on the server's primary thread and returns a cancellable task.",
    input: "A callback in JS/TS or coroutine in Python",
    output: "BukkitTask or asyncio.Task",
    operations: [op("tasks.run(callback)", "tasks.create_task(coroutine)", "BukkitScheduler#runTask(plugin, Runnable)")],
    code: nativeCode(
      ["info", "tasks"],
      ["tasks.run(() => {", "  player.teleport(world.spawnLocation);", "  player.sendMessage(\"Back on the main thread\");", "});"],
      ["tasks"],
      ["async def return_to_main():", "    player.teleport(world.spawn_location)", "    player.send_message(\"Back on the main thread\")", "", "tasks.create_task(return_to_main(), name=\"return-to-main\")"],
      ["Bukkit.getScheduler().runTask(this, () -> {", "    player.teleport(world.getSpawnLocation());", "    player.sendMessage(\"Back on the main thread\");", "});"],
    ),
    javaEquivalent: "Bukkit#getScheduler() → BukkitScheduler#runTask(Plugin, Runnable)",
    flags: ["Main thread", "Next tick"],
    api: { kind: "bukkit", name: "BukkitScheduler", label: "Open the complete BukkitScheduler API" },
  },
  {
    id: "delayed-repeating-task",
    group: "Tasks",
    title: "Delay or repeat work",
    summary: "Use scheduler callbacks in JS/TS and ordinary coroutines in Python.",
    when: "Use it for countdowns, repeating effects, timed arenas, and deferred cleanup.",
    does: "Suspends without blocking the server, then resumes work on the primary thread.",
    input: "Delay and work to run",
    output: "BukkitTask or asyncio.Task",
    operations: [
      op("tasks.later(delay, callback)", "await tasks.sleep_ticks(delay)", "BukkitScheduler#runTaskLater"),
      op("tasks.sleep(seconds)", "await asyncio.sleep(seconds)", "seconds × 20 ticks"),
      op("tasks.repeat(delay, period, callback)", "while True + await sleep_ticks(period)", "BukkitScheduler#runTaskTimer"),
    ],
    code: nativeCode(
      ["info", "tasks"],
      ["tasks.later(tasks.ticks(3), () => info(\"Three seconds passed\"));", "const clock = tasks.repeat(0, tasks.ticks(1), () => updateClock());"],
      ["info", "tasks"],
      ["import asyncio", "", "async def delayed_message():", "    await asyncio.sleep(3)", "    info(\"Three seconds passed\")", "", "async def clock_loop():", "    while True:", "        update_clock()", "        await tasks.sleep_ticks(20)", "", "tasks.create_task(delayed_message(), name=\"delayed-message\")", "clock = tasks.create_task(clock_loop(), name=\"clock\")"],
      ["Bukkit.getScheduler().runTaskLater(this, () -> getLogger().info(\"Three seconds passed\"), 60L);", "BukkitTask clock = Bukkit.getScheduler().runTaskTimer(this, this::updateClock, 0L, 20L);"],
    ),
    javaEquivalent: "BukkitScheduler#runTaskLater / runTaskTimer",
    flags: ["Main thread", "20 ticks = 1 second"],
  },
  {
    id: "python-async-await",
    group: "Tasks",
    title: "Use native Python async/await",
    summary: "Write real Python coroutines on an asyncio loop driven safely by server ticks.",
    when: "Use it for readable sequences, parallel awaitables, timeouts, and non-blocking I/O without callback nesting.",
    does: "Runs each coroutine on the main thread, advances asyncio every tick, and cancels pending work when the plugin disables.",
    input: "A coroutine or async callback",
    output: "asyncio.Task",
    operations: [
      op("tasks.delay(ticks)", "await tasks.sleep_ticks(ticks)", "BukkitScheduler#runTaskLater"),
      op("tasks.runAsync(callback)", "await tasks.to_thread(function, *args)", "BukkitScheduler#runTaskAsynchronously"),
      op("Promise.all(awaitables)", "await asyncio.gather(*awaitables)", "CompletableFuture#allOf"),
    ],
    code: nativeCode(
      ["events", "PlayerJoinEvent", "tasks"],
      ["events.on(PlayerJoinEvent, async event => {", "  await tasks.sleep(1);", "  event.player.sendMessage(\"One second later\");", "});"],
      ["PlayerJoinEvent", "event", "tasks"],
      ["import asyncio", "", "@event(PlayerJoinEvent)", "async def welcome(event):", "    await asyncio.sleep(1)", "    event.player.send_message(\"One second later\")", "", "# The standard library works directly:", "# first, second = await asyncio.gather(load_first(), load_second())"],
      ["Bukkit.getScheduler().runTaskLater(this,", "    () -> event.getPlayer().sendMessage(\"One second later\"),", "    20L", ");"],
    ),
    javaEquivalent: "Per-plugin asyncio loop → BukkitScheduler tick pump",
    flags: ["Python asyncio", "Main thread", "Auto-cancel on disable"],
    note: "Python exposes no Java scheduler callbacks. Use asyncio normally; tasks only adds create_task, sleep_ticks, to_thread, and is_main_thread.",
  },
  {
    id: "async-handoff",
    group: "Tasks",
    title: "Do I/O asynchronously",
    summary: "Keep database, HTTP, and file work away from the tick loop, then hand results back safely.",
    when: "Use it only for work that does not touch live server state.",
    does: "Runs blocking work on a worker thread, then continues safely on the next server tick.",
    input: "Blocking work and a main-thread continuation",
    output: "The function result, delivered back on the main thread",
    operations: [
      op("tasks.runAsync(callback)", "await tasks.to_thread(function, *args)", "BukkitScheduler#runTaskAsynchronously"),
      op("tasks.run(callback)", "automatic resume after await", "BukkitScheduler#runTask"),
    ],
    code: nativeCode(
      ["tasks"],
      ["tasks.runAsync(() => {", "  const result = loadFromDatabase();", "  tasks.run(() => player.sendMessage(result));", "});"],
      ["tasks"],
      ["async def load_player():", "    result = await tasks.to_thread(load_from_database)", "    # The coroutine resumes on the server's main thread.", "    player.send_message(result)", "", "tasks.create_task(load_player(), name=\"load-player\")"],
      ["Bukkit.getScheduler().runTaskAsynchronously(this, () -> {", "    String result = loadFromDatabase();", "    Bukkit.getScheduler().runTask(this, () -> player.sendMessage(result));", "});"],
    ),
    javaEquivalent: "BukkitScheduler#runTaskAsynchronously → BukkitScheduler#runTask",
    flags: ["Worker thread", "Main-thread resume", "Awaitable in Python"],
    note: "Never read or mutate worlds, blocks, inventories, entities, or most player state inside the worker function. Prefer cooperative asyncio I/O when the library supports it.",
  },
  {
    id: "cancel-task",
    group: "Tasks",
    title: "Cancel a task",
    summary: "Cancel a BukkitTask in JS/TS or a normal asyncio.Task in Python.",
    when: "Use it when a countdown ends, a player leaves, or a mechanic is disabled.",
    does: "Stops future task steps; synchronous work already running on a worker cannot be force-stopped.",
    input: "BukkitTask, task id, or asyncio.Task",
    output: "Nothing",
    operations: [op("tasks.cancel(task)", "task.cancel()", "BukkitTask#cancel()")],
    code: nativeCode(
      ["tasks"],
      ["const task = tasks.repeat(0, 20, tickArena);", "", "// Later", "tasks.cancel(task);"],
      ["tasks"],
      ["async def arena_loop():", "    while True:", "        tick_arena()", "        await tasks.sleep_ticks(20)", "", "task = tasks.create_task(arena_loop(), name=\"arena-loop\")", "", "# Later", "task.cancel()"],
      ["BukkitTask task = Bukkit.getScheduler().runTaskTimer(this, this::tickArena, 0L, 20L);", "", "// Later", "task.cancel();"],
    ),
    javaEquivalent: "BukkitTask#cancel() or BukkitScheduler#cancelTask(int)",
    flags: ["Lifecycle"],
  },
] as const;

export const playerTopics: readonly GuideTopic[] = [
  {
    id: "find-player",
    group: "Lookup",
    title: "Find players",
    summary: "Iterate everyone online or look up one player by exact or partial name.",
    when: "Start here whenever a command, task, or service needs a Player object.",
    does: "Returns native Player values, not handles that require unwrapping.",
    input: "Optional player name",
    output: "Iterable<Player>, Player, or null/None",
    operations: [
      op("players or players.online()", "players or players.online()", "Bukkit.getOnlinePlayers()"),
      op("players.get(name)", "players.get(name)", "Bukkit.getPlayer(name)"),
      op("players.exact(name)", "players.exact(name)", "Bukkit.getPlayerExact(name)"),
    ],
    code: nativeCode(
      ["players"],
      ["const names = [...players].map(({ name }) => name);", "for (const online of players) {", "  online.sendMessage(`Online as ${online.name}`);", "}", "", "const steve = players.exact(\"Steve\");", "if (steve) steve.sendMessage(\"Found you\");"],
      ["players"],
      ["names = [online.name for online in players]", "for online in players:", "    online.send_message(f\"Online as {online.name}\")", "", "steve = players.exact(\"Steve\")", "if steve is not None:", "    steve.send_message(\"Found you\")"],
      ["for (Player online : Bukkit.getOnlinePlayers()) {", "    online.sendMessage(\"Online as \" + online.getName());", "}", "", "Player steve = Bukkit.getPlayerExact(\"Steve\");", "if (steve != null) steve.sendMessage(\"Found you\");"],
    ),
    javaEquivalent: "Bukkit#getOnlinePlayers / getPlayer / getPlayerExact",
    flags: ["Main thread", "Nullable lookup"],
    api: { kind: "bukkit", name: "Player", label: "Open all Player members and overloads" },
  },
  {
    id: "player-messages-titles",
    group: "Communication",
    title: "Messages and titles",
    summary: "Send chat messages, titles, subtitles, and broadcasts.",
    when: "Use it for feedback, announcements, onboarding, and game-state cues.",
    does: "Calls the normal Player messaging API. Graaly automatically translates ampersand color codes in CommandSender.sendMessage, context.reply, and players.broadcast; use text.color for other text APIs such as titles.",
    input: "Text, title, subtitle, and optional timings",
    output: "Visible client feedback",
    operations: [
      op("player.sendMessage(text)", "player.send_message(text)", "Player#sendMessage(String)"),
      op("player.sendTitle(title, subtitle)", "player.send_title(title, subtitle)", "Player#sendTitle(String, String)"),
      op("players.broadcast(text)", "players.broadcast(text)", "Bukkit.broadcastMessage(String)"),
    ],
    code: nativeCode(
      ["players"],
      ["player.sendMessage(\"&aQuest complete!\");", "player.sendTitle(\"§6Victory\", \"§fThe arena is yours\");", "players.broadcast(`&e${player.name} won the match`);"],
      ["players"],
      ["player.send_message(\"&aQuest complete!\")", "player.send_title(\"§6Victory\", \"§fThe arena is yours\")", "players.broadcast(f\"&e{player.name} won the match\")"],
      ["player.sendMessage(\"§aQuest complete!\");", "player.sendTitle(\"§6Victory\", \"§fThe arena is yours\");", "Bukkit.broadcastMessage(\"§e\" + player.getName() + \" won the match\");"],
    ),
    javaEquivalent: "Player#sendMessage / sendTitle and Bukkit#broadcastMessage",
    flags: ["Main thread"],
    api: { kind: "bukkit", name: "Player", label: "Open Player communication methods" },
  },
  {
    id: "player-health-hunger",
    group: "State",
    title: "Health and hunger",
    summary: "Read and change health, maximum health, food, saturation, and exhaustion.",
    when: "Use it for healing, survival mechanics, combat modes, and custom regeneration.",
    does: "Property assignment maps to the matching Java setter; invalid health values still raise server validation errors.",
    input: "Numbers inside the server's valid ranges",
    output: "Updated player state",
    operations: [
      op("player.health", "player.health", "Player#getHealth / setHealth"),
      op("player.maxHealth", "player.max_health", "Player#getMaxHealth / setMaxHealth"),
      op("player.foodLevel", "player.food_level", "Player#getFoodLevel / setFoodLevel"),
    ],
    code: nativeCode(
      ["players"],
      ["player.health = Math.min(player.maxHealth, 20);", "player.foodLevel = 20;", "player.saturation = 5;", "player.exhaustion = 0;"],
      ["players"],
      ["player.health = min(player.max_health, 20.0)", "player.food_level = 20", "player.saturation = 5.0", "player.exhaustion = 0.0"],
      ["player.setHealth(Math.min(player.getMaxHealth(), 20.0));", "player.setFoodLevel(20);", "player.setSaturation(5.0f);", "player.setExhaustion(0.0f);"],
    ),
    javaEquivalent: "Damageable#getHealth / setHealth plus HumanEntity hunger setters",
    flags: ["Main thread", "Range checked"],
    api: { kind: "bukkit", name: "Player", label: "Open Player state properties" },
  },
  {
    id: "player-inventory",
    group: "Inventory",
    title: "Inventory and items",
    summary: "Read slots, add or remove items, update item metadata, and open inventories.",
    when: "Use it for kits, rewards, menus, equipment, and item validation.",
    does: "Lists and maps are adapted to native collections while ItemStack and ItemMeta stay fully typed API objects.",
    input: "ItemStack values, slots, or Material constants",
    output: "Changed inventory and leftover item map",
    operations: [
      op("player.inventory", "player.inventory", "Player#getInventory()"),
      op("inventory.addItem(...items)", "inventory.add_item(*items)", "Inventory#addItem(ItemStack...)"),
      op("inventory.setItem(slot, item)", "inventory.set_item(slot, item)", "Inventory#setItem(int, ItemStack)"),
    ],
    code: nativeCode(
      ["ItemStack", "Material"],
      ["const sword = ItemStack(Material.DIAMOND_SWORD);", "const meta = sword.itemMeta;", "meta.displayName = \"§bGraaly Blade\";", "sword.itemMeta = meta;", "player.inventory.addItem(sword);", "player.updateInventory();"],
      ["ItemStack", "Material"],
      ["sword = ItemStack(Material.DIAMOND_SWORD)", "meta = sword.item_meta", "meta.display_name = \"§bGraaly Blade\"", "sword.item_meta = meta", "player.inventory.add_item(sword)", "player.update_inventory()"],
      ["ItemStack sword = new ItemStack(Material.DIAMOND_SWORD);", "ItemMeta meta = sword.getItemMeta();", "meta.setDisplayName(\"§bGraaly Blade\");", "sword.setItemMeta(meta);", "player.getInventory().addItem(sword);", "player.updateInventory();"],
    ),
    javaEquivalent: "Player#getInventory → PlayerInventory / Inventory / ItemStack / ItemMeta",
    flags: ["Main thread", "Native collections"],
    api: { kind: "bukkit", name: "PlayerInventory", label: "Open the complete PlayerInventory API" },
  },
  {
    id: "player-location-teleport",
    group: "Movement",
    title: "Location and teleportation",
    summary: "Read a player's position or move them to a typed Location.",
    when: "Use it for warps, arenas, checkpoints, respawns, and portals.",
    does: "worlds.location constructs the adapted Location directly and accepts only finite numeric values. Numeric strings, booleans, bigint, and Python integers outside ±(2^53−1) are rejected.",
    input: "World, x, y, z, optional yaw and pitch",
    output: "Location and teleport success",
    operations: [
      op("player.location", "player.location", "Player#getLocation()"),
      op("worlds.location(world, x, y, z)", "worlds.location(world, x, y, z)", "new Location(world, x, y, z)"),
      op("player.teleport(location)", "player.teleport(location)", "Player#teleport(Location)"),
    ],
    code: nativeCode(
      ["info", "worlds"],
      ["const lobby = worlds.get(\"world\");", "if (lobby) {", "  const spawn = worlds.location(lobby, 0.5, 65, 0.5, 90, 0);", "  player.teleport(spawn);", "}"],
      ["info", "worlds"],
      ["lobby = worlds.get(\"world\")", "if lobby is not None:", "    spawn = worlds.location(lobby, 0.5, 65, 0.5, 90.0, 0.0)", "    player.teleport(spawn)"],
      ["World lobby = Bukkit.getWorld(\"world\");", "if (lobby != null) {", "    Location spawn = new Location(lobby, 0.5, 65.0, 0.5, 90.0f, 0.0f);", "    player.teleport(spawn);", "}"],
    ),
    javaEquivalent: "new org.bukkit.Location(...) → Entity#teleport(Location)",
    flags: ["Main thread", "No interop"],
    api: { kind: "bukkit", name: "Location", label: "Open every Location property and method" },
  },
  {
    id: "player-movement-flight",
    group: "Movement",
    title: "Movement and flight",
    summary: "Control walking speed, flight speed, flying state, sprinting, sneaking, and velocity.",
    when: "Use it for classes, lobbies, movement abilities, and temporary game modes.",
    does: "Uses native properties only: JavaScript/TypeScript use camelCase and Python uses snake_case. JavaBean get/is/set accessors are not exposed; walk and fly speed must remain between -1 and 1.",
    input: "Booleans, speed values, and Vector",
    output: "Changed movement behavior",
    operations: [
      op("player.walkSpeed", "player.walk_speed", "Player#getWalkSpeed / setWalkSpeed"),
      op("player.allowFlight", "player.allow_flight", "Player#getAllowFlight / setAllowFlight"),
      op("player.velocity", "player.velocity", "Entity#getVelocity / setVelocity"),
    ],
    code: nativeCode(
      ["Vector"],
      ["player.walkSpeed = 0.24;", "player.allowFlight = true;", "player.flying = true;", "player.velocity = Vector(0, 0.8, 0);"],
      ["Vector"],
      ["player.walk_speed = 0.24", "player.allow_flight = True", "player.flying = True", "player.velocity = Vector(0.0, 0.8, 0.0)"],
      ["player.setWalkSpeed(0.24f);", "player.setAllowFlight(true);", "player.setFlying(true);", "player.setVelocity(new Vector(0.0, 0.8, 0.0));"],
    ),
    javaEquivalent: "Player movement setters and Entity#setVelocity(Vector)",
    flags: ["Main thread", "Speed −1…1"],
    api: { kind: "bukkit", name: "Player", label: "Open all Player movement methods" },
  },
  {
    id: "player-permissions-commands",
    group: "Permissions",
    title: "Permissions and commands",
    summary: "Check permission nodes, inspect operator state, and run commands as the player.",
    when: "Use it before privileged actions and when composing command-driven features.",
    does: "Uses the server's active permission attachments and normal command dispatcher.",
    input: "Permission node or command line",
    output: "Boolean result",
    operations: [
      op("player.hasPermission(node)", "player.has_permission(node)", "Player#hasPermission(String)"),
      op("player.performCommand(line)", "player.perform_command(line)", "Player#performCommand(String)"),
      op("player.op", "player.op", "Player#isOp / setOp"),
    ],
    code: nativeCode(
      ["players"],
      ["if (player.hasPermission(\"graaly.warp\")) {", "  player.performCommand(\"warp spawn\");", "} else {", "  player.sendMessage(\"§cMissing graaly.warp\");", "}"],
      ["players"],
      ["if player.has_permission(\"graaly.warp\"):", "    player.perform_command(\"warp spawn\")", "else:", "    player.send_message(\"§cMissing graaly.warp\")"],
      ["if (player.hasPermission(\"graaly.warp\")) {", "    player.performCommand(\"warp spawn\");", "} else {", "    player.sendMessage(\"§cMissing graaly.warp\");", "}"],
    ),
    javaEquivalent: "Permissible#hasPermission and Player#performCommand",
    flags: ["Main thread", "Permission aware"],
    api: { kind: "bukkit", name: "Player", label: "Open Player permission methods" },
  },
  {
    id: "player-scoreboard-metadata",
    group: "Presentation",
    title: "Scoreboards and metadata",
    summary: "Give a player a scoreboard and attach plugin-scoped metadata to API objects.",
    when: "Use it for sidebars, teams, per-player UI state, and lightweight runtime annotations.",
    does: "Scoreboards are normal typed Java objects; metadata remains scoped to your plugin instance.",
    input: "Scoreboard or metadata key/value",
    output: "Updated client UI or stored runtime metadata",
    operations: [
      op("player.scoreboard", "player.scoreboard", "Player#getScoreboard / setScoreboard"),
      op("player.setMetadata(key, value)", "player.set_metadata(key, value)", "Metadatable#setMetadata"),
    ],
    code: nativeCode(
      ["FixedMetadataValue", "server"],
      ["const board = server.scoreboardManager.newScoreboard;", "player.scoreboard = board;", "player.setMetadata(\"arena\", FixedMetadataValue(plugin, \"arena-1\"));"],
      ["FixedMetadataValue", "plugin", "server"],
      ["board = server.scoreboard_manager.new_scoreboard", "player.scoreboard = board", "player.set_metadata(\"arena\", FixedMetadataValue(plugin, \"arena-1\"))"],
      ["Scoreboard board = Bukkit.getScoreboardManager().getNewScoreboard();", "player.setScoreboard(board);", "player.setMetadata(\"arena\", new FixedMetadataValue(this, \"arena-1\"));"],
    ),
    javaEquivalent: "ScoreboardManager#getNewScoreboard and Metadatable#setMetadata",
    flags: ["Main thread", "Plugin scoped"],
    api: { kind: "bukkit", name: "Scoreboard", label: "Open the complete Scoreboard API" },
  },
  {
    id: "player-time-weather",
    group: "Presentation",
    title: "Personal time and weather",
    summary: "Override time or weather for one player's client without changing the world.",
    when: "Use it for ambience, cutscenes, lobbies, or per-player game states.",
    does: "Sends a client-side override; reset methods return the player to the world's state.",
    input: "Ticks, relative mode, or WeatherType",
    output: "Per-player visual override",
    operations: [
      op("player.setPlayerTime(time, relative)", "player.set_player_time(time, relative)", "Player#setPlayerTime(long, boolean)"),
      op("player.setPlayerWeather(type)", "player.set_player_weather(type)", "Player#setPlayerWeather(WeatherType)"),
      op("player.resetPlayerTime()", "player.reset_player_time()", "Player#resetPlayerTime()"),
    ],
    code: nativeCode(
      ["WeatherType"],
      ["player.setPlayerTime(18000, false);", "player.setPlayerWeather(WeatherType.DOWNFALL);", "", "// Restore world values later", "player.resetPlayerTime();", "player.resetPlayerWeather();"],
      ["WeatherType"],
      ["player.set_player_time(18000, False)", "player.set_player_weather(WeatherType.DOWNFALL)", "", "# Restore world values later", "player.reset_player_time()", "player.reset_player_weather()"],
      ["player.setPlayerTime(18000L, false);", "player.setPlayerWeather(WeatherType.DOWNFALL);", "", "// Restore world values later", "player.resetPlayerTime();", "player.resetPlayerWeather();"],
    ),
    javaEquivalent: "Player#setPlayerTime / setPlayerWeather and reset methods",
    flags: ["Client-side", "Main thread"],
    api: { kind: "bukkit", name: "Player", label: "Open Player time and weather methods" },
  },
] as const;

export const worldTopics: readonly GuideTopic[] = [
  {
    id: "create-location",
    group: "Locations",
    title: "Create a location",
    summary: "Build a typed Location from a world and coordinates with one native helper.",
    when: "Use it anywhere the Java API expects a Location: teleporting, spawning, effects, blocks, or distances.",
    does: "Creates the native Location while your code stays idiomatic JS, TS, or Python. Coordinates must be real finite numbers and conversions may not lose integer precision.",
    input: "World, x, y, z, optional yaw and pitch",
    output: "Location",
    operations: [
      op("worlds.location(world, x, y, z, yaw, pitch)", "worlds.location(world, x, y, z, yaw, pitch)", "new Location(world, x, y, z, yaw, pitch)"),
      op("location.block", "location.block", "Location#getBlock()"),
      op("location.chunk", "location.chunk", "Location#getChunk()"),
    ],
    code: nativeCode(
      ["info", "worlds"],
      ["const world = worlds.get(\"world\");", "if (world) {", "  const location = worlds.location(world, 12.5, 70, -4.5, 90, 0);", "  info(`${location.blockX}, ${location.blockY}, ${location.blockZ}`);", "}"],
      ["info", "worlds"],
      ["world = worlds.get(\"world\")", "if world is not None:", "    location = worlds.location(world, 12.5, 70.0, -4.5, 90.0, 0.0)", "    info(f\"{location.block_x}, {location.block_y}, {location.block_z}\")"],
      ["World world = Bukkit.getWorld(\"world\");", "if (world != null) {", "    Location location = new Location(world, 12.5, 70.0, -4.5, 90.0f, 0.0f);", "    getLogger().info(location.getBlockX() + \", \" + location.getBlockY() + \", \" + location.getBlockZ());", "}"],
    ),
    javaEquivalent: "new org.bukkit.Location(World, double, double, double, float, float)",
    flags: ["No interop", "Typed value"],
    api: { kind: "bukkit", name: "Location", label: "Open all Location properties and vector methods" },
  },
  {
    id: "find-create-world",
    group: "Lifecycle",
    title: "Find or create a world",
    summary: "Iterate loaded worlds, get one by name, or create it from ordinary options.",
    when: "Use it during plugin startup or before sending players to a custom world.",
    does: "Builds the equivalent WorldCreator configuration and returns the loaded World.",
    input: "Name, seed, environment, world type, structure flag, generator",
    output: "World",
    operations: [
      op("worlds or worlds.all()", "worlds or worlds.all()", "Bukkit.getWorlds()"),
      op("worlds.get(name)", "worlds.get(name)", "Bukkit.getWorld(name)"),
      op("worlds.create(name, options)", "worlds.create(name, ...)", "WorldCreator → Bukkit.createWorld"),
    ],
    code: nativeCode(
      ["info", "worlds"],
      ["const loadedNames = [...worlds].map(({ name }) => name);", "const arena = worlds.get(\"arena\") ?? worlds.create(\"arena\", {", "  seed: 42,", "  environment: \"NORMAL\",", "  type: \"FLAT\",", "  generateStructures: false,", "});", "info(`Loaded ${loadedNames.length} worlds before arena`);"],
      ["info", "worlds"],
      ["loaded_names = [world.name for world in worlds]", "arena = worlds.get(\"arena\") or worlds.create(", "    \"arena\", seed=42, environment=\"NORMAL\",", "    world_type=\"FLAT\", generate_structures=False,", ")", "info(f\"Loaded {len(loaded_names)} worlds before arena\")"],
      ["WorldCreator creator = new WorldCreator(\"arena\")", "    .seed(42L)", "    .environment(World.Environment.NORMAL)", "    .type(WorldType.FLAT)", "    .generateStructures(false);", "World arena = Bukkit.createWorld(creator);", "getLogger().info(\"Loaded \" + Bukkit.getWorlds().size() + \" worlds\");"],
    ),
    javaEquivalent: "WorldCreator configuration → Bukkit#createWorld(WorldCreator)",
    flags: ["Main thread", "Loaded worlds"],
    api: { kind: "bukkit", name: "WorldCreator", label: "Open the complete WorldCreator API" },
  },
  {
    id: "world-blocks-chunks",
    group: "Terrain",
    title: "Blocks and chunks",
    summary: "Read or change blocks, locate chunks, and explicitly load or unload them.",
    when: "Use it for structures, regions, terrain tools, and chunk-aware mechanics.",
    does: "Location, Block, Chunk, and Material are ready-to-use typed values with native properties.",
    input: "Coordinates, Location, Material, and chunk coordinates",
    output: "Block, Chunk, or changed terrain",
    operations: [
      op("world.getBlockAt(x, y, z)", "world.get_block_at(x, y, z)", "World#getBlockAt(int, int, int)"),
      op("world.getChunkAt(x, z)", "world.get_chunk_at(x, z)", "World#getChunkAt(int, int)"),
      op("block.type", "block.type", "Block#getType / setType"),
    ],
    code: nativeCode(
      ["Material"],
      ["const block = world.getBlockAt(0, 64, 0);", "block.type = Material.GOLD_BLOCK;", "", "const chunk = world.getChunkAt(0, 0);", "if (!chunk.loaded) chunk.load(true);"],
      ["Material"],
      ["block = world.get_block_at(0, 64, 0)", "block.type = Material.GOLD_BLOCK", "", "chunk = world.get_chunk_at(0, 0)", "if not chunk.loaded:", "    chunk.load(True)"],
      ["Block block = world.getBlockAt(0, 64, 0);", "block.setType(Material.GOLD_BLOCK);", "", "Chunk chunk = world.getChunkAt(0, 0);", "if (!chunk.isLoaded()) chunk.load(true);"],
    ),
    javaEquivalent: "World#getBlockAt / getChunkAt → Block and Chunk",
    flags: ["Main thread", "Chunk aware"],
    api: { kind: "bukkit", name: "World", label: "Open every World block and chunk method" },
  },
  {
    id: "world-time-weather",
    group: "Environment",
    title: "Time and weather",
    summary: "Control day time, full time, rain, thunder, and weather durations.",
    when: "Use it for world ambience, minigame rounds, and deterministic maps.",
    does: "Properties map to Java getters and setters and affect every player in that world.",
    input: "Tick values, booleans, and durations",
    output: "Updated world environment",
    operations: [
      op("world.time", "world.time", "World#getTime / setTime"),
      op("world.storm", "world.storm", "World#hasStorm / setStorm"),
      op("world.thundering", "world.thundering", "World#isThundering / setThundering"),
    ],
    code: nativeCode(
      ["worlds"],
      ["world.time = 6000;", "world.storm = false;", "world.thundering = false;", "world.weatherDuration = 20 * 60 * 10;"],
      ["worlds"],
      ["world.time = 6000", "world.storm = False", "world.thundering = False", "world.weather_duration = 20 * 60 * 10"],
      ["world.setTime(6000L);", "world.setStorm(false);", "world.setThundering(false);", "world.setWeatherDuration(20 * 60 * 10);"],
    ),
    javaEquivalent: "World time and weather getters/setters",
    flags: ["Main thread", "World-wide"],
    api: { kind: "bukkit", name: "World", label: "Open World environment methods" },
  },
  {
    id: "world-spawn-rules",
    group: "Gameplay",
    title: "Spawn point and mob rules",
    summary: "Set the world spawn and tune monster, animal, and ambient spawning.",
    when: "Use it for lobbies, arenas, adventure maps, and low-load utility worlds.",
    does: "Changes the world's persistent spawn settings and per-category spawn limits.",
    input: "Block coordinates, booleans, limits, and tick intervals",
    output: "Updated spawn configuration",
    operations: [
      op("world.setSpawnLocation(x, y, z)", "world.set_spawn_location(x, y, z)", "World#setSpawnLocation(int, int, int)"),
      op("world.setSpawnFlags(monsters, animals)", "world.set_spawn_flags(monsters, animals)", "World#setSpawnFlags(boolean, boolean)"),
      op("world.monsterSpawnLimit", "world.monster_spawn_limit", "World#getMonsterSpawnLimit / setMonsterSpawnLimit"),
    ],
    code: nativeCode(
      ["worlds"],
      ["world.setSpawnLocation(0, 65, 0);", "world.setSpawnFlags(false, false);", "world.monsterSpawnLimit = 0;", "world.animalSpawnLimit = 0;", "world.keepSpawnInMemory = true;"],
      ["worlds"],
      ["world.set_spawn_location(0, 65, 0)", "world.set_spawn_flags(False, False)", "world.monster_spawn_limit = 0", "world.animal_spawn_limit = 0", "world.keep_spawn_in_memory = True"],
      ["world.setSpawnLocation(0, 65, 0);", "world.setSpawnFlags(false, false);", "world.setMonsterSpawnLimit(0);", "world.setAnimalSpawnLimit(0);", "world.setKeepSpawnInMemory(true);"],
    ),
    javaEquivalent: "World spawn-location, spawn-flag, and spawn-limit setters",
    flags: ["Main thread", "Persistent setting"],
    api: { kind: "bukkit", name: "World", label: "Open all World spawn settings" },
  },
  {
    id: "custom-generator",
    group: "Generation",
    title: "Build a custom generator",
    summary: "Generate chunks from ordinary functions and native Material and Biome constants.",
    when: "Use it before creating a world that needs void, flat, island, or fully custom terrain.",
    does: "Adapts your callback to ChunkGenerator.generateChunkData and supplies world, random, coordinates, biomes, and ChunkData.",
    input: "Generation callback plus optional spawn and populator callbacks",
    output: "ChunkGenerator accepted by worlds.create",
    operations: [
      op("worlds.generator(callback | options)", "worlds.generator(callback, ...)", "new ChunkGenerator() { generateChunkData(...) }"),
      op("chunk.setRegion(...) ", "chunk.set_region(...)", "ChunkData#setRegion(...)"),
      op("biomes.setBiome(x, z, biome)", "biomes.set_biome(x, z, biome)", "BiomeGrid#setBiome(int, int, Biome)"),
    ],
    code: nativeCode(
      ["Biome", "Material", "worlds"],
      ["const island = worlds.generator(({ chunk, chunkX, chunkZ, biomes }) => {", "  chunk.setRegion(0, 0, 0, 16, 1, 16, Material.BEDROCK);", "  for (let x = 0; x < 16; x++)", "    for (let z = 0; z < 16; z++) biomes.setBiome(x, z, Biome.PLAINS);", "  if (chunkX === 0 && chunkZ === 0)", "    chunk.setRegion(4, 60, 4, 12, 64, 12, Material.STONE);", "});", "", "const world = worlds.create(\"void_island\", {", "  seed: 42, generator: island, generateStructures: false,", "});"],
      ["Biome", "Material", "worlds"],
      ["def generate_island(context):", "    context.chunk.set_region(0, 0, 0, 16, 1, 16, Material.BEDROCK)", "    for x in range(16):", "        for z in range(16):", "            context.biomes.set_biome(x, z, Biome.PLAINS)", "    if context.chunk_x == 0 and context.chunk_z == 0:", "        context.chunk.set_region(4, 60, 4, 12, 64, 12, Material.STONE)", "", "island = worlds.generator(generate_island)", "world = worlds.create(\"void_island_py\", seed=42,", "                      generator=island, generate_structures=False)"],
      ["ChunkGenerator island = new ChunkGenerator() {", "    @Override", "    public ChunkData generateChunkData(World world, Random random, int chunkX, int chunkZ, BiomeGrid biomes) {", "        ChunkData chunk = createChunkData(world);", "        chunk.setRegion(0, 0, 0, 16, 1, 16, Material.BEDROCK);", "        for (int x = 0; x < 16; x++) for (int z = 0; z < 16; z++)", "            biomes.setBiome(x, z, Biome.PLAINS);", "        if (chunkX == 0 && chunkZ == 0)", "            chunk.setRegion(4, 60, 4, 12, 64, 12, Material.STONE);", "        return chunk;", "    }", "};", "World world = Bukkit.createWorld(new WorldCreator(\"void_island\").seed(42L).generator(island).generateStructures(false));"],
    ),
    javaEquivalent: "org.bukkit.generator.ChunkGenerator#generateChunkData",
    flags: ["Before world creation", "Local X/Z 0…15"],
    note: "setRegion upper bounds are exclusive. Keep generation deterministic from the supplied seed and chunk coordinates.",
    api: { kind: "bukkit", name: "ChunkGenerator", label: "Open the complete ChunkGenerator API" },
  },
  {
    id: "world-populator",
    group: "Generation",
    title: "Populate generated chunks",
    summary: "Run a callback after base terrain generation to add ores, trees, structures, or decorations.",
    when: "Use it when a feature belongs after the generator has produced the chunk.",
    does: "Adapts the callback to BlockPopulator.populate with world, random source, and chunk.",
    input: "A populate callback",
    output: "BlockPopulator",
    operations: [op("worlds.populator(callback)", "worlds.populator(callback)", "new BlockPopulator() { populate(...) }")],
    code: nativeCode(
      ["Material", "worlds"],
      ["const markers = worlds.populator(({ chunk }) => {", "  chunk.getBlock(8, 65, 8).type = Material.GLOWSTONE;", "});", "", "const generator = worlds.generator({", "  generate: generateTerrain,", "  defaultPopulators: [markers],", "});"],
      ["Material", "worlds"],
      ["def add_marker(context):", "    context.chunk.get_block(8, 65, 8).type = Material.GLOWSTONE", "", "markers = worlds.populator(add_marker)", "generator = worlds.generator(", "    generate=generate_terrain, default_populators=[markers],", ")"],
      ["BlockPopulator markers = new BlockPopulator() {", "    @Override", "    public void populate(World world, Random random, Chunk chunk) {", "        chunk.getBlock(8, 65, 8).setType(Material.GLOWSTONE);", "    }", "};", "", "// Return it from ChunkGenerator#getDefaultPopulators(World)."],
    ),
    javaEquivalent: "org.bukkit.generator.BlockPopulator#populate",
    flags: ["Generation phase", "Main generation thread"],
    api: { kind: "bukkit", name: "BlockPopulator", label: "Open the complete BlockPopulator API" },
  },
  {
    id: "save-unload-world",
    group: "Lifecycle",
    title: "Save or unload a world",
    summary: "Persist a world and release it safely by object or name.",
    when: "Use it when rotating arenas, deleting temporary worlds later, or shutting down a game instance.",
    does: "Calls the normal World save operation and server unload lifecycle.",
    input: "World or name and whether to save first",
    output: "Whether unloading succeeded",
    operations: [
      op("world.save()", "world.save()", "World#save()"),
      op("worlds.unload(world, save)", "worlds.unload(world, save)", "Bukkit.unloadWorld(world, save)"),
    ],
    code: nativeCode(
      ["info", "worlds"],
      ["arena.save();", "const unloaded = worlds.unload(arena, true);", "info(`World unloaded: ${unloaded}`);"],
      ["info", "worlds"],
      ["arena.save()", "unloaded = worlds.unload(arena, True)", "info(f\"World unloaded: {unloaded}\")"],
      ["arena.save();", "boolean unloaded = Bukkit.unloadWorld(arena, true);", "getLogger().info(\"World unloaded: \" + unloaded);"],
    ),
    javaEquivalent: "World#save() and Bukkit#unloadWorld(World, boolean)",
    flags: ["Main thread", "Moves players first"],
    note: "Teleport players out and release plugin references before unloading. File deletion is a separate, explicitly destructive operation.",
    api: { kind: "bukkit", name: "World", label: "Open World lifecycle methods" },
  },
  {
    id: "world-effects",
    group: "Effects",
    title: "Explosions, lightning, sounds, and effects",
    summary: "Create world effects at a Location without packet or Java bridge code.",
    when: "Use it for gameplay feedback, scripted scenes, spells, and environment mechanics.",
    does: "Calls the corresponding World overload with your adapted Location and enums.",
    input: "Location, effect type, sound, power, and flags",
    output: "World-side visual, audio, or gameplay effect",
    operations: [
      op("world.createExplosion(location, power)", "world.create_explosion(location, power)", "World#createExplosion(Location, float)"),
      op("world.strikeLightningEffect(location)", "world.strike_lightning_effect(location)", "World#strikeLightningEffect(Location)"),
      op("world.playSound(location, sound, volume, pitch)", "world.play_sound(...)", "World#playSound(Location, Sound, float, float)"),
    ],
    code: nativeCode(
      ["Sound"],
      ["world.strikeLightningEffect(location);", "world.playSound(location, Sound.AMBIENCE_THUNDER, 1, 1);", "world.createExplosion(location, 2, false);"],
      ["Sound"],
      ["world.strike_lightning_effect(location)", "world.play_sound(location, Sound.AMBIENCE_THUNDER, 1.0, 1.0)", "world.create_explosion(location, 2.0, False)"],
      ["world.strikeLightningEffect(location);", "world.playSound(location, Sound.AMBIENCE_THUNDER, 1.0f, 1.0f);", "world.createExplosion(location, 2.0f, false);"],
    ),
    javaEquivalent: "World effect, sound, lightning, and explosion overloads",
    flags: ["Main thread"],
    api: { kind: "bukkit", name: "World", label: "Open all World effect overloads" },
  },
] as const;

export const entityTopics: readonly GuideTopic[] = [
  {
    id: "spawn-entity",
    group: "Lifecycle",
    title: "Spawn an entity",
    summary: "Spawn with Graaly's stable EntityTypes catalog and receive the precise entity subtype without a cast.",
    when: "Use it for custom mobs, NPC-like mechanics, projectiles, and arena entities.",
    does: "Graaly selects the correct native spawn path, while EntityTypes.ZOMBIE, HORSE, ITEM, and every other constant preserve their TypeScript and Python return type.",
    input: "Location, EntityTypes value, and optional configuration",
    output: "Precisely inferred Zombie, Horse, Item, or other entity subtype",
    operations: [
      op("entities.spawn(location, type, options)", "entities.spawn(location, type, **options)", "World#spawnEntity(Location, EntityType)"),
      op("EntityTypes.ZOMBIE", "EntityTypes.ZOMBIE", "EntityType.ZOMBIE"),
    ],
    code: nativeCode(
      ["entities", "EntityTypes"],
      ["const zombie = entities.spawn(location, EntityTypes.ZOMBIE, {", "  name: \"§aGraaly guardian\",", "  nameVisible: true,", "});"],
      ["entities", "EntityTypes"],
      ["zombie = entities.spawn(", "    location, EntityTypes.ZOMBIE,", "    name=\"§aGraaly guardian\", name_visible=True,", ")"],
      ["LivingEntity zombie = (LivingEntity) world.spawnEntity(location, EntityType.ZOMBIE);", "zombie.setCustomName(\"§aGraaly guardian\");", "zombie.setCustomNameVisible(true);"],
    ),
    javaEquivalent: "World#spawnEntity",
    flags: ["Main thread", "Typed result"],
    api: { kind: "bukkit", name: "EntityType", label: "Open every EntityType constant" },
  },
  {
    id: "entity-name-persistence",
    group: "Identity",
    title: "Name and persistence",
    summary: "Give a living entity a visible custom name and control distance-based removal.",
    when: "Use it for bosses, guards, quest mobs, and long-lived world actors.",
    does: "Maps native properties to Java custom-name and persistence setters.",
    input: "Name, visibility, persistence flags",
    output: "Updated entity identity and despawn behavior",
    operations: [
      op("entity.customName", "entity.custom_name", "Entity#getCustomName / setCustomName"),
      op("entity.customNameVisible", "entity.custom_name_visible", "Entity#isCustomNameVisible / setCustomNameVisible"),
      op("living.removeWhenFarAway", "living.remove_when_far_away", "LivingEntity#getRemoveWhenFarAway / setRemoveWhenFarAway"),
    ],
    code: nativeCode(
      ["EntityType"],
      ["zombie.customName = \"§6Arena boss\";", "zombie.customNameVisible = true;", "zombie.removeWhenFarAway = false;"],
      ["EntityType"],
      ["zombie.custom_name = \"§6Arena boss\"", "zombie.custom_name_visible = True", "zombie.remove_when_far_away = False"],
      ["zombie.setCustomName(\"§6Arena boss\");", "zombie.setCustomNameVisible(true);", "zombie.setRemoveWhenFarAway(false);"],
    ),
    javaEquivalent: "Entity custom-name setters and LivingEntity#setRemoveWhenFarAway",
    flags: ["Main thread", "Living entities"],
    api: { kind: "bukkit", name: "LivingEntity", label: "Open every LivingEntity member" },
  },
  {
    id: "entity-health-damage",
    group: "Combat",
    title: "Health, damage, and death",
    summary: "Read health, set maximum health, apply attributed damage, or kill a living entity.",
    when: "Use it for bosses, abilities, scripted combat, and healing systems.",
    does: "Uses Java Damageable methods and preserves the normal damage event pipeline.",
    input: "Health or damage amount and optional source entity",
    output: "Changed health and normal damage/death events",
    operations: [
      op("living.health", "living.health", "Damageable#getHealth / setHealth"),
      op("living.damage(amount, source)", "living.damage(amount, source)", "Damageable#damage(double, Entity)"),
      op("living.maxHealth", "living.max_health", "Damageable#getMaxHealth / setMaxHealth"),
    ],
    code: nativeCode(
      ["EntityType"],
      ["zombie.maxHealth = 30;", "zombie.health = 30;", "zombie.damage(4, player);", "if (!zombie.dead) zombie.health = Math.min(zombie.maxHealth, zombie.health + 2);"],
      ["EntityType"],
      ["zombie.max_health = 30.0", "zombie.health = 30.0", "zombie.damage(4.0, player)", "if not zombie.dead:", "    zombie.health = min(zombie.max_health, zombie.health + 2.0)"],
      ["zombie.setMaxHealth(30.0);", "zombie.setHealth(30.0);", "zombie.damage(4.0, player);", "if (!zombie.isDead()) zombie.setHealth(Math.min(zombie.getMaxHealth(), zombie.getHealth() + 2.0));"],
    ),
    javaEquivalent: "org.bukkit.entity.Damageable health and damage methods",
    flags: ["Main thread", "Fires damage events"],
    api: { kind: "bukkit", name: "Damageable", label: "Open the complete Damageable API" },
  },
  {
    id: "entity-attributes",
    group: "Attributes",
    title: "All 40 canonical attributes",
    summary: "Use the current Graaly names on every server, with autocomplete and explicit availability checks.",
    when: "Use it for permanent base statistics such as maximum health, speed, attack damage, or horse jump power.",
    does: "Graaly translates historical attribute names and returns an AttributeInstance when both the release and entity support it.",
    input: "Attributes value and optional base value",
    output: "AttributeInstance or null/None",
    operations: latestConstants.namespaces.Attribute.constants.map(attribute =>
      op(`Attributes.${attribute}`, `Attributes.${attribute}`, `Attribute.${attribute}`)),
    code: nativeCode(
      ["Attributes", "compatibility", "entities"],
      ["if (compatibility.supports(\"attributes\")) {", "  const health = entities.attribute(zombie, Attributes.MAX_HEALTH, 30);", "  const speed = entities.attribute(zombie, Attributes.MOVEMENT_SPEED, 0.32);", "  zombie.health = Math.min(30, health.baseValue);", "}"],
      ["Attributes", "compatibility", "entities"],
      ["if compatibility.supports(\"attributes\"):", "    health = entities.attribute(zombie, Attributes.MAX_HEALTH, 30.0)", "    speed = entities.attribute(zombie, Attributes.MOVEMENT_SPEED, 0.32)", "    zombie.health = min(30.0, health.base_value)"],
      ["AttributeInstance health = zombie.getAttribute(Attribute.MAX_HEALTH);", "AttributeInstance speed = zombie.getAttribute(Attribute.MOVEMENT_SPEED);", "if (health != null) health.setBaseValue(30.0);", "if (speed != null) speed.setBaseValue(0.32);", "zombie.setHealth(Math.min(30.0, health.getBaseValue()));"],
    ),
    javaEquivalent: "Attributable#getAttribute(Attribute) → AttributeInstance#setBaseValue",
    flags: ["40 canonical names", "Version-gated", "Entity-dependent"],
    note: "The namespace is stable, but old releases cannot implement attributes that did not exist yet. Check compatibility.supports(\"attribute:NAME\") for a specific constant. Strength remains a timed potion effect rather than an attribute.",
    api: { kind: "bukkit", name: "Attribute", label: "Open every Attribute constant" },
  },
  {
    id: "attribute-modifiers",
    group: "Attributes",
    title: "Temporary attribute modifiers",
    summary: "Add named, removable bonuses without overwriting the entity's base value.",
    when: "Use it for equipment-like bonuses, buffs, classes, and reversible mechanics.",
    does: "AttributeModifier is attached to an AttributeInstance and can later be removed by object or UUID.",
    input: "UUID, name, amount, and operation",
    output: "Modified calculated attribute value",
    operations: [
      op("AttributeModifier(uuid, name, amount, operation)", "AttributeModifier(uuid, name, amount, operation)", "new AttributeModifier(...)"),
      op("instance.addModifier(modifier)", "instance.add_modifier(modifier)", "AttributeInstance#addModifier"),
      op("instance.removeModifier(modifier)", "instance.remove_modifier(modifier)", "AttributeInstance#removeModifier"),
    ],
    code: nativeCode(
      ["Attribute", "AttributeModifier", "AttributeModifierOperation"],
      ["const speed = zombie.getAttribute(Attribute.MOVEMENT_SPEED);", "const boost = AttributeModifier(", "  \"arena-speed\", 0.08, AttributeModifierOperation.ADD_NUMBER", ");", "if (speed) speed.addModifier(boost);", "", "// Later", "if (speed) speed.removeModifier(boost);"],
      ["Attribute", "AttributeModifier", "AttributeModifierOperation"],
      ["speed = zombie.get_attribute(Attribute.MOVEMENT_SPEED)", "boost = AttributeModifier(", "    \"arena-speed\", 0.08, AttributeModifierOperation.ADD_NUMBER", ")", "if speed is not None:", "    speed.add_modifier(boost)", "", "# Later", "if speed is not None:", "    speed.remove_modifier(boost)"],
      ["AttributeInstance speed = zombie.getAttribute(Attribute.MOVEMENT_SPEED);", "AttributeModifier boost = new AttributeModifier(", "    \"arena-speed\", 0.08, AttributeModifier.Operation.ADD_NUMBER", ");", "if (speed != null) speed.addModifier(boost);", "", "// Later", "if (speed != null) speed.removeModifier(boost);"],
    ),
    javaEquivalent: "new AttributeModifier(...) → AttributeInstance#addModifier / removeModifier",
    flags: ["Reversible", "UUID identified"],
    api: { kind: "bukkit", name: "AttributeModifier", label: "Open AttributeModifier constructors and properties" },
  },
  {
    id: "potion-effects",
    group: "Effects",
    title: "Speed, strength, and potion effects",
    summary: "Apply timed status effects such as speed, strength, resistance, invisibility, or regeneration.",
    when: "Use it when the change should expire after a duration or use Minecraft's potion-effect rules.",
    does: "Creates PotionEffect with duration in ticks and a zero-based amplifier, then applies it to a LivingEntity.",
    input: "PotionEffectType, duration ticks, amplifier, overwrite flag",
    output: "Whether the effect was applied",
    operations: [
      op("PotionEffect(type, duration, amplifier)", "PotionEffect(type, duration, amplifier)", "new PotionEffect(type, duration, amplifier)"),
      op("living.addPotionEffect(effect, force)", "living.add_potion_effect(effect, force)", "LivingEntity#addPotionEffect"),
      op("living.removePotionEffect(type)", "living.remove_potion_effect(type)", "LivingEntity#removePotionEffect"),
    ],
    code: nativeCode(
      ["PotionEffect", "PotionEffectType"],
      ["const seconds = 30;", "zombie.addPotionEffect(", "  PotionEffect(PotionEffectType.SPEED, 20 * seconds, 1), true", ");", "zombie.addPotionEffect(", "  PotionEffect(PotionEffectType.STRENGTH, 20 * seconds, 0), true", ");"],
      ["PotionEffect", "PotionEffectType"],
      ["seconds = 30", "zombie.add_potion_effect(", "    PotionEffect(PotionEffectType.SPEED, 20 * seconds, 1), True", ")", "zombie.add_potion_effect(", "    PotionEffect(PotionEffectType.STRENGTH, 20 * seconds, 0), True", ")"],
      ["int seconds = 30;", "zombie.addPotionEffect(new PotionEffect(PotionEffectType.SPEED, 20 * seconds, 1), true);", "zombie.addPotionEffect(new PotionEffect(PotionEffectType.STRENGTH, 20 * seconds, 0), true);"],
    ),
    javaEquivalent: "new PotionEffect(...) → LivingEntity#addPotionEffect",
    flags: ["20 ticks = 1 second", "Amplifier starts at 0"],
    api: { kind: "bukkit", name: "PotionEffectType", label: "Open all PotionEffectType constants" },
  },
  {
    id: "entity-ai-equipment",
    group: "Behavior",
    title: "Targeting and equipment",
    summary: "Choose a creature target and edit the equipment held or worn by a living entity.",
    when: "Use it for custom mob behavior, guards, bosses, and visible loadouts.",
    does: "Creature target and EntityEquipment remain normal typed Java objects.",
    input: "LivingEntity target and ItemStack equipment",
    output: "Updated AI target and equipment",
    operations: [
      op("creature.target", "creature.target", "Creature#getTarget / setTarget"),
      op("living.equipment", "living.equipment", "LivingEntity#getEquipment()"),
      op("equipment.itemInHand", "equipment.item_in_hand", "EntityEquipment#getItemInHand / setItemInHand"),
    ],
    code: nativeCode(
      ["ItemStack", "Material"],
      ["zombie.target = player;", "const equipment = zombie.equipment;", "equipment.itemInHand = ItemStack(Material.IRON_SWORD);", "equipment.helmet = ItemStack(Material.IRON_HELMET);"],
      ["ItemStack", "Material"],
      ["zombie.target = player", "equipment = zombie.equipment", "equipment.item_in_hand = ItemStack(Material.IRON_SWORD)", "equipment.helmet = ItemStack(Material.IRON_HELMET)"],
      ["zombie.setTarget(player);", "EntityEquipment equipment = zombie.getEquipment();", "equipment.setItemInHand(new ItemStack(Material.IRON_SWORD));", "equipment.setHelmet(new ItemStack(Material.IRON_HELMET));"],
    ),
    javaEquivalent: "Creature#setTarget and LivingEntity#getEquipment",
    flags: ["Creature target", "Living entities"],
    api: { kind: "bukkit", name: "EntityEquipment", label: "Open the complete EntityEquipment API" },
  },
  {
    id: "entity-movement",
    group: "Movement",
    title: "Teleport and velocity",
    summary: "Move an entity instantly or apply a directional velocity vector.",
    when: "Use it for knockback, launches, dashes, scripted motion, and arena resets.",
    does: "Uses Entity teleport and velocity methods; physics continues normally after velocity is applied.",
    input: "Location or Vector",
    output: "Teleport result or changed velocity",
    operations: [
      op("entity.teleport(location)", "entity.teleport(location)", "Entity#teleport(Location)"),
      op("entity.velocity", "entity.velocity", "Entity#getVelocity / setVelocity"),
    ],
    code: nativeCode(
      ["Vector", "worlds"],
      ["entity.teleport(worlds.location(world, 0.5, 70, 0.5));", "entity.velocity = Vector(0, 0.7, 0);", "entity.fallDistance = 0;"],
      ["Vector", "worlds"],
      ["entity.teleport(worlds.location(world, 0.5, 70.0, 0.5))", "entity.velocity = Vector(0.0, 0.7, 0.0)", "entity.fall_distance = 0.0"],
      ["entity.teleport(new Location(world, 0.5, 70.0, 0.5));", "entity.setVelocity(new Vector(0.0, 0.7, 0.0));", "entity.setFallDistance(0.0f);"],
    ),
    javaEquivalent: "Entity#teleport / setVelocity / setFallDistance",
    flags: ["Main thread", "Physics aware"],
    api: { kind: "bukkit", name: "Entity", label: "Open every Entity movement method" },
  },
  {
    id: "entity-query-remove",
    group: "Lifecycle",
    title: "Find nearby entities and remove them",
    summary: "Query an area around an entity and clean up only the objects your mechanic owns.",
    when: "Use it for arena cleanup, proximity checks, targeting, and temporary effects.",
    does: "Returns a native list of typed Entity values; remove permanently despawns the selected entity.",
    input: "X, Y, and Z search radii",
    output: "Entity[] and removed entities",
    operations: [
      op("entity.getNearbyEntities(x, y, z)", "entity.get_nearby_entities(x, y, z)", "Entity#getNearbyEntities(double, double, double)"),
      op("entity.remove()", "entity.remove()", "Entity#remove()"),
      op("entity.valid", "entity.valid", "Entity#isValid()"),
    ],
    code: nativeCode(
      ["EntityType"],
      ["for (const nearby of anchor.getNearbyEntities(16, 8, 16)) {", "  if (nearby.type === EntityType.ARMOR_STAND && nearby.customName === \"arena-temp\")", "    nearby.remove();", "}"],
      ["EntityType"],
      ["for nearby in anchor.get_nearby_entities(16.0, 8.0, 16.0):", "    if (nearby.type == EntityType.ARMOR_STAND and nearby.custom_name == \"arena-temp\"):", "        nearby.remove()"],
      ["for (Entity nearby : anchor.getNearbyEntities(16.0, 8.0, 16.0)) {", "    if (nearby.getType() == EntityType.ARMOR_STAND && \"arena-temp\".equals(nearby.getCustomName()))", "        nearby.remove();", "}"],
    ),
    javaEquivalent: "Entity#getNearbyEntities and Entity#remove",
    flags: ["Main thread", "Explicit cleanup"],
    api: { kind: "bukkit", name: "Entity", label: "Open the complete Entity API" },
  },
] as const;

export const packetTopics: readonly GuideTopic[] = [
  {
    id: "packet-availability",
    group: "Setup",
    title: "Check PacketEvents",
    summary: "Detect whether the separately installed PacketEvents plugin is available and read its version.",
    when: "Use it during startup when packet features are optional or before registering packet-specific behavior.",
    does: "Reports the runtime integration state without exposing PacketEvents' static singleton to script code.",
    input: "Nothing",
    output: "available boolean and version string or null/None",
    operations: [
      op("packets.available", "packets.available", "PacketEvents.getAPI().isLoaded()"),
      op("packets.version", "packets.version", "PacketEvents.getAPI().getVersion()"),
    ],
    code: nativeCode(
      ["info", "packets", "warn"],
      ["if (!packets.available) {", "  warn(\"PacketEvents is not installed; packet features are disabled\");", "} else {", "  info(`PacketEvents ${packets.version}`);", "}"],
      ["info", "packets", "warn"],
      ["if not packets.available:", "    warn(\"PacketEvents is not installed; packet features are disabled\")", "else:", "    info(f\"PacketEvents {packets.version}\")"],
      ["if (!PacketEvents.getAPI().isLoaded()) {", "    getLogger().warning(\"PacketEvents is not loaded\");", "} else {", "    getLogger().info(\"PacketEvents \" + PacketEvents.getAPI().getVersion());", "}"],
    ),
    javaEquivalent: "PacketEvents#getAPI lifecycle and version access",
    flags: ["Separate dependency", "Optional integration"],
  },
  {
    id: "receive-packet",
    group: "Listeners",
    title: "Listen for a client packet",
    summary: "Filter incoming traffic with a readable constant such as ClientPacket.CHAT_MESSAGE.",
    when: "Use it when gameplay depends on protocol data the high-level event API does not expose.",
    does: "Runs only for the selected packet type and provides packet name, player, user, version, cancellation, and wrapper helpers.",
    input: "ClientPacket constant, callback, optional priority",
    output: "Registered packet callback",
    operations: [
      op("packets.onReceive(type, callback)", "@packets.listen_receive(type)", "PacketListenerAbstract#onPacketReceive"),
      op("ClientPacket.CHAT_MESSAGE", "ClientPacket.CHAT_MESSAGE", "PacketType.Play.Client.CHAT_MESSAGE"),
    ],
    code: nativeCode(
      ["ClientPacket", "info", "packets"],
      ["packets.onReceive(ClientPacket.CHAT_MESSAGE, context => {", "  info(`${context.player?.name ?? \"unknown\"}: ${context.packetName}`);", "});"],
      ["ClientPacket", "info", "packets"],
      ["@packets.listen_receive(ClientPacket.CHAT_MESSAGE)", "def on_chat_packet(context):", "    name = context.player.name if context.player is not None else \"unknown\"", "    info(f\"{name}: {context.packet_name}\")"],
      ["PacketEvents.getAPI().getEventManager().registerListener(new PacketListenerAbstract() {", "    @Override", "    public void onPacketReceive(PacketReceiveEvent event) {", "        if (event.getPacketType() != PacketType.Play.Client.CHAT_MESSAGE) return;", "        Player player = (Player) event.getPlayer();", "        getLogger().info((player == null ? \"unknown\" : player.getName()) + \": \" + event.getPacketName());", "    }", "});"],
    ),
    javaEquivalent: "PacketListenerAbstract#onPacketReceive + PacketType.Play.Client.*",
    flags: ["Netty thread", "Filtered listener"],
    api: { kind: "packets", name: "CHAT_MESSAGE", label: "Open the CHAT_MESSAGE packet constant" },
  },
  {
    id: "wrap-read-change",
    group: "Wrappers",
    title: "Read or change a packet wrapper",
    summary: "Turn the packet context into a typed wrapper with readable properties and setters.",
    when: "Use it after filtering a packet type and only with the wrapper that corresponds to that packet.",
    does: "Creates the matching PacketEvents wrapper and exposes its complete adapted API.",
    input: "Wrapper type matching the packet context",
    output: "Typed wrapper",
    operations: [
      op("context.wrap(WrapperType)", "context.wrap(WrapperType)", "new WrapperType(PacketReceiveEvent)"),
      op("wrapper.message", "wrapper.message", "Wrapper#getMessage / setMessage"),
      op("context.reencode()", "context.reencode()", "PacketEvent#markForReEncode(true)"),
    ],
    code: nativeCode(
      ["ClientPacket", "packets", "WrapperPlayClientChatMessage"],
      ["packets.onReceive(ClientPacket.CHAT_MESSAGE, context => {", "  const chat = context.wrap(WrapperPlayClientChatMessage);", "  chat.message = chat.message.trim();", "  context.reencode();", "});"],
      ["ClientPacket", "WrapperPlayClientChatMessage", "packets"],
      ["@packets.listen_receive(ClientPacket.CHAT_MESSAGE)", "def normalize_chat(context):", "    chat = context.wrap(WrapperPlayClientChatMessage)", "    chat.message = chat.message.strip()", "    context.reencode()"],
      ["if (event.getPacketType() == PacketType.Play.Client.CHAT_MESSAGE) {", "    WrapperPlayClientChatMessage chat = new WrapperPlayClientChatMessage(event);", "    chat.setMessage(chat.getMessage().trim());", "    event.markForReEncode(true);", "}"],
    ),
    javaEquivalent: "new WrapperPlayClientChatMessage(PacketReceiveEvent) and PacketEvent#markForReEncode",
    flags: ["Netty thread", "Matching wrapper only"],
    api: { kind: "wrappers", name: "WrapperPlayClientChatMessage", label: "Open every chat-wrapper member" },
  },
  {
    id: "cancel-reencode",
    group: "Control",
    title: "Cancel or re-encode",
    summary: "Stop a packet or tell PacketEvents to serialize your wrapper changes.",
    when: "Cancel only when the protocol action must not reach its destination; re-encode after changing wrapper fields.",
    does: "Mutates the packet event while it is still inside the PacketEvents pipeline.",
    input: "Cancellation boolean or changed wrapper",
    output: "Blocked or rewritten packet",
    operations: [
      op("context.cancel()", "context.cancel()", "PacketEvent#setCancelled(true)"),
      op("context.reencode()", "context.reencode()", "PacketEvent#markForReEncode(true)"),
    ],
    code: nativeCode(
      ["ClientPacket", "packets", "WrapperPlayClientChatMessage"],
      ["packets.onReceive(ClientPacket.CHAT_MESSAGE, context => {", "  const chat = context.wrap(WrapperPlayClientChatMessage);", "  if (chat.message.toLowerCase() === \"stop\") {", "    context.cancel();", "    return;", "  }", "  chat.message = chat.message.trim();", "  context.reencode();", "});"],
      ["ClientPacket", "WrapperPlayClientChatMessage", "packets"],
      ["@packets.listen_receive(ClientPacket.CHAT_MESSAGE)", "def filter_chat(context):", "    chat = context.wrap(WrapperPlayClientChatMessage)", "    if chat.message.lower() == \"stop\":", "        context.cancel()", "        return", "    chat.message = chat.message.strip()", "    context.reencode()"],
      ["WrapperPlayClientChatMessage chat = new WrapperPlayClientChatMessage(event);", "if (chat.getMessage().equalsIgnoreCase(\"stop\")) {", "    event.setCancelled(true);", "    return;", "}", "chat.setMessage(chat.getMessage().trim());", "event.markForReEncode(true);"],
    ),
    javaEquivalent: "PacketEvent#setCancelled and markForReEncode",
    flags: ["Netty thread", "Protocol-sensitive"],
  },
  {
    id: "send-packet",
    group: "Sending",
    title: "Create and send a server packet",
    summary: "Call a wrapper like a normal constructor and send it to one player or everyone.",
    when: "Use it for protocol features, client-only updates, and packets without a high-level Java method.",
    does: "Creates the PacketEvents wrapper and sends it through the PlayerManager without exposing nested Java packages.",
    input: "Player and packet wrapper",
    output: "Serialized server packet",
    operations: [
      op("WrapperPlayServerUpdateHealth(health, food, saturation)", "WrapperPlayServerUpdateHealth(...) ", "new WrapperPlayServerUpdateHealth(...)"),
      op("packets.send(player, wrapper)", "packets.send(player, wrapper)", "PlayerManager#sendPacket(player, wrapper)"),
      op("packets.sendToAll(wrapper)", "packets.send_to_all(wrapper)", "sendPacket to each online player"),
    ],
    code: nativeCode(
      ["packets", "WrapperPlayServerUpdateHealth"],
      ["const health = WrapperPlayServerUpdateHealth(20, 20, 5);", "packets.send(player, health);", "", "// Optional: packets.sendToAll(health);"],
      ["WrapperPlayServerUpdateHealth", "packets"],
      ["health = WrapperPlayServerUpdateHealth(20.0, 20, 5.0)", "packets.send(player, health)", "", "# Optional: packets.send_to_all(health)"],
      ["WrapperPlayServerUpdateHealth health = new WrapperPlayServerUpdateHealth(20.0f, 20, 5.0f);", "PacketEvents.getAPI().getPlayerManager().sendPacket(player, health);"],
    ),
    javaEquivalent: "new WrapperPlayServerUpdateHealth(...) → PlayerManager#sendPacket",
    flags: ["Server → client", "Callable wrapper"],
    api: { kind: "wrappers", name: "WrapperPlayServerUpdateHealth", label: "Open every UpdateHealth constructor and member" },
  },
  {
    id: "listen-send",
    group: "Listeners",
    title: "Inspect outgoing packets",
    summary: "Observe or change packets before the server sends them to a client.",
    when: "Use it for per-player protocol customization, filtering, logging, or rewriting.",
    does: "Runs inside the send pipeline and exposes the same context helpers as receive listeners.",
    input: "Optional ServerPacket filter, callback, priority",
    output: "Registered send callback",
    operations: [
      op("packets.onSend(type, callback)", "@packets.listen_send(type)", "PacketListenerAbstract#onPacketSend"),
      op("ServerPacket.UPDATE_HEALTH", "ServerPacket.UPDATE_HEALTH", "PacketType.Play.Server.UPDATE_HEALTH"),
    ],
    code: nativeCode(
      ["info", "packets", "ServerPacket", "WrapperPlayServerUpdateHealth"],
      ["packets.onSend(ServerPacket.UPDATE_HEALTH, context => {", "  const health = context.wrap(WrapperPlayServerUpdateHealth);", "  info(`Sending health ${health.health}`);", "});"],
      ["packets", "ServerPacket", "WrapperPlayServerUpdateHealth", "info"],
      ["@packets.listen_send(ServerPacket.UPDATE_HEALTH)", "def outgoing_health(context):", "    health = context.wrap(WrapperPlayServerUpdateHealth)", "    info(f\"Sending health {health.health}\")"],
      ["@Override", "public void onPacketSend(PacketSendEvent event) {", "    if (event.getPacketType() != PacketType.Play.Server.UPDATE_HEALTH) return;", "    WrapperPlayServerUpdateHealth health = new WrapperPlayServerUpdateHealth(event);", "    getLogger().info(\"Sending health \" + health.getHealth());", "}"],
    ),
    javaEquivalent: "PacketListenerAbstract#onPacketSend + PacketType.Play.Server.*",
    flags: ["Network thread", "Server → client"],
    api: { kind: "packets", name: "UPDATE_HEALTH", label: "Open the UPDATE_HEALTH packet constant" },
  },
  {
    id: "packet-player-info",
    group: "Player data",
    title: "User, client version, and ping",
    summary: "Get PacketEvents' user object, negotiated client version, or measured ping for a Graaly player.",
    when: "Use it for version-specific behavior, diagnostics, and latency-aware mechanics.",
    does: "Looks up the PacketEvents User associated with the adapted Graaly Player.",
    input: "Player",
    output: "User, ClientVersion, or ping integer",
    operations: [
      op("packets.user(player)", "packets.user(player)", "PlayerManager#getUser(player)"),
      op("packets.clientVersion(player)", "packets.client_version(player)", "User#getClientVersion()"),
      op("packets.ping(player)", "packets.ping(player)", "PlayerManager#getPing(player)"),
    ],
    code: nativeCode(
      ["packets"],
      ["const user = packets.user(player);", "const version = packets.clientVersion(player);", "const ping = packets.ping(player);", "player.sendMessage(`Protocol ${version}, ${ping} ms`);"],
      ["packets"],
      ["user = packets.user(player)", "version = packets.client_version(player)", "ping = packets.ping(player)", "player.send_message(f\"Protocol {version}, {ping} ms\")"],
      ["User user = PacketEvents.getAPI().getPlayerManager().getUser(player);", "ClientVersion version = user.getClientVersion();", "int ping = PacketEvents.getAPI().getPlayerManager().getPing(player);", "player.sendMessage(\"Protocol \" + version + \", \" + ping + \" ms\");"],
    ),
    javaEquivalent: "PacketEvents PlayerManager and User client-version access",
    flags: ["Player must be connected"],
  },
  {
    id: "packet-thread-handoff",
    group: "Safety",
    title: "Keep the listener synchronous, then hand work off",
    summary: "Packet listeners are deliberately synchronous: read, rewrite, or cancel before the network pipeline continues, then schedule follow-up work.",
    when: "Use it whenever a packet callback needs to touch worlds, inventories, entities, or most player state.",
    does: "Rejects async and generator listeners at registration. A hidden Promise, coroutine, iterator, or other returned value quarantines the callback after one diagnostic, then follow-up work is scheduled explicitly.",
    input: "Packet data and scheduled work",
    output: "Safe server mutation on the next tick",
    operations: [
      op("tasks.run(callback)", "tasks.create_task(coroutine)", "BukkitScheduler#runTask(plugin, Runnable)"),
      op("context.player", "context.player", "PacketEvent#getPlayer()"),
    ],
    code: nativeCode(
      ["ClientPacket", "packets", "tasks", "WrapperPlayClientChatMessage"],
      ["packets.onReceive(ClientPacket.CHAT_MESSAGE, context => {", "  const player = context.player;", "  const message = context.wrap(WrapperPlayClientChatMessage).message;", "  if (!player) return;", "  tasks.run(() => player.sendMessage(`You sent: ${message}`));", "});"],
      ["ClientPacket", "PacketContext", "Player", "WrapperPlayClientChatMessage", "packets", "tasks"],
      ["async def notify(player: Player, message: str) -> None:", "    player.send_message(f\"You sent: {message}\")", "", "@packets.listen_receive(ClientPacket.CHAT_MESSAGE)", "def on_chat(context: PacketContext) -> None:", "    player = context.player", "    message = context.wrap(WrapperPlayClientChatMessage).message", "    if player is not None:", "        tasks.create_task(notify(player, message), name=\"chat-notice\")"],
      ["public void onPacketReceive(PacketReceiveEvent event) {", "    if (event.getPacketType() != PacketType.Play.Client.CHAT_MESSAGE) return;", "    Player player = (Player) event.getPlayer();", "    String message = new WrapperPlayClientChatMessage(event).getMessage();", "    if (player != null) Bukkit.getScheduler().runTask(plugin, () -> player.sendMessage(\"You sent: \" + message));", "}"],
    ),
    javaEquivalent: "Packet listener thread → BukkitScheduler#runTask",
    flags: ["Synchronous listener", "Network thread", "Required handoff"],
    note: "The callback must return undefined/None. Do not write async or generator listeners and do not return tasks.create_task(...): start it, then return normally. Contract violations disable only that listener and log once instead of flooding one stack trace per packet.",
  },
] as const;

// Keep this exported helper available to tests without duplicating display rules.
export function guideOperationForLanguage(operation: GuideOperation, language: GuideLanguage) {
  if (language === "py") return operation.python;
  if (language === "c") return operation.c;
  if (language === "java") return operation.java;
  return operation.native;
}

export function cGuideCode(topic: GuideTopic): string {
  const lines = [
    "#include <graaly/graaly.h>",
    "",
    `/* ${topic.title} */`,
    "/* Key Graaly C calls for this workflow: */",
    ...topic.operations.map(operation => {
      const selected = operation.c.trim();
      if (selected.startsWith("/*")) return selected;
      return selected.endsWith(";") ? selected : `${selected};`;
    }),
  ];

  if (topic.note) {
    lines.push("", `/* Important: ${topic.note.replaceAll("*/", "* /")} */`);
  }
  return lines.join("\n");
}

export const guideTopicCount = [
  ...commandTopics,
  ...playerTopics,
  ...worldTopics,
  ...entityTopics,
  ...packetTopics,
].length;
