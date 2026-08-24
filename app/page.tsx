"use client";

import {
  ArrowRight,
  Check,
  ChevronDown,
  Clipboard,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  Moon,
  Pause,
  Play,
  Search,
  Sun,
  X,
  Zap,
} from "lucide-react";
import { highlightElement, type ShjLanguage } from "@speed-highlight/core";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { bukkitEventCatalog } from "./generated-events";
import { catalogCounts } from "./generated-catalog-meta";
import {
  commandTopics,
  entityTopics,
  guideOperationForLanguage,
  packetTopics,
  playerTopics,
  worldTopics,
  type GuideLanguage,
  type GuideTopic,
} from "./guide-topics";
import { GraalyAcademy } from "./academy-playground";
import graalyContract from "./generated/graaly-api.json" with { type: "json" };
import graalyConstants from "./generated/latest-constants.json" with { type: "json" };

type Language = "js" | "ts" | "py";
type QuickstartLanguage = Language | "java";
type CatalogKind = "bukkit" | "support" | "wrappers" | "packets";
type MemberFilter = "all" | "properties" | "methods" | "constructors" | "constants";
type Theme = "dark" | "light";

type LearningTrack = {
  title: string;
  intro: string;
  file: string;
  code: string;
  recipe: { title: string; file: string; code: string };
  concepts: readonly { syntax: string; name: string; detail: string }[];
  sources: readonly { label: string; href: string }[];
};

type ReactFastApiPattern = {
  id: string;
  step: string;
  title: string;
  level: "Foundation" | "Application" | "Production";
  reactPattern: string;
  fastApiPattern: string;
  reason: string;
  avoid: string;
  flow: readonly string[];
  reactFile: string;
  fastApiFile: string;
  reactCode: string;
  fastApiCode: string;
};

type StudioLesson = {
  id: string;
  number: string;
  phase: "Understand" | "Build" | "Connect" | "Scale" | "Ship";
  title: string;
  file: string;
  language: "ts" | "py" | "shell";
  code: string;
  focus: readonly [number, number];
  summary: string;
  why: string;
  webDifference: string;
  decision: string;
  remember: string;
};

type CatalogMember = {
  kind: string;
  name: string;
  java: string;
  javaScript: string;
  typeScript: string;
  python: string;
};

type CatalogEntry = {
  name: string;
  javaName: string;
  usage: string;
  parents: readonly string[];
  members: readonly CatalogMember[];
};

type CatalogEntries = Record<CatalogKind, CatalogEntry[]>;
type CatalogSource = typeof import("./generated-api-reference");

type ResolvedCatalogMember = CatalogMember & {
  declaredBy: string;
  inherited: boolean;
};

type BukkitEventEntry = (typeof bukkitEventCatalog)[number];

const languages: Array<{ id: Language; label: string }> = [
  { id: "js", label: "JavaScript" },
  { id: "ts", label: "TypeScript" },
  { id: "py", label: "Python" },
];

const quickstartLanguages: Array<{ id: QuickstartLanguage; label: string }> = [
  ...languages,
  { id: "java", label: "Java" },
];

const guideLanguages: Array<{ id: GuideLanguage; label: string; short: string }> = [
  { id: "js", label: "JavaScript", short: "JS" },
  { id: "ts", label: "TypeScript", short: "TS" },
  { id: "py", label: "Python", short: "PY" },
  { id: "java", label: "Java equivalent", short: "JAVA" },
];

const navigation = [
  {
    label: "Start",
    items: [
      { id: "overview", title: "Overview" },
      { id: "prerequisites", title: "Prerequisites" },
      { id: "compatibility", title: "One stable API" },
      { id: "quickstart", title: "Quick start" },
      { id: "learn", title: "Learn the languages" },
    ],
  },
  {
    label: "Build",
    items: [
      { id: "events", title: "Events" },
      { id: "commands", title: "Commands & tasks" },
      { id: "players", title: "Players" },
      { id: "worlds", title: "Worlds & generators" },
      { id: "entities", title: "Entities & attributes" },
      { id: "react-ui", title: "React UI & FastAPI" },
      { id: "academy", title: "Graaly Academy" },
      { id: "boards", title: "Website boards (Soon)" },
      { id: "packets", title: "PacketEvents" },
    ],
  },
  {
    label: "Look up",
    items: [
      { id: "api-reference", title: "Complete API" },
      { id: "conformance", title: "API conformance" },
      { id: "safety", title: "Threading & safety" },
      { id: "troubleshooting", title: "Troubleshooting" },
    ],
  },
] as const;

const documentationSections = navigation.flatMap(group => group.items);
const documentationSectionIds: ReadonlySet<string> = new Set(
  documentationSections.map(item => item.id),
);

const stableModuleCount = Object.keys(graalyContract.modules).length;
const stableCapabilityEntries = Object.entries(graalyContract.capabilities);
const stableConstantEntries = Object.values(graalyConstants.namespaces);
const stableConstantCount = stableConstantEntries.reduce(
  (total, namespace) => total + namespace.constants.length,
  0,
);

const learningTracks: Record<Language, LearningTrack> = {
  js: {
    title: "Modern JavaScript through real server code",
    intro: "Graaly supplies the game domain; the syntax remains standard ECMAScript. This example combines modules, destructuring, iterables, array methods, optional values, templates, and async flow.",
    file: "language-tour.mjs",
    code: [
      "import { events, PlayerJoinEvent, players, tasks } from \"graaly\";",
      "",
      "events.on(PlayerJoinEvent, async ({ player }) => {",
      "  const onlineNames = [...players]",
      "    .map(({ name }) => name)",
      "    .filter(name => name !== player.name);",
      "",
      "  const friend = players.exact(\"Alex\");",
      "  const friendName = friend?.displayName ?? \"nobody yet\";",
      "",
      "  await tasks.sleep(1);",
      "  player.sendMessage(",
      "    `${onlineNames.length} others online · friend: ${friendName}`",
      "  );",
      "});",
    ].join("\n"),
    recipe: {
      title: "Generators and error handling",
      file: "language-patterns.mjs",
      code: [
        "import { info, players } from \"graaly\";",
        "",
        "function* onlineNames() {",
        "  for (const { name } of players) yield name;",
        "}",
        "",
        "export function reportOnline() {",
        "  try {",
        "    const names = [...onlineNames()];",
        "    if (!names.length) throw new Error(\"Nobody is online\");",
        "    info(names.join(\", \"));",
        "  } catch (error) {",
        "    info(error instanceof Error ? error.message : String(error));",
        "  } finally {",
        "    info(\"Report complete\");",
        "  }",
        "}",
      ].join("\n"),
    },
    concepts: [
      { syntax: "import · export", name: "Modules", detail: "Split plugins into files and import Graaly like a normal ESM package." },
      { syntax: "const · let", name: "Bindings", detail: "Prefer const; use let only when the binding itself must change." },
      { syntax: "=>", name: "Arrow functions", detail: "Write compact listeners, predicates, mappers, and task callbacks." },
      { syntax: "{ player } · ...", name: "Destructuring & spread", detail: "Extract event fields and turn Graaly iterables into ordinary arrays." },
      { syntax: "?. · ??", name: "Optional values", detail: "Handle a missing player without a Java-style null ceremony." },
      { syntax: "for...of", name: "Iteration", detail: "Iterate players, worlds, arrays, maps, sets, and API collections." },
      { syntax: "async · await", name: "Async flow", detail: "Pause readable workflows on Graaly promises without callback nesting." },
      { syntax: "try · catch · finally", name: "Errors & cleanup", detail: "Handle failures and guarantee cleanup with language syntax." },
      { syntax: "Map · Set", name: "Native collections", detail: "Model keyed state and unique values with built-in collections." },
    ],
    sources: [
      { label: "MDN JavaScript Guide", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" },
      { label: "GraalJS modules", href: "https://www.graalvm.org/latest/reference-manual/js/Modules/" },
    ],
  },
  ts: {
    title: "TypeScript that teaches the type system",
    intro: "Graaly's generated declarations let the compiler infer event and API types. Add annotations where they explain intent, then use narrowing instead of casts or host-class lookups.",
    file: "language-tour.ts",
    code: [
      "import { commands, players, type CommandContext, type Player }",
      "  from \"graaly\";",
      "",
      "const actions = [\"heal\", \"where\"] as const;",
      "type Action = (typeof actions)[number];",
      "const labels = { heal: \"Heal\", where: \"Position\" }",
      "  satisfies Record<Action, string>;",
      "",
      "function isAction(value: string | undefined): value is Action {",
      "  return value !== undefined && actions.some(action => action === value);",
      "}",
      "",
      "function playerSender(context: CommandContext): Player | null {",
      "  if (!players.isPlayer(context.sender)) {",
      "    context.reply(\"Players only.\");",
      "    return null;",
      "  }",
      "  return context.sender; // narrowed to Player",
      "}",
      "",
      "commands.on(\"profile\", context => {",
      "  const player = playerSender(context);",
      "  if (!player) return true;",
      "  const action = context.args[0];",
      "  if (!isAction(action)) return false;",
      "",
      "  if (action === \"heal\") player.health = player.maxHealth;",
      "  context.reply(`${labels[action]}: ${player.location}`);",
      "  return true;",
      "});",
    ].join("\n"),
    recipe: {
      title: "Discriminated unions and exhaustive switch",
      file: "language-patterns.ts",
      code: [
        "import { worlds, type World } from \"graaly\";",
        "",
        "type WorldLookup =",
        "  | { kind: \"found\"; world: World }",
        "  | { kind: \"missing\"; name: string };",
        "",
        "function lookup(name: string): WorldLookup {",
        "  const world = worlds.get(name);",
        "  return world ? { kind: \"found\", world } : { kind: \"missing\", name };",
        "}",
        "",
        "function describe(result: WorldLookup): string {",
        "  switch (result.kind) {",
        "    case \"found\": return `Loaded ${result.world.name}`;",
        "    case \"missing\": return `Missing ${result.name}`;",
        "    default: {",
        "      const unreachable: never = result;",
        "      return unreachable;",
        "    }",
        "  }",
        "}",
      ].join("\n"),
    },
    concepts: [
      { syntax: "type · interface", name: "Domain models", detail: "Name shapes and unions; they disappear from the bundled JavaScript." },
      { syntax: ": Player", name: "Annotations", detail: "Annotate boundaries and public helpers, not every obvious local variable." },
      { syntax: "\"heal\" | \"where\"", name: "Literal unions", detail: "Represent the exact states or command actions your plugin accepts." },
      { syntax: "value is Player", name: "Type guards", detail: "players.isPlayer narrows a command sender safely inside the branch." },
      { syntax: "null · undefined", name: "Strict absence", detail: "Check lookups before access; the SDK models missing values explicitly." },
      { syntax: "satisfies", name: "Checked objects", detail: "Validate an object shape without losing its precise inferred values." },
      { syntax: "readonly · as const", name: "Immutable intent", detail: "Preserve literal values and prevent accidental mutation in types." },
      { syntax: "unknown", name: "Safe boundaries", detail: "Narrow untrusted values before use instead of weakening code with any." },
      { syntax: "switch · never", name: "Exhaustive decisions", detail: "Make the compiler reveal a newly added union case you forgot to handle." },
    ],
    sources: [
      { label: "TypeScript narrowing", href: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html" },
      { label: "TypeScript everyday types", href: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html" },
    ],
  },
  py: {
    title: "Python syntax, not Java written with underscores",
    intro: "Graaly uses decorators, snake_case, real iterables, type hints, keyword arguments, and asyncio. The example deliberately teaches Python control flow instead of hiding it behind callback helpers.",
    file: "language_tour.py",
    code: [
      "from graaly import (",
      "    CommandContext, PlayerJoinEvent, command, event, players, tasks,",
      ")",
      "",
      "@event(PlayerJoinEvent)",
      "async def welcome(event: PlayerJoinEvent) -> None:",
      "    others = [player.name for player in players",
      "              if player != event.player]",
      "    await tasks.sleep_ticks(20)",
      "    event.player.send_message(",
      "        f\"Online now: {', '.join(others) or 'only you'}\"",
      "    )",
      "",
      "@command(\"team\")",
      "def team(context: CommandContext) -> bool:",
      "    match context.args:",
      "        case [\"list\"]:",
      "            context.reply(\", \".join(p.name for p in players))",
      "        case [\"find\", name] if (target := players.exact(name)) is not None:",
      "            context.reply(f\"Found {target.name}\")",
      "        case _:",
      "            return False",
      "    return True",
    ].join("\n"),
    recipe: {
      title: "Generators, context managers, and exceptions",
      file: "language_patterns.py",
      code: [
        "from collections.abc import Iterator",
        "from contextlib import contextmanager",
        "from graaly import Player, info, players",
        "",
        "def online_names() -> Iterator[str]:",
        "    for player in players:",
        "        yield player.name",
        "",
        "@contextmanager",
        "def temporary_health(player: Player, value: float) -> Iterator[Player]:",
        "    previous = player.health",
        "    try:",
        "        if value < 0:",
        "            raise ValueError(\"health cannot be negative\")",
        "        player.health = min(value, player.max_health)",
        "        yield player",
        "    except ValueError as error:",
        "        info(f\"Invalid health: {error}\")",
        "        raise",
        "    finally:",
        "        player.health = previous",
        "",
        "def show_temporary_health(player: Player) -> None:",
        "    with temporary_health(player, 20.0) as healed:",
        "        healed.send_message(\", \".join(online_names()))",
      ].join("\n"),
    },
    concepts: [
      { syntax: "from · import · as", name: "Modules", detail: "Import explicit Graaly names and alias modules only when it improves clarity." },
      { syntax: "def · return", name: "Functions", detail: "Give behavior a name, annotate its contract, and return deliberately." },
      { syntax: "@event · @command", name: "Decorators", detail: "Register normal functions without a separate callback assignment." },
      { syntax: ": Player · -> bool", name: "Type hints", detail: "Get Pyright completion while keeping normal runtime Python semantics." },
      { syntax: "if · elif · else", name: "Decisions", detail: "Express rules in ordinary control flow rather than API-specific condition builders." },
      { syntax: "for · in", name: "Iteration", detail: "Loop directly over players, worlds, lists, dictionaries, and sets." },
      { syntax: "[x for x in values]", name: "Comprehensions", detail: "Transform or filter a small iterable clearly; use a loop when logic grows." },
      { syntax: "match · case", name: "Pattern matching", detail: "Destructure command arguments and handle exact shapes with readable cases." },
      { syntax: "async · await", name: "Coroutines", detail: "Use asyncio sequencing, gathering, timeouts, and cancellation directly." },
      { syntax: "try · except · finally · raise", name: "Errors", detail: "Catch specific failures, raise useful errors, and always clean up." },
      { syntax: "with · as", name: "Context managers", detail: "Use standard-library or package context managers; Graaly does not invent a fake one." },
      { syntax: "yield", name: "Generators", detail: "Create lazy helper iterators when producing values one at a time is clearer." },
      { syntax: "is None · and · or · not", name: "Identity & logic", detail: "Handle optional lookups and combine rules with native boolean operators." },
    ],
    sources: [
      { label: "The Python Tutorial", href: "https://docs.python.org/3/tutorial/" },
      { label: "Python control flow", href: "https://docs.python.org/3/tutorial/controlflow.html" },
      { label: "Python data structures", href: "https://docs.python.org/3/tutorial/datastructures.html" },
    ],
  },
};

const learningConceptExamples: Record<Language, readonly { file: string; code: string }[]> = {
  js: [
    {
      file: "modules.mjs",
      code: [
        'import { players } from "graaly";',
        "",
        "export function onlineNames() {",
        "  return [...players].map(player => player.name);",
        "}",
      ].join("\n"),
    },
    {
      file: "bindings.mjs",
      code: [
        'import { info, players } from "graaly";',
        "",
        "const warningAt = 20;",
        "let count = 0;",
        "",
        "for (const player of players) count += 1;",
        "if (count >= warningAt) info(`Busy server: ${count} players`);",
      ].join("\n"),
    },
    {
      file: "arrow-functions.mjs",
      code: [
        'import { events, PlayerJoinEvent, players } from "graaly";',
        "",
        "events.on(PlayerJoinEvent, event => {",
        "  const names = [...players]",
        "    .filter(player => player !== event.player)",
        "    .map(player => player.name);",
        "  event.player.sendMessage(names.join(\", \"));",
        "});",
      ].join("\n"),
    },
    {
      file: "destructuring.mjs",
      code: [
        'import { events, PlayerJoinEvent, players } from "graaly";',
        "",
        "events.on(PlayerJoinEvent, ({ player }) => {",
        "  const names = [...players].map(({ name }) => name);",
        "  player.sendMessage(`Online: ${names.join(\", \")}`);",
        "});",
      ].join("\n"),
    },
    {
      file: "optional-values.mjs",
      code: [
        'import { players } from "graaly";',
        "",
        'const target = players.exact("Alex");',
        'const label = target?.displayName ?? "Alex is offline";',
        "target?.sendMessage(`Your display name is ${label}`);",
      ].join("\n"),
    },
    {
      file: "iteration.mjs",
      code: [
        'import { players } from "graaly";',
        "",
        "for (const player of players) {",
        '  player.sendMessage("The server is restarting soon.");',
        "}",
      ].join("\n"),
    },
    {
      file: "async-flow.mjs",
      code: [
        'import { events, PlayerJoinEvent, tasks } from "graaly";',
        "",
        "events.on(PlayerJoinEvent, async ({ player }) => {",
        "  await tasks.sleep(1);",
        '  player.sendMessage("You have been online for one second.");',
        "});",
      ].join("\n"),
    },
    {
      file: "errors.mjs",
      code: [
        'import { config, info, warn } from "graaly";',
        "",
        "try {",
        "  const value = Number(config.get(\"spawn.health\", 20));",
        '  if (!Number.isFinite(value)) throw new TypeError("Invalid health");',
        "  info(`Configured health: ${value}`);",
        "} catch (error) {",
        "  warn(error instanceof Error ? error.message : String(error));",
        "} finally {",
        '  info("Configuration check complete");',
        "}",
      ].join("\n"),
    },
    {
      file: "collections.mjs",
      code: [
        'import { commands } from "graaly";',
        "",
        "const visits = new Map();",
        "const muted = new Set();",
        "",
        'commands.on("visit", context => {',
        "  const id = context.sender.name;",
        "  visits.set(id, (visits.get(id) ?? 0) + 1);",
        "  if (!muted.has(id)) context.reply(`Visits: ${visits.get(id)}`);",
        "  return true;",
        "});",
      ].join("\n"),
    },
  ],
  ts: [
    {
      file: "domain-models.ts",
      code: [
        'import { players, type Player } from "graaly";',
        "",
        "interface PlayerSummary {",
        "  readonly name: string;",
        "  readonly health: number;",
        "}",
        "",
        "function summarize(player: Player): PlayerSummary {",
        "  return { name: player.name, health: player.health };",
        "}",
        "",
        "const summaries = [...players].map(summarize);",
      ].join("\n"),
    },
    {
      file: "annotations.ts",
      code: [
        'import { players, type Player } from "graaly";',
        "",
        "function heal(player: Player, amount: number): void {",
        "  player.health = Math.min(player.maxHealth, player.health + amount);",
        "}",
        "",
        'const target = players.exact("Alex");',
        "if (target) heal(target, 4);",
      ].join("\n"),
    },
    {
      file: "literal-unions.ts",
      code: [
        'import { commands } from "graaly";',
        "",
        'type Action = "heal" | "where";',
        'const actions: readonly Action[] = ["heal", "where"];',
        "",
        'commands.complete("profile", context =>',
        "  actions.filter(action => action.startsWith(context.args[0] ?? \"\"))",
        ");",
      ].join("\n"),
    },
    {
      file: "type-guards.ts",
      code: [
        'import { commands, players } from "graaly";',
        "",
        'commands.on("healme", context => {',
        "  if (!players.isPlayer(context.sender)) {",
        '    context.reply("Players only.");',
        "    return true;",
        "  }",
        "  context.sender.health = context.sender.maxHealth;",
        "  return true;",
        "});",
      ].join("\n"),
    },
    {
      file: "strict-absence.ts",
      code: [
        'import { commands, worlds } from "graaly";',
        "",
        'commands.on("worldinfo", context => {',
        "  const world = worlds.get(context.args[0] ?? \"\");",
        "  if (!world) return false;",
        "  context.reply(`Loaded world: ${world.name}`);",
        "  return true;",
        "});",
      ].join("\n"),
    },
    {
      file: "satisfies.ts",
      code: [
        'type Rank = "member" | "moderator" | "admin";',
        "",
        "const rankColors = {",
        '  member: "&7",',
        '  moderator: "&b",',
        '  admin: "&c",',
        "} satisfies Record<Rank, string>;",
      ].join("\n"),
    },
    {
      file: "immutable-intent.ts",
      code: [
        'const lobbySpawn = [0.5, 65, 0.5] as const;',
        'const allowedWorlds: readonly string[] = ["world", "arena"];',
        "",
        "const [x, y, z] = lobbySpawn;",
        "const canJoin = allowedWorlds.includes(\"arena\");",
      ].join("\n"),
    },
    {
      file: "unknown-boundary.ts",
      code: [
        'import { config, info } from "graaly";',
        "",
        'const raw: unknown = config.get("motd", "Welcome");',
        "if (typeof raw === \"string\") {",
        "  info(raw.toUpperCase());",
        "}",
      ].join("\n"),
    },
    {
      file: "exhaustive-decisions.ts",
      code: [
        'type Result = { kind: "ok"; value: string } | { kind: "missing" };',
        "",
        "function message(result: Result): string {",
        "  switch (result.kind) {",
        '    case "ok": return result.value;',
        '    case "missing": return "Not found";',
        "    default: {",
        "      const impossible: never = result;",
        "      return impossible;",
        "    }",
        "  }",
        "}",
      ].join("\n"),
    },
  ],
  py: [
    {
      file: "modules.py",
      code: [
        "from graaly import players",
        "",
        "def online_names() -> list[str]:",
        "    return [player.name for player in players]",
      ].join("\n"),
    },
    {
      file: "functions.py",
      code: [
        "from graaly import Player",
        "",
        'def greet(player: Player, prefix: str = "Welcome") -> None:',
        '    player.send_message(f"{prefix}, {player.name}!")',
      ].join("\n"),
    },
    {
      file: "decorators.py",
      code: [
        "from graaly import PlayerJoinEvent, command, event",
        "",
        "@event(PlayerJoinEvent)",
        "def on_join(join: PlayerJoinEvent) -> None:",
        '    join.player.send_message("Welcome!")',
        "",
        '@command("hello")',
        "def hello(context) -> bool:",
        '    context.reply("Hello!")',
        "    return True",
      ].join("\n"),
    },
    {
      file: "type_hints.py",
      code: [
        "from graaly import Player",
        "",
        "def heal(player: Player, amount: float) -> float:",
        "    player.health = min(player.max_health, player.health + amount)",
        "    return player.health",
      ].join("\n"),
    },
    {
      file: "decisions.py",
      code: [
        "from graaly import Player",
        "",
        "def rank_label(player: Player) -> str:",
        '    if player.has_permission("rank.admin"):',
        '        return "Admin"',
        '    elif player.has_permission("rank.member"):',
        '        return "Member"',
        '    else:',
        '        return "Guest"',
      ].join("\n"),
    },
    {
      file: "iteration.py",
      code: [
        "from graaly import players",
        "",
        "for player in players:",
        '    player.send_message("The server is restarting soon.")',
      ].join("\n"),
    },
    {
      file: "comprehensions.py",
      code: [
        "from graaly import players",
        "",
        "healthy_names = [",
        "    player.name",
        "    for player in players",
        "    if player.health == player.max_health",
        "]",
      ].join("\n"),
    },
    {
      file: "pattern_matching.py",
      code: [
        "from graaly import command",
        "",
        '@command("team")',
        "def team(context) -> bool:",
        "    match context.args:",
        '        case ["join", name]:',
        '            context.reply(f"Joining {name}")',
        '        case ["leave"]:',
        '            context.reply("Leaving the team")',
        "        case _:",
        "            return False",
        "    return True",
      ].join("\n"),
    },
    {
      file: "coroutines.py",
      code: [
        "from graaly import PlayerJoinEvent, event, tasks",
        "",
        "@event(PlayerJoinEvent)",
        "async def on_join(join: PlayerJoinEvent) -> None:",
        "    await tasks.sleep_ticks(20)",
        '    join.player.send_message("One second later")',
      ].join("\n"),
    },
    {
      file: "errors.py",
      code: [
        "from graaly import config, info, warn",
        "",
        "try:",
        '    health = float(config.get("spawn.health", 20))',
        "    if health < 0:",
        '        raise ValueError("health cannot be negative")',
        "    info(f\"Configured health: {health}\")",
        "except (TypeError, ValueError) as error:",
        "    warn(f\"Invalid configuration: {error}\")",
        "finally:",
        '    info("Configuration check complete")',
      ].join("\n"),
    },
    {
      file: "context_managers.py",
      code: [
        "from contextlib import contextmanager",
        "from collections.abc import Iterator",
        "from graaly import Player",
        "",
        "@contextmanager",
        "def temporary_health(player: Player) -> Iterator[None]:",
        "    previous = player.health",
        "    try:",
        "        player.health = player.max_health",
        "        yield",
        "    finally:",
        "        player.health = previous",
      ].join("\n"),
    },
    {
      file: "generators.py",
      code: [
        "from collections.abc import Iterator",
        "from graaly import players",
        "",
        "def online_names() -> Iterator[str]:",
        "    for player in players:",
        "        yield player.name",
        "",
        'names = ", ".join(online_names())',
      ].join("\n"),
    },
    {
      file: "identity_and_logic.py",
      code: [
        "from graaly import players",
        "",
        'target = players.exact("Alex")',
        "if target is not None and not target.dead:",
        '    target.send_message("You are online and alive.")',
      ].join("\n"),
    },
  ],
};

const quickstartCode: Record<QuickstartLanguage, string> = {
  js: [
    "import { commands, events, PlayerJoinEvent } from \"graaly\";",
    "",
    "events.on(PlayerJoinEvent, event => {",
    "  event.joinMessage = `§a${event.player.name} joined`;",
    "  event.player.sendMessage(\"&aWelcome!\");",
    "});",
    "",
    "commands.on(\"hello\", context => {",
    "  context.reply(`&aHello ${context.sender.name}`);",
    "  return true;",
    "});",
  ].join("\n"),
  ts: [
    "import { commands, events, PlayerJoinEvent }",
    "  from \"graaly\";",
    "",
    "events.on(PlayerJoinEvent, event => {",
    "  event.joinMessage = `§b${event.player.name} joined`;",
    "  event.player.sendMessage(\"&bWelcome!\");",
    "});",
    "",
    "commands.on(\"hello\", context => {",
    "  context.reply(`&bHello ${context.sender.name}`);",
    "  return true;",
    "});",
  ].join("\n"),
  py: [
    "from graaly import PlayerJoinEvent, command, event",
    "",
    "@event(PlayerJoinEvent)",
    "def on_join(event):",
    "    event.join_message = f\"§d{event.player.name} joined\"",
    "    event.player.send_message(\"&dWelcome!\")",
    "",
    "@command(\"hello\")",
    "def hello(context):",
    "    context.reply(f\"&dHello {context.sender.name}\")",
    "    return True",
  ].join("\n"),
  java: [
    "package com.example.welcome;",
    "",
    "import org.bukkit.event.EventHandler;",
    "import org.bukkit.event.Listener;",
    "import org.bukkit.event.player.PlayerJoinEvent;",
    "import org.bukkit.plugin.java.JavaPlugin;",
    "",
    "public final class WelcomePlugin extends JavaPlugin implements Listener {",
    "    @Override",
    "    public void onEnable() {",
    "        getServer().getPluginManager().registerEvents(this, this);",
    "        getCommand(\"hello\").setExecutor((sender, command, label, args) -> {",
    "            sender.sendMessage(\"§aHello \" + sender.getName());",
    "            return true;",
    "        });",
    "    }",
    "",
    "    @EventHandler",
    "    public void onJoin(PlayerJoinEvent event) {",
    "        event.setJoinMessage(\"§a\" + event.getPlayer().getName() + \" joined\");",
    "        event.getPlayer().sendMessage(\"§aWelcome!\");",
    "    }",
    "}",
  ].join("\n"),
};

const pluginYaml: Record<QuickstartLanguage, string> = {
  js: [
    "name: WelcomeJS",
    "version: 1.0.0",
    "main: dist/main.mjs",
    "commands:",
    "  hello:",
    "    description: Say hello",
  ].join("\n"),
  ts: [
    "name: WelcomeTS",
    "version: 1.0.0",
    "main: dist/main.mjs",
    "commands:",
    "  hello:",
    "    description: Say hello",
  ].join("\n"),
  py: [
    "name: WelcomePy",
    "version: 1.0.0",
    "main: main.py",
    "commands:",
    "  hello:",
    "    description: Say hello",
  ].join("\n"),
  java: [
    "name: WelcomeJava",
    "version: 1.0.0",
    "main: com.example.welcome.WelcomePlugin",
    "commands:",
    "  hello:",
    "    description: Say hello",
  ].join("\n"),
};

const graalyInstallCommands = [
  "git clone https://github.com/sk8erboi17/Graaly.git",
  "cd Graaly/runtime",
  "mvn clean package",
  "",
  "# Copy the runtime, not the legacy agent, into the server:",
  "cp target/Graaly-1.0.0.jar /absolute/path/to/server/plugins/",
  "",
  "cd /absolute/path/to/server",
  "java -jar server.jar nogui",
].join("\n");

const graalyFirstStartLayout = [
  "server/",
  "├── server.jar",
  "└── plugins/",
  "    ├── Graaly-1.0.0.jar",
  "    └── Graaly/",
  "        ├── config.yml",
  "        ├── runtime/25.2.4/",
  "        └── scripts/",
].join("\n");

const quickstartDeployment: Record<QuickstartLanguage, {
  buildLabel: string;
  build: string;
  deployLabel: string;
  deploy: string;
  layout: string;
  load: string;
}> = {
  js: {
    buildLabel: "Build JavaScript",
    build: [
      "cd /absolute/path/to/Graaly/runtime/examples/JavaScriptHello.jsplugin",
      "npm ci",
      "npm run build",
      "# Output: dist/main.mjs",
    ].join("\n"),
    deployLabel: "Copy the runtime files",
    deploy: [
      "mkdir -p /absolute/path/to/server/plugins/Graaly/scripts/WelcomeJS.jsplugin/dist",
      "cp plugin.yml /absolute/path/to/server/plugins/Graaly/scripts/WelcomeJS.jsplugin/",
      "cp dist/main.mjs /absolute/path/to/server/plugins/Graaly/scripts/WelcomeJS.jsplugin/dist/",
    ].join("\n"),
    layout: [
      "plugins/Graaly/scripts/WelcomeJS.jsplugin/",
      "├── plugin.yml",
      "└── dist/",
      "    └── main.mjs",
    ].join("\n"),
    load: "For a new bundle, restart the server. After changing code in an already loaded bundle, rebuild, copy dist/main.mjs, then run graaly reload in the server console or /graaly reload in game.",
  },
  ts: {
    buildLabel: "Compile and type-check TypeScript",
    build: [
      "cd /absolute/path/to/Graaly/runtime/examples/TypeScriptHello.jsplugin",
      "npm ci",
      "npm run build",
      "# Output: dist/main.mjs",
    ].join("\n"),
    deployLabel: "Copy the compiled bundle",
    deploy: [
      "mkdir -p /absolute/path/to/server/plugins/Graaly/scripts/WelcomeTS.jsplugin/dist",
      "cp plugin.yml /absolute/path/to/server/plugins/Graaly/scripts/WelcomeTS.jsplugin/",
      "cp dist/main.mjs /absolute/path/to/server/plugins/Graaly/scripts/WelcomeTS.jsplugin/dist/",
    ].join("\n"),
    layout: [
      "plugins/Graaly/scripts/WelcomeTS.jsplugin/",
      "├── plugin.yml",
      "└── dist/",
      "    └── main.mjs",
    ].join("\n"),
    load: "For a new bundle, restart the server. After changing code in an already loaded bundle, rebuild, copy dist/main.mjs, then run graaly reload in the server console or /graaly reload in game.",
  },
  py: {
    buildLabel: "Prepare Python",
    build: [
      "cd /absolute/path/to/Graaly/runtime/examples/PythonHello.pyplugin",
      "# GraalPy executes main.py directly; there is no build output.",
      "# Run Pyright from your editor or project environment if desired.",
    ].join("\n"),
    deployLabel: "Copy the Python bundle",
    deploy: [
      "mkdir -p /absolute/path/to/server/plugins/Graaly/scripts/WelcomePy.pyplugin",
      "cp plugin.yml main.py /absolute/path/to/server/plugins/Graaly/scripts/WelcomePy.pyplugin/",
    ].join("\n"),
    layout: [
      "plugins/Graaly/scripts/WelcomePy.pyplugin/",
      "├── plugin.yml",
      "└── main.py",
    ].join("\n"),
    load: "For a new bundle, restart the server. After changing main.py in an already loaded bundle, copy it and run graaly reload in the server console or /graaly reload in game.",
  },
  java: {
    buildLabel: "Build the Java plugin",
    build: [
      "# From your Maven Java plugin project",
      "mvn clean package",
      "# Output: target/WelcomeJava.jar",
    ].join("\n"),
    deployLabel: "Copy the Java JAR",
    deploy: [
      "cp target/WelcomeJava.jar /absolute/path/to/server/plugins/",
    ].join("\n"),
    layout: [
      "plugins/",
      "├── Graaly-1.0.0.jar",
      "└── WelcomeJava.jar",
    ].join("\n"),
    load: "Java plugins do not use Graaly's script loader. Restart the server after copying the JAR; /graaly reload only reloads JavaScript, TypeScript, and Python bundles.",
  },
};

const boardConfigCode = [
  "settings:",
  "  view-grouping:",
  "    players:",
  "      type: individual",
  "",
  "website:",
  "  root: sites/control-panel/dist",
  "  entry: index.html",
  "  refresh-ticks: 5",
  "  transparent: false",
  "  unsafe-eval: false  # enable only for trusted runtimes that compile code",
  "  network:",
  "    enabled: false",
  "",
  "displays:",
  "  control-panel:",
  "    world: world",
  "    width: 4",
  "    height: 3",
  "    visible-radius: 32",
  "    location: { x: 0, y: 70, z: 0, facing: SOUTH }",
].join("\n");

const boardFrontendHtml = [
  "<main class=\"panel\">",
  "  <h1 id=\"welcome\">Welcome</h1>",
  "  <label>Destination",
  "    <select id=\"destination\">",
  "      <option value=\"survival\">Survival</option>",
  "      <option value=\"arena\">Arena</option>",
  "    </select>",
  "  </label>",
  "  <label><input id=\"alerts\" type=\"checkbox\"> Alerts</label>",
  "  <input id=\"nickname\" placeholder=\"Click, then type in chat\">",
  "  <button id=\"teleport\" type=\"button\">Teleport</button>",
  "  <script type=\"module\" src=\"./main.js\"></script>",
  "</main>",
].join("\n");

const boardFrontendTypeScript = [
  "type PanelData = { online: number; notice: string };",
  "",
  "const destination = document.querySelector<HTMLSelectElement>(",
  "  \"#destination\"",
  ")!;",
  "",
  "graaly.onState<PanelData>(state => {",
  "  document.querySelector(\"#welcome\")!.textContent =",
  "    `Welcome, ${state.player?.name ?? \"player\"}`;",
  "});",
  "",
  "document.querySelector(\"#teleport\")!.addEventListener(\"click\", () => {",
  "  void graaly.send(\"teleport\", { destination: destination.value });",
  "});",
  "",
  "document.querySelector(\"#alerts\")!.addEventListener(\"change\", event => {",
  "  const enabled = (event.currentTarget as HTMLInputElement).checked;",
  "  void graaly.send(\"alerts\", { enabled });",
  "});",
].join("\n");

const boardBridgeCode: Record<GuideLanguage, string> = {
  js: [
    "import { boards, events, PlayerJoinEvent } from \"graaly\";",
    "",
    "events.on(PlayerJoinEvent, ({ player }) => {",
    "  boards.state(\"control-panel\", player, {",
    "    online: 42, notice: \"Choose an action\"",
    "  });",
    "});",
    "",
    "boards.onMessage(\"control-panel\", message => {",
    "  if (message.type === \"teleport\") {",
    "    const destination = message.data.destination;",
    "    // Validate the destination, then teleport message.player.",
    "  }",
    "});",
  ].join("\n"),
  ts: [
    "import { boards, events, PlayerJoinEvent, type BoardMessage } from \"graaly\";",
    "",
    "type PanelState = { online: number; notice: string };",
    "type TeleportData = { destination: string };",
    "",
    "events.on(PlayerJoinEvent, ({ player }) => {",
    "  const state: PanelState = { online: 42, notice: \"Choose an action\" };",
    "  boards.state(\"control-panel\", player, state);",
    "});",
    "",
    "boards.onMessage(\"control-panel\", (message: BoardMessage<TeleportData>) => {",
    "  if (message.type === \"teleport\") {",
    "    const destination = message.data.destination;",
    "    // Validate the destination, then teleport message.player.",
    "  }",
    "});",
  ].join("\n"),
  py: [
    "from graaly import PlayerJoinEvent, boards, event",
    "",
    "@event(PlayerJoinEvent)",
    "def joined(event):",
    "    boards.state(",
    "        \"control-panel\", event.player,",
    "        online=42, notice=\"Choose an action\"",
    "    )",
    "",
    "@boards.on_message(\"control-panel\")",
    "async def board_message(message):",
    "    if message.type == \"teleport\":",
    "        destination = message.data[\"destination\"]",
    "        # Validate it, then teleport message.player.",
  ].join("\n"),
  java: [
    "GraalyBoardApi boards = GraalyBoardApi.get();",
    "",
    "JsonObject state = new JsonObject();",
    "state.addProperty(\"online\", 42);",
    "state.addProperty(\"notice\", \"Choose an action\");",
    "boards.publishWebsiteState(\"control-panel\", player, state.toString());",
    "",
    "AutoCloseable listener = boards.onWebsiteMessage(\"control-panel\", json -> {",
    "    JsonObject message = JsonParser.parseString(json).getAsJsonObject();",
    "    if (message.get(\"type\").getAsString().equals(\"teleport\")) {",
    "        // Validate data, then perform the action for player.",
    "    }",
    "});",
  ].join("\n"),
};

const reactSetupCode = [
  "npm install react@19.2.8 @graaly/react graaly @tanstack/react-query@5.102.1",
  "npm install --save-dev typescript esbuild @types/react",
  "npm run build",
  "",
  "cd backend",
  "python -m venv .venv",
  "source .venv/bin/activate",
  "pip install -e '.[test]'",
  "GRAALY_DATABASE_URL=sqlite+aiosqlite:///./graaly-ui.db alembic upgrade head",
  "GRAALY_API_KEY=service-secret GRAALY_JWT_SECRET=32-byte-minimum-secret uvicorn app.main:app --host 127.0.0.1 --port 8000",
].join("\n");

const reactUiCode = [
  "import React from \"react\";",
  "import { QueryClient, QueryClientProvider } from \"@tanstack/react-query\";",
  "import { createRoot } from \"@graaly/react\";",
  "import { events, PlayerJoinEvent, PlayerQuitEvent } from \"graaly\";",
  "import { PlayerInterface } from \"./components/player-interface\";",
  "import { ShopProvider } from \"./state/shop-state\";",
  "",
  "const roots = new Map();",
  "",
  "function renderPlayer(player, shopRequest = 0) {",
  "  const id = String(player.uniqueId);",
  "  const state = roots.get(id) ?? { root: createRoot(player), query: new QueryClient() };",
  "  roots.set(id, state);",
  "  state.root.render(",
  "    <QueryClientProvider client={state.query}>",
  "    <ShopProvider>",
  "      <PlayerInterface player={player} shopRequest={shopRequest} />",
  "    </ShopProvider>",
  "    </QueryClientProvider>",
  "  );",
  "}",
  "",
  "events.on(PlayerJoinEvent, ({ player }) => renderPlayer(player));",
  "events.on(PlayerQuitEvent, ({ player }) => {",
  "  const id = String(player.uniqueId);",
  "  roots.get(id)?.root.unmount();",
  "  roots.get(id)?.query.clear();",
  "  roots.delete(id);",
  "});",
  "",
  "// main.tsx adapts the game lifecycle only.",
  "// Hooks, components, API client, and reducer live in focused modules.",
].join("\n");

const fastApiCode = [
  "from contextlib import asynccontextmanager",
  "from fastapi import FastAPI",
  "from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine",
  "from .settings import Settings",
  "from .routers import auth, permissions, players, shop",
  "",
  "def create_app() -> FastAPI:",
  "    settings = Settings()",
  "    engine = create_async_engine(settings.database_url)",
  "    sessions = async_sessionmaker(engine, expire_on_commit=False)",
  "",
  "    @asynccontextmanager",
  "    async def lifespan(_: FastAPI):",
  "        # Production schema is applied by: alembic upgrade head",
  "        await seed_authorization(sessions)",
  "        yield",
  "        await engine.dispose()",
  "",
  "    app = FastAPI(lifespan=lifespan)",
  "    app.state.session_factory = sessions",
  "    app.state.settings = settings",
  "    app.include_router(auth.router)",
  "    app.include_router(permissions.router)",
  "    app.include_router(players.router)",
  "    app.include_router(shop.router)",
  "    return app",
  "",
  "app = create_app()",
  "",
  "# main.py composes infrastructure. Router modules map HTTP,",
  "# while service functions own transactions and business rules.",
].join("\n");

const pythonUiCode = [
  "from graaly import PlayerJoinEvent, event, http, ui",
  "",
  "@event(PlayerJoinEvent)",
  "def render_hud(event):",
  "    player = event.player",
  "",
  "    async def buy_diamond(action):",
  "        profile = await load_profile(player)",
  "        player.send_message(f\"Coins: {profile['coins']}\")",
  "",
  "    view = ui.view(",
  "        messages=[ui.message(",
  "            f\"&aWelcome {player.name}\", id=f\"welcome-{player.unique_id}\"",
  "        )],",
  "        scoreboard=ui.scoreboard(",
  "            \"&aGraaly\", ui.line(\"name\", player.name)",
  "        ),",
  "        inventory=ui.inventory(",
  "            \"&2Shop\",",
  "            ui.item(13, \"DIAMOND\", name=\"&bBuy\", on_click=buy_diamond),",
  "            rows=3,",
  "        ),",
  "        tab=ui.tab(header=\"&aGraaly\", footer=\"Python plugin\"),",
  "    )",
  "    ui.render(player, view)",
  "",
  "# Python can also await Graaly's HTTP client directly:",
  "async def load_profile(player):",
  "    session = await http.post(",
  "        \"http://127.0.0.1:8000/v1/auth/session\",",
  "        {\"player_id\": str(player.unique_id), \"player_name\": player.name},",
  "        headers={\"x-graaly-key\": \"service-secret\"},",
  "    )",
  "    token = session.json()[\"access_token\"]",
  "    response = await http.get(",
  "        f\"http://127.0.0.1:8000/v1/players/{player.unique_id}/ui\",",
  "        headers={\"authorization\": f\"Bearer {token}\"},",
  "    )",
  "    return response.json()",
].join("\n");

const studioProjectFiles = [
  { group: "OVERVIEW", files: ["architecture.md", "terminal"] },
  { group: "GRAALY PLUGIN", files: [
    "src/main.tsx",
    "src/domain.ts",
    "src/api/graaly-api.ts",
    "src/hooks/use-player-profile.ts",
    "src/components/player-interface.tsx",
    "src/state/shop-state.tsx",
  ] },
  { group: "FASTAPI", files: [
    "backend/app/schemas.py",
    "backend/app/dependencies.py",
    "backend/app/routers/shop.py",
    "backend/app/services.py",
    "backend/tests/test_api.py",
  ] },
] as const;

const studioLessons: readonly StudioLesson[] = [
  {
    id: "renderer",
    number: "01",
    phase: "Understand",
    title: "React stays React; only the render target changes",
    file: "src/main.tsx",
    language: "ts",
    code: [
      "import React from \"react\";",
      "import { createRoot, Line, Scoreboard } from \"@graaly/react\";",
      "",
      "function PlayerHud({ profile }) {",
      "  return <Scoreboard title=\"&aGraaly\">",
      "    <Line id=\"rank\">Rank: {profile.rank}</Line>",
      "    <Line id=\"coins\">Coins: {profile.coins}</Line>",
      "  </Scoreboard>;",
      "}",
      "",
      "const root = createRoot(player);",
      "root.render(<PlayerHud profile={profile} />);",
    ].join("\n"),
    focus: [11, 12],
    summary: "Your component still returns JSX and React still reconciles state. Graaly implements a renderer that turns that tree into native game UI.",
    why: "The genuine React programming model transfers to web work: components, props, state, Hooks, Context, composition, and one-way data flow all keep their meaning.",
    webDifference: "A website calls react-dom createRoot on an HTMLElement and produces DOM nodes. Graaly calls createRoot(player) and produces a scoreboard, inventory, boss bar, tab list, or message for that player.",
    decision: "A custom renderer was chosen instead of pretending game UI is HTML. There is no layout engine or DOM inside the game process, so fake div and button elements would teach the wrong mental model.",
    remember: "React decides what UI should exist; the renderer decides how that UI becomes real.",
  },
  {
    id: "boundaries",
    number: "02",
    phase: "Understand",
    title: "Two processes have two different jobs",
    file: "architecture.md",
    language: "shell",
    code: [
      "GAME PROCESS · Java 17+ + Graaly",
      "  live players, events, worlds, entities",
      "  React renderer and final game actions",
      "            │",
      "            │ async HTTP + typed JSON",
      "            ▼",
      "SERVICE PROCESS · CPython + FastAPI",
      "  Pydantic validation and business rules",
      "  SQLAlchemy transactions and durable data",
    ].join("\n"),
    focus: [1, 9],
    summary: "Graaly owns live game state. FastAPI owns durable application data. A typed HTTP boundary connects them without sharing Java objects or threads.",
    why: "A player object has a connection, world, inventory, and thread constraints; it cannot be serialized into Python safely. Profiles, orders, and statistics are ordinary data and cross the boundary well.",
    webDifference: "In a web app the browser is usually the API client. Here the trusted server plugin is the client, so there is no CORS UI problem and the API can stay on 127.0.0.1 with a server-side secret.",
    decision: "FastAPI is separate only when data must be shared, queried by a website, or integrated externally. A single-server plugin can keep its services and database in Graaly and remove HTTP entirely.",
    remember: "Send data across the boundary, never live Player, World, Inventory, or Entity objects.",
  },
  {
    id: "setup",
    number: "03",
    phase: "Build",
    title: "Set up each runtime with its own normal tooling",
    file: "terminal",
    language: "shell",
    code: [
      "# React plugin",
      "npm install react @graaly/react graaly",
      "npm install --save-dev typescript esbuild @types/react",
      "npm run build",
      "",
      "# Python service",
      "cd backend",
      "python -m venv .venv",
      "source .venv/bin/activate",
      "pip install -e '.[test]'",
      "GRAALY_API_KEY='local-secret' uvicorn app.main:app --port 8000",
    ].join("\n"),
    focus: [1, 11],
    summary: "TypeScript is bundled into the plugin entry file. FastAPI runs in a real CPython virtual environment as a separate service.",
    why: "Keeping standard npm and Python packaging means editors, type checking, linters, tests, and ordinary framework documentation continue to work.",
    webDifference: "React is not bundled for a browser and no HTML entry point exists. The ESM bundle is loaded by Graaly. FastAPI itself runs exactly as it would behind a web frontend.",
    decision: "esbuild is used for a small deterministic plugin bundle; Uvicorn runs the ASGI service. Neither tool is hidden behind a custom Graaly build language.",
    remember: "Build the plugin, start the Python service, then start the game server; they are independent processes.",
  },
  {
    id: "typescript-contract",
    number: "04",
    phase: "Build",
    title: "TypeScript describes what React is allowed to receive",
    file: "src/domain.ts",
    language: "ts",
    code: [
      "export type Profile = {",
      "  id: string;",
      "  name: string;",
      "  rank: string;",
      "  coins: number;",
      "  purchases: number;",
      "};",
      "",
      "export type PurchaseCommand = {",
      "  playerId: string;",
      "  playerName: string;",
      "  item: \"diamond\" | \"gold\" | \"speed\";",
      "  idempotencyKey: string; // one logical click, reused by every retry",
      "};",
    ].join("\n"),
    focus: [1, 13],
    summary: "Domain types give every component and API method one shared compile-time vocabulary.",
    why: "If a field is renamed or a new shop item is introduced, TypeScript shows every affected call site before the plugin starts.",
    webDifference: "This is identical to a typed React web client. TypeScript types disappear after compilation, so they improve developer correctness but cannot validate an HTTP response at runtime.",
    decision: "Domain types live outside components so rendering, HTTP, and tests depend on the same contract instead of redefining anonymous objects.",
    remember: "TypeScript protects your source code; it does not make network data trustworthy.",
  },
  {
    id: "pydantic-contract",
    number: "05",
    phase: "Build",
    title: "Pydantic validates the contract at runtime",
    file: "backend/app/schemas.py",
    language: "py",
    code: [
      "from typing import Literal",
      "from pydantic import BaseModel, Field",
      "",
      "class SessionRequest(BaseModel):",
      "    player_id: str = Field(pattern=r\"^[A-Za-z0-9][A-Za-z0-9:_-]{0,35}$\")",
      "    player_name: str = Field(pattern=r\"^[A-Za-z0-9_]{1,16}$\")",
      "",
      "class PurchaseRequest(BaseModel):",
      "    item: Literal[\"diamond\", \"gold\", \"speed\"]",
      "",
      "class ProfileResponse(BaseModel):",
      "    id: str",
      "    name: str",
      "    rank: str",
      "    coins: int = Field(ge=0)",
      "    purchases: int = Field(ge=0)",
    ].join("\n"),
    focus: [4, 14],
    summary: "FastAPI asks Pydantic to parse and validate every incoming command and to enforce the shape of every response.",
    why: "HTTP JSON exists at runtime, where TypeScript no longer exists. Pydantic rejects missing fields, invalid item names, and impossible values before business logic runs.",
    webDifference: "There is no difference from a web backend: browser clients, game plugins, mobile apps, and tests all receive the same validation contract and generated OpenAPI schema.",
    decision: "Explicit models were chosen instead of dict because dict hides the contract, weakens editor support, and lets malformed data travel deeper into the application.",
    remember: "TypeScript checks the producer while Pydantic checks the actual bytes that arrived.",
  },
  {
    id: "dependencies",
    number: "06",
    phase: "Build",
    title: "Dependencies own authentication and request resources",
    file: "backend/app/dependencies.py",
    language: "py",
    code: [
      "from collections.abc import AsyncIterator",
      "from typing import Annotated",
      "from fastapi import Depends, Header, Request",
      "from sqlalchemy.ext.asyncio import AsyncSession",
      "",
      "async def get_session(request: Request) -> AsyncIterator[AsyncSession]:",
      "    factory = request.app.state.session_factory",
      "    async with factory() as session:",
      "        yield session",
      "",
      "async def require_api_key(",
      "    request: Request, x_graaly_key: Annotated[str, Header()] = \"\"",
      ") -> None:",
      "    verify_secret(x_graaly_key, request.app.state.api_key)",
      "",
      "SessionDep = Annotated[AsyncSession, Depends(get_session)]",
    ].join("\n"),
    focus: [6, 16],
    summary: "FastAPI creates one AsyncSession per request, closes it reliably, and authenticates before the route executes.",
    why: "AsyncSession is mutable transaction state and must not be shared across concurrent requests. A yield dependency gives resource ownership a visible beginning and end.",
    webDifference: "This is standard FastAPI dependency injection. The plugin sends a server-held secret rather than exposing a browser token, because no human browser is making this internal request.",
    decision: "Dependencies were chosen over module globals so tests can replace authentication and infrastructure without patching business code.",
    remember: "One request gets one session; dependencies acquire resources and always release them.",
  },
  {
    id: "router",
    number: "07",
    phase: "Build",
    title: "A thin router translates HTTP into an application call",
    file: "backend/app/routers/shop.py",
    language: "py",
    code: [
      "router = APIRouter(prefix=\"/v1/shop\", tags=[\"shop\"])",
      "CanPurchase = Annotated[ActorContext, Depends(require_permission(\"shop.purchase\"))]",
      "IdempotencyKey = Annotated[str, Header(",
      "    alias=\"Idempotency-Key\", min_length=8, max_length=128,",
      "    pattern=r\"^[A-Za-z0-9._:-]+$\",",
      ")]",
      "",
      "@router.post(\"/purchase\", response_model=PurchaseResponse)",
      "async def purchase(",
      "    command: PurchaseRequest,",
      "    actor: CanPurchase,",
      "    session: SessionDep,",
      "    idempotency_key: IdempotencyKey,",
      ") -> PurchaseResponse:",
      "    try:",
      "        return await services.purchase_item(session, actor, command, idempotency_key)",
      "    except services.InsufficientCoins as error:",
      "        raise HTTPException(402, \"Not enough coins\") from error",
    ].join("\n"),
    focus: [7, 15],
    summary: "The router declares URL, authentication, request model, response model, and HTTP error mapping; the service owns the actual purchase rule.",
    why: "Keeping routes thin lets the same use case be called from another route, an admin job, or a test without fabricating HTTP objects.",
    webDifference: "This is the same controller boundary used for web APIs. The caller happens to be Graaly, but OpenAPI, validation, status codes, and dependency execution are unchanged.",
    decision: "APIRouter modules scale better than one giant main.py. A tiny service can begin with one file and split only when routes form real feature groups.",
    remember: "Routes speak HTTP; services speak the application domain.",
  },
  {
    id: "api-client",
    number: "08",
    phase: "Connect",
    title: "One API client owns every transport detail",
    file: "src/api/graaly-api.ts",
    language: "ts",
    code: [
      "export const graalyApi = {",
      "  async getProfile(id: string, name: string): Promise<Profile> {",
      "    const response = await http.get(",
      '      `${backendUrl}/v1/players/${encodeURIComponent(id)}/ui?name=${encodeURIComponent(name)}`,',
      "      { headers: authHeaders, timeout: 3000 },",
      "    );",
      "    return readJson<Profile>(response);",
      "  },",
      "",
      "  async purchase(command: PurchaseCommand): Promise<PurchaseResult> {",
      "    const options = await bearer(command);",
      "    options.headers[\"idempotency-key\"] = command.idempotencyKey;",
      "    const response = await http.post(",
      "      `${backendUrl}/v1/shop/purchase`, { item: command.item }, options,",
      "    );",
      "    return readJson<PurchaseResult>(response);",
      "  },",
      "};",
    ].join("\n"),
    focus: [2, 21],
    summary: "Components call getProfile and purchase. They never assemble URLs, authentication headers, snake_case payloads, timeouts, or error parsing.",
    why: "A narrow client makes the UI readable and gives tests one replaceable boundary. Authentication or endpoint changes happen once.",
    webDifference: "The Promise-based call feels like fetch, but Graaly provides the HTTP implementation because the plugin is not a browser and must keep blocking network work away from the game tick.",
    decision: "A small hand-written client is clearer than generating an SDK for three endpoints. OpenAPI generation becomes useful when the service grows across many consumers.",
    remember: "React components express user intent; the API client translates that intent into HTTP.",
  },
  {
    id: "custom-hook",
    number: "09",
    phase: "Connect",
    title: "A custom Hook turns HTTP into a small state machine",
    file: "src/hooks/use-player-profile.ts",
    language: "ts",
    code: [
      "export function usePlayerProfile(id: string, name: string) {",
      "  const [state, setState] = useState<ProfileState>({",
      "    status: \"loading\", profile: null, error: null,",
      "  });",
      "",
      "  useEffect(() => {",
      "    let ignore = false;",
      "    graalyApi.getProfile(id, name).then(",
      "      profile => !ignore && setState({ status: \"ready\", profile, error: null }),",
      "      error => !ignore && setState({ status: \"error\", profile: null, error }),",
      "    );",
      "    return () => { ignore = true; };",
      "  }, [id, name]);",
      "",
      "  return state;",
      "}",
    ].join("\n"),
    focus: [6, 13],
    summary: "The component receives loading, ready, or error state. The Hook owns synchronization with the external service and ignores stale results after identity changes or unmounting.",
    why: "Effects are appropriate here because HTTP is an external system. The reusable Hook keeps synchronization and cleanup out of visual components.",
    webDifference: "This is the same Effect lifecycle used on the web. The difference is the HTTP adapter and the player identity that scopes the data.",
    decision: "The component is not async and the request does not run during render. For larger caches, a standard server-state library can replace this Hook without changing the components.",
    remember: "Render must stay pure; synchronize with external systems in an Effect and always handle stale work.",
  },
  {
    id: "native-ui",
    number: "10",
    phase: "Connect",
    title: "One profile projects into every native game surface",
    file: "src/components/player-interface.tsx",
    language: "ts",
    code: [
      "const progress = Math.min(1, profile.coins / 200);",
      "",
      "return <>",
      "  <Scoreboard title=\"&aGraaly\">",
      "    <Line id=\"rank\">Rank: {profile.rank}</Line>",
      "    <Line id=\"coins\">Coins: {profile.coins}</Line>",
      "  </Scoreboard>",
      "  <BossBar progress={progress}>{profile.coins} coins</BossBar>",
      "  <Tab footer={`Rank: ${profile.rank}`} />",
      "  <Inventory title=\"&2Shop\" rows={3}>",
      "    <Item slot={13} material=\"DIAMOND\" onClick={buyDiamond} />",
      "  </Inventory>",
      "</>;",
    ].join("\n"),
    focus: [3, 13],
    summary: "Scoreboard, boss bar, tab, and inventory derive from one Profile value. React updates only the native surfaces whose props changed.",
    why: "A single source of truth prevents the balance shown in one surface from drifting away from another. progress is derived during render rather than copied into state.",
    webDifference: "Scoreboard and Inventory replace div and button. There is no CSS layout, DOM query, or SyntheticEvent; Item supplies a game UiAction containing the player, slot, and click type.",
    decision: "React is valuable when several surfaces share changing state. One static message or tiny menu is simpler with Graaly's direct UI helpers.",
    remember: "Store domain state once; derive every visual projection from it.",
  },
  {
    id: "command",
    number: "11",
    phase: "Scale",
    title: "Writes happen in event handlers, never as render side effects",
    file: "src/components/player-interface.tsx",
    language: "ts",
    code: [
      "async function buyDiamond(action: UiAction) {",
      "  if (pending) return;",
      "  setPending(true);",
      "  setError(null);",
      "  try {",
      "    const result = await graalyApi.purchase({",
      "      playerId: action.player.id,",
      "      playerName: action.player.name,",
      "      item: \"diamond\",",
      "      idempotencyKey: createPurchaseKey(action.player.id),",
      "    });",
      "    setProfile(result.profile);",
      "    giveReward(action.player, result.reward);",
      "  } catch (failure) {",
      "    setError(toMessage(failure));",
      "  } finally {",
      "    setPending(false);",
      "  }",
      "}",
    ].join("\n"),
    focus: [5, 16],
    summary: "The click creates one explicit command, disables duplicate work, waits for the authoritative response, then updates state and grants the reward.",
    why: "Mutations belong to the interaction that caused them. Running a purchase in an Effect could repeat after dependency changes, remounts, or development checks.",
    webDifference: "The control flow matches a web checkout button. The crucial game difference is that the item is granted only after the continuation is back in Graaly's safe execution context.",
    decision: "A local pending flag is enough for one action. A reducer becomes worthwhile only when many items, notices, and surfaces coordinate the same workflow.",
    remember: "Optimistic visuals may be early; irreversible game rewards must wait for committed backend authority.",
  },
  {
    id: "transaction",
    number: "12",
    phase: "Scale",
    title: "The backend owns prices and commits atomically",
    file: "backend/app/services.py",
    language: "py",
    code: [
      "async def purchase_item(session, actor, command, idempotency_key):",
      "    price, reward = CATALOG[command.item]",
      "",
      "    try:",
      "        async with session.begin():",
      "            if saved := await find_purchase(session, actor.player_id, idempotency_key):",
      "                return replay(saved, command)",
      "            profile = await conditional_debit(session, actor.player_id, price)",
      "            response = build_response(profile, reward)",
      "            session.add(Purchase(",
      "                player_id=profile.id, item=command.item, price=price,",
      "                idempotency_key=idempotency_key,",
      "                response_json=response.model_dump_json(),",
      "            ))",
      "            await session.flush()  # unique key is checked before commit",
      "        return response",
      "    except IntegrityError:",
      "        await session.rollback()  # also rolls back a racing debit",
      "        return replay(await find_purchase(session, actor.player_id, idempotency_key), command)",
    ].join("\n"),
    focus: [2, 20],
    summary: "The server selects the price, atomically debits, stores the result beside a unique player/key pair, and replays that exact result after a retry.",
    why: "The client can be outdated, malicious, disconnected after commit, or retried concurrently. One transaction guarantees that debit, purchase, and replay record commit together or all roll back.",
    webDifference: "This backend rule is exactly the same for a web shop. FastAPI does not grant the in-game item because it cannot safely own a live player object.",
    decision: "A conditional UPDATE works under concurrency on SQLite and PostgreSQL; a SELECT followed by mutation can race where row locks are unavailable. SQLAlchemy keeps the unit-of-work boundary explicit.",
    remember: "One user intent gets one stable idempotency key; retries reuse it and receive one durable result.",
  },
  {
    id: "shared-state",
    number: "13",
    phase: "Scale",
    title: "Reducer, Context, and optimism are earned complexity",
    file: "src/state/shop-state.tsx",
    language: "ts",
    code: [
      "function shopReducer(state: State, action: Action): State {",
      "  switch (action.type) {",
      "    case \"purchase/started\":",
      "      return { pending: action.item, notice: null };",
      "    case \"purchase/succeeded\":",
      "      return { pending: null, notice: action.message };",
      "    case \"purchase/failed\":",
      "      return { pending: null, notice: action.message };",
      "  }",
      "}",
      "",
      "const [optimisticCoins, spend] = useOptimistic(",
      "  profile.coins, (coins, price: number) => coins - price,",
      ");",
      "startTransition(async () => {",
      "  spend(40); // visual projection only",
      "  const result = await graalyApi.purchase(command);",
      "  setProfile(result.profile); // authoritative value",
      "  giveReward(player, result.reward); // only after commit",
      "});",
    ].join("\n"),
    focus: [1, 20],
    summary: "A reducer names multi-step transitions shared by menu, message, and HUD. useOptimistic can project a balance while the real command is pending.",
    why: "Named actions make complex transitions deterministic and easy to unit-test. Optimism improves perceived latency without changing backend authority.",
    webDifference: "Reducer, Context, transitions, and optimistic state behave like normal React. Only the host components receiving the resulting props are different.",
    decision: "Start with local useState. Add a reducer when transitions become related, Context when distant children share them, and optimism only when rollback is safe and understandable.",
    remember: "Do not begin with global state; promote state only when real coordination demands it.",
  },
  {
    id: "lifecycle",
    number: "14",
    phase: "Ship",
    title: "One React root belongs to one player lifecycle",
    file: "src/main.tsx",
    language: "ts",
    code: [
      "const roots = new Map<string, GraalyRoot>();",
      "",
      "events.on(PlayerJoinEvent, ({ player }) => {",
      "  const id = String(player.uniqueId);",
      "  const root = createRoot(player);",
      "  roots.set(id, root);",
      "  root.render(<PlayerInterface player={player} />);",
      "});",
      "",
      "events.on(PlayerQuitEvent, ({ player }) => {",
      "  const id = String(player.uniqueId);",
      "  roots.get(id)?.unmount();",
      "  roots.delete(id);",
      "});",
      "",
      "export function onDisable() {",
      "  for (const root of roots.values()) root.unmount();",
      "  roots.clear();",
      "}",
    ].join("\n"),
    focus: [3, 18],
    summary: "Joining mounts an isolated player tree. Quitting or disabling unmounts it so Effects clean up and Graaly releases handlers and native UI.",
    why: "Lifecycle ownership prevents leaked player references, stale click handlers, background work, and UI left behind after reloads.",
    webDifference: "A web app often has one root for a page. A multiplayer server needs one isolated root per viewer because each player can see different state.",
    decision: "The small main.tsx adapter owns roots and events; Graaly also generation-fences each player surface so a delayed old root cannot publish, receive clicks, dismiss UI, or reclaim ownership after a newer root commits.",
    remember: "Every mount needs an owner and every owner needs an explicit unmount path.",
  },
  {
    id: "test-production",
    number: "15",
    phase: "Ship",
    title: "Test the seams while keeping the architecture proportional",
    file: "backend/tests/test_api.py",
    language: "py",
    code: [
      "import asyncio, httpx",
      "",
      "async def allow_test_request() -> None:",
      "    return None",
      "",
      "def test_purchase_contract(tmp_path):",
      "    async def scenario():",
      "        database_url = f\"sqlite+aiosqlite:///{tmp_path / 'test.db'}\"",
      "        app = create_app(database_url, \"test-secret\")",
      "        app.dependency_overrides[require_api_key] = allow_test_request",
      "        transport = httpx.ASGITransport(app=app)",
      "",
      "        async with app.router.lifespan_context(app):",
      "            async with httpx.AsyncClient(",
      "                transport=transport, base_url=\"http://test\"",
      "            ) as client:",
      "                headers = {**AUTH, \"Idempotency-Key\": \"purchase-0001\"}",
      "                response = await client.post(",
      "                    \"/v1/shop/purchase\",",
      "                    json={\"item\": \"diamond\"}, headers=headers,",
      "                )",
      "                replay = await client.post(",
      "                    \"/v1/shop/purchase\", json={\"item\": \"diamond\"}, headers=headers,",
      "                )",
      "",
      "        assert response.status_code == 200",
      "        assert replay.json() == response.json()",
      "        assert response.json()[\"profile\"][\"coins\"] == 110",
      "        app.dependency_overrides.clear()",
      "",
      "    asyncio.run(scenario())",
    ].join("\n"),
    focus: [6, 25],
    summary: "The app factory creates an isolated service, dependency overrides replace authentication, and the test verifies the public HTTP contract against a temporary database.",
    why: "Framework boundaries should make tests cheaper, not make the project look sophisticated. Pure reducers, injected API clients, and FastAPI dependencies are deliberate test seams.",
    webDifference: "The backend test is identical to a web API test. Add plugin integration tests for the game-specific half: click action, safe continuation, reward, unmount, and offline fallback.",
    decision: "Small plugin: Graaly modules only. UI-heavy plugin: add React. Shared data or web integrations: add FastAPI. Valuable cross-process purchases also need idempotency and a fulfillment ledger before production.",
    remember: "Use the smallest architecture that preserves correctness; scaling patterns are options, not ceremony.",
  },
];

const reactFastApiPatterns: readonly ReactFastApiPattern[] = [
  {
    id: "typed-boundary",
    step: "01",
    title: "Make the HTTP boundary typed",
    level: "Foundation",
    reactPattern: "API client module",
    fastApiPattern: "Pydantic request and response models",
    reason: "Transport details stay in one module, while both sides agree on the data crossing the process boundary.",
    avoid: "Do not scatter URLs, headers, untyped objects, or response parsing through UI components.",
    flow: ["Component calls a domain method", "Client serializes the command", "FastAPI validates it", "A typed result returns"],
    reactFile: "src/api/graaly-api.ts",
    fastApiFile: "backend/app/schemas.py",
    reactCode: [
      "import { config, http, type HttpResponse } from \"graaly\";",
      "",
      "const API_URL = \"http://127.0.0.1:8000\";",
      "const apiKey = String(config.get(\"backend.api-key\"));",
      "const options = { headers: { \"x-graaly-key\": apiKey } };",
      "",
      "export type Profile = {",
      "  id: string; name: string; rank: string; coins: number;",
      "};",
      "export type PurchaseCommand = {",
      "  playerId: string; playerName: string; item: \"diamond\" | \"gold\";",
      "};",
      "export type PurchaseResult = { profile: Profile; message: string };",
      "",
      "class ApiError extends Error {",
      "  constructor(readonly status: number, message: string) { super(message); }",
      "}",
      "",
      "async function read<T>(response: HttpResponse): Promise<T> {",
      "  const body = await response.json<T | { detail: string }>();",
      "  if (!response.ok) {",
      "    const message = typeof body === \"object\" && body !== null && \"detail\" in body",
      "      ? String(body.detail) : `HTTP ${response.status}`;",
      "    throw new ApiError(response.status, message);",
      "  }",
      "  return body as T;",
      "}",
      "",
      "export const api = {",
      "  player: (id: string, name: string) =>",
      "    http.get(`${API_URL}/v1/players/${encodeURIComponent(id)}/ui?name=${encodeURIComponent(name)}`, options)",
      "      .then(read<Profile>),",
      "  purchase: (command: PurchaseCommand) =>",
      "    http.post(`${API_URL}/v1/shop/purchase`, { item: command.item }, {",
      "      ...options, headers: { ...options.headers,",
      "        \"idempotency-key\": command.idempotencyKey },",
      "    }).then(read<PurchaseResult>),",
      "};",
    ].join("\n"),
    fastApiCode: [
      "from typing import Literal",
      "from pydantic import BaseModel, Field",
      "",
      "class ProfileRead(BaseModel):",
      "    id: str",
      "    name: str",
      "    rank: str",
      "    coins: int = Field(ge=0)",
      "",
      "class SessionIdentity(BaseModel):",
      "    player_id: str = Field(pattern=r\"^[A-Za-z0-9][A-Za-z0-9:_-]{0,35}$\")",
      "    player_name: str = Field(pattern=r\"^[A-Za-z0-9_]{1,16}$\")",
      "",
      "class PurchaseCommand(BaseModel):",
      "    item: Literal[\"diamond\", \"gold\"]",
      "",
      "class PurchaseResult(BaseModel):",
      "    profile: ProfileRead",
      "    message: str",
      "",
      "# Invalid input never reaches your business function.",
      "# response_model also documents and filters the output contract.",
    ].join("\n"),
  },
  {
    id: "custom-hook",
    step: "02",
    title: "Load server state with a custom Hook",
    level: "Foundation",
    reactPattern: "useEffect + custom Hook + cleanup",
    fastApiPattern: "Annotated dependencies + session per request",
    reason: "The component consumes a small state machine; the effect only synchronizes React with the external HTTP service.",
    avoid: "Do not make the component async, fetch during render, or let an old response overwrite a newer player.",
    flow: ["Player identity changes", "Effect starts one request", "Cleanup marks stale work", "Hook publishes status and data"],
    reactFile: "src/hooks/use-player-profile.ts",
    fastApiFile: "backend/app/dependencies.py",
    reactCode: [
      "type LoadState<T> =",
      "  | { status: \"loading\"; data: T | null; error: null }",
      "  | { status: \"ready\"; data: T; error: null }",
      "  | { status: \"error\"; data: T | null; error: Error };",
      "",
      "export function usePlayerProfile(id: string, name: string) {",
      "  const [reloadKey, setReloadKey] = useState(0);",
      "  const [state, setState] = useState<LoadState<Profile>>({",
      "    status: \"loading\", data: null, error: null,",
      "  });",
      "",
      "  useEffect(() => {",
      "    let ignore = false;",
      "    setState(current => ({ status: \"loading\", data: current.data, error: null }));",
      "    api.player(id, name).then(",
      "      data => { if (!ignore) setState({ status: \"ready\", data, error: null }); },",
      "      error => { if (!ignore) setState({ status: \"error\", data: null, error }); },",
      "    );",
      "    return () => { ignore = true; };",
      "  }, [id, name, reloadKey]);",
      "",
      "  return { ...state, reload: () => setReloadKey(key => key + 1) };",
      "}",
    ].join("\n"),
    fastApiCode: [
      "from collections.abc import AsyncIterator",
      "from typing import Annotated",
      "from fastapi import Depends, Request",
      "from sqlalchemy.ext.asyncio import AsyncSession",
      "",
      "async def get_session(request: Request) -> AsyncIterator[AsyncSession]:",
      "    factory = request.app.state.session_factory",
      "    async with factory() as session:",
      "        yield session",
      "",
      "SessionDep = Annotated[AsyncSession, Depends(get_session)]",
      "",
      "@router.get(\"/{player_id}/ui\", response_model=ProfileRead)",
      "async def get_player(player_id: str, name: str, session: SessionDep):",
      "    return await profiles.get_or_create(session, player_id, name)",
      "",
      "# A fresh AsyncSession belongs to this request only.",
      "# The dependency closes it even when validation or business logic fails.",
    ].join("\n"),
  },
  {
    id: "single-source",
    step: "03",
    title: "Keep one source of truth",
    level: "Foundation",
    reactPattern: "Lift state + derive during render",
    fastApiPattern: "Thin route + application service",
    reason: "One authoritative profile drives every surface, so scoreboard, tab, boss bar, and menu cannot drift apart.",
    avoid: "Do not copy coins into several useState calls or use an Effect to calculate values you can derive while rendering.",
    flow: ["Hook owns Profile", "Pure expressions derive view values", "Props distribute them", "React reconciles changed surfaces"],
    reactFile: "src/components/player-interface.tsx",
    fastApiFile: "backend/app/routers/players.py",
    reactCode: [
      "function PlayerInterface({ profile }: { profile: Profile }) {",
      "  // Derived values are not extra state.",
      "  const progress = Math.min(1, profile.coins / 200);",
      "  const canBuyDiamond = profile.coins >= 40;",
      "",
      "  return <>",
      "    <Scoreboard title=\"Graaly\">",
      "      <Line id=\"rank\">Rank: {profile.rank}</Line>",
      "      <Line id=\"coins\">Coins: {profile.coins}</Line>",
      "    </Scoreboard>",
      "    <BossBar progress={progress}>{profile.coins} coins</BossBar>",
      "    <Tab footer={`Rank: ${profile.rank}`} />",
      "    <Shop profile={profile} canBuyDiamond={canBuyDiamond} />",
      "  </>;",
      "}",
      "",
      "// When profile changes, every projection updates from the same value.",
    ].join("\n"),
    fastApiCode: [
      "# routers/players.py: HTTP concerns only",
      "router = APIRouter(prefix=\"/v1/players\", tags=[\"players\"])",
      "",
      "@router.get(\"/{player_id}/ui\", response_model=ProfileRead)",
      "async def get_player(player_id: str, name: str, session: SessionDep):",
      "    return await profiles.get_or_create(session, player_id, name)",
      "",
      "# services/profiles.py: reusable application logic",
      "async def get_or_create(",
      "    session: AsyncSession, player_id: str, name: str",
      ") -> ProfileRead:",
      "    async with session.begin():",
      "        profile = await session.get(PlayerProfile, player_id)",
      "        if profile is None:",
      "            profile = PlayerProfile(id=player_id, name=name)",
      "            session.add(profile)",
      "        else:",
      "            profile.name = name",
      "    return ProfileRead.model_validate(profile, from_attributes=True)",
    ].join("\n"),
  },
  {
    id: "mutation",
    step: "04",
    title: "Treat writes as explicit commands",
    level: "Application",
    reactPattern: "Event handler + pending/error state",
    fastApiPattern: "Transactional service",
    reason: "A click expresses intent once; the backend owns price checks and commits all related writes atomically.",
    avoid: "Do not trigger a purchase from an Effect, trust a client-supplied price, or grant the reward before success.",
    flow: ["Click creates a command", "UI disables duplicate work", "Service validates and commits", "Response replaces local state"],
    reactFile: "src/components/shop-item.tsx",
    fastApiFile: "backend/app/services/shop.py",
    reactCode: [
      "function DiamondItem({ profile, onCommitted }: Props) {",
      "  const [status, setStatus] = useState<\"idle\" | \"pending\">(\"idle\");",
      "  const [error, setError] = useState<string | null>(null);",
      "",
      "  async function buy(action: UiAction) {",
      "    if (status === \"pending\") return;",
      "    setStatus(\"pending\");",
      "    setError(null);",
      "    try {",
      "      const result = await api.purchase({",
      "        playerId: action.player.id,",
      "        playerName: action.player.name,",
      "        item: \"diamond\",",
      "        idempotencyKey: createPurchaseKey(action.player.id),",
      "      });",
      "      onCommitted(result.profile);",
      "      giveReward(action.player, result.reward); // only after 2xx",
      "    } catch (failure) {",
      "      setError(failure instanceof Error ? failure.message : String(failure));",
      "    } finally {",
      "      setStatus(\"idle\");",
      "    }",
      "  }",
      "",
      "  return <Item slot={13} material=\"DIAMOND\"",
      "    lore={[error ?? (status === \"pending\" ? \"Loading…\" : \"40 coins\")]}",
      "    onClick={buy} />;",
      "}",
    ].join("\n"),
    fastApiCode: [
      "PRICES = {\"diamond\": 40, \"gold\": 25}",
      "",
      "async def purchase(",
      "    session: AsyncSession, actor: Actor, command: PurchaseCommand, key: str",
      ") -> PurchaseResult:",
      "    price = PRICES[command.item]  # never read a price from the client",
      "",
      "    async with session.begin():",
      "        if saved := await find_purchase(session, actor.player_id, key):",
      "            return replay(saved, command)",
      "        result = await session.execute(",
      "            update(PlayerProfile)",
      "            .where(",
      "                PlayerProfile.id == actor.player_id,",
      "                PlayerProfile.coins >= price,",
      "            )",
      "            .values(",
      "                coins=PlayerProfile.coins - price,",
      "                purchases=PlayerProfile.purchases + 1,",
      "            )",
      "            .returning(PlayerProfile)",
      "        )",
      "        profile = result.scalar_one_or_none()",
      "        if profile is None:",
      "            raise InsufficientCoins()",
      "        response = build_result(profile)",
      "        session.add(Purchase(player_id=profile.id, item=command.item, price=price,",
      "            idempotency_key=key, response_json=response.model_dump_json()))",
      "        await session.flush()",
      "",
      "    return response",
      "",
      "# A unique (player_id, key) constraint makes concurrent retries replay-safe.",
    ].join("\n"),
  },
  {
    id: "reducer-context",
    step: "05",
    title: "Scale shared UI with Reducer + Context",
    level: "Application",
    reactPattern: "useReducer + Context + custom consumer Hook",
    fastApiPattern: "APIRouter modules + service layer",
    reason: "When messages, menu items, and HUD share a workflow, actions make every state transition explicit and testable.",
    avoid: "Do not put every value in global Context; keep state local until several distant children truly coordinate.",
    flow: ["UI dispatches a named action", "Reducer computes next state", "Context shares state and dispatch", "Independent surfaces rerender"],
    reactFile: "src/state/shop-state.tsx",
    fastApiFile: "backend/app/main.py",
    reactCode: [
      "type State = { pending: string | null; notice: string | null };",
      "type Action =",
      "  | { type: \"purchase/started\"; item: string }",
      "  | { type: \"purchase/succeeded\"; message: string }",
      "  | { type: \"purchase/failed\"; message: string };",
      "",
      "export function shopReducer(state: State, action: Action): State {",
      "  switch (action.type) {",
      "    case \"purchase/started\": return { pending: action.item, notice: null };",
      "    case \"purchase/succeeded\": return { pending: null, notice: action.message };",
      "    case \"purchase/failed\": return { pending: null, notice: action.message };",
      "  }",
      "}",
      "",
      "const ShopContext = createContext<ContextValue | null>(null);",
      "export function ShopProvider({ children }: PropsWithChildren) {",
      "  const [state, dispatch] = useReducer(shopReducer, { pending: null, notice: null });",
      "  return <ShopContext.Provider value={{ state, dispatch }}>{children}</ShopContext.Provider>;",
      "}",
      "export function useShop() {",
      "  const value = useContext(ShopContext);",
      "  if (!value) throw new Error(\"useShop must be inside ShopProvider\");",
      "  return value;",
      "}",
    ].join("\n"),
    fastApiCode: [
      "# main.py composes modules; it contains no shop logic.",
      "def create_app(settings: Settings) -> FastAPI:",
      "    app = FastAPI(lifespan=lifespan)",
      "    app.include_router(players.router)",
      "    app.include_router(shop.router)",
      "    return app",
      "",
      "# routers/shop.py maps HTTP to the application service.",
      "router = APIRouter(",
      "    prefix=\"/v1/shop\",",
      "    tags=[\"shop\"],",
      "    dependencies=[Depends(require_api_key)],",
      ")",
      "",
      "@router.post(\"/purchase\", response_model=PurchaseResult)",
      "async def purchase(command: PurchaseCommand, session: SessionDep):",
      "    try:",
      "        return await shop_service.purchase(session, command)",
      "    except InsufficientCoins as error:",
      "        raise HTTPException(402, \"Not enough coins\") from error",
    ].join("\n"),
  },
  {
    id: "optimistic-ui",
    step: "06",
    title: "Add optimistic feedback safely",
    level: "Production",
    reactPattern: "useOptimistic + startTransition",
    fastApiPattern: "Server-authoritative command validation",
    reason: "The UI can feel immediate while the committed profile and game reward still come only from the backend response.",
    avoid: "Do not treat optimistic state as truth, mutate the profile object, or grant an item before the command commits.",
    flow: ["Transition projects the likely result", "Command runs in background", "Success supplies authoritative state", "Failure rolls back projection"],
    reactFile: "src/components/optimistic-shop.tsx",
    fastApiFile: "backend/app/routers/shop.py",
    reactCode: [
      "function OptimisticCoins({ profile, setProfile }: Props) {",
      "  const [optimisticCoins, spend] = useOptimistic(",
      "    profile.coins,",
      "    (currentCoins, price: number) => Math.max(0, currentCoins - price),",
      "  );",
      "",
      "  function buy(action: UiAction) {",
      "    startTransition(async () => {",
      "      spend(40); // visual projection only",
      "      try {",
      "        const result = await api.purchase({",
      "          playerId: action.player.id,",
      "          playerName: action.player.name,",
      "          item: \"diamond\",",
      "        });",
      "        setProfile(result.profile);       // authoritative value",
      "        giveReward(action.player, result.reward); // now it is committed",
      "      } catch (error) {",
      "        showError(error); // optimistic value disappears automatically",
      "      }",
      "    });",
      "  }",
      "",
      "  return <Item slot={13} material=\"DIAMOND\"",
      "    lore={[`Balance: ${optimisticCoins}`]} onClick={buy} />;",
      "}",
    ].join("\n"),
    fastApiCode: [
      "class PurchaseCommand(BaseModel):",
      "    player_id: str",
      "    player_name: str",
      "    item: Literal[\"diamond\", \"gold\"]",
      "    # There is deliberately no price or reward field.",
      "",
      "@router.post(\"/purchase\", response_model=PurchaseResult)",
      "async def purchase(command: PurchaseCommand, session: SessionDep):",
      "    result = await shop_service.purchase(session, command)",
      "    return result",
      "",
      "# For retryable production commands, add an idempotency key and",
      "# persist the command result under a UNIQUE constraint.",
      "# Optimistic UI improves latency perception; it never weakens validation.",
    ].join("\n"),
  },
  {
    id: "testing",
    step: "07",
    title: "Test through replaceable boundaries",
    level: "Production",
    reactPattern: "Pure reducer + injected API contract",
    fastApiPattern: "App factory + dependency_overrides",
    reason: "Pure state logic needs no renderer, and FastAPI dependencies let tests replace authentication or infrastructure precisely.",
    avoid: "Do not call a real production database or hide business logic inside framework callbacks that cannot be isolated.",
    flow: ["Inject a controlled dependency", "Exercise public behavior", "Assert state or HTTP contract", "Restore the override"],
    reactFile: "src/state/shop-state.test.ts",
    fastApiFile: "backend/tests/test_api.py",
    reactCode: [
      "import { describe, expect, it } from \"vitest\";",
      "import { initialShopState, shopReducer } from \"./shop-state\";",
      "",
      "describe(\"shopReducer\", () => {",
      "  it(\"clears pending state after a successful command\", () => {",
      "    const pending = shopReducer(initialShopState, {",
      "      type: \"purchase/started\", item: \"diamond\",",
      "    });",
      "    const complete = shopReducer(pending, {",
      "      type: \"purchase/succeeded\", message: \"Purchased\",",
      "    });",
      "",
      "    expect(complete).toEqual({ pending: null, notice: \"Purchased\" });",
      "  });",
      "});",
      "",
      "// Test the API client separately with a fake transport.",
      "// Test components against the small Api contract, not a live service.",
    ].join("\n"),
    fastApiCode: [
      "import httpx",
      "from app.dependencies import require_api_key",
      "from app.main import create_app",
      "",
      "async def allow_test_request() -> None:",
      "    return None",
      "",
      "async def test_profile_contract(test_settings):",
      "    app = create_app(test_settings)",
      "    app.dependency_overrides[require_api_key] = allow_test_request",
      "    transport = httpx.ASGITransport(app=app)",
      "",
      "    async with app.router.lifespan_context(app):",
      "        async with httpx.AsyncClient(",
      "            transport=transport, base_url=\"http://test\"",
      "        ) as client:",
      "            response = await client.get(",
      "                \"/v1/players/p1/ui\", params={\"name\": \"Alex\"}",
      "            )",
      "",
      "    assert response.status_code == 200",
      "    assert response.json()[\"coins\"] == 150",
      "    app.dependency_overrides.clear()",
    ].join("\n"),
  },
];

function packetUsage(path: string) {
  if (path.startsWith("Play.Client.")) return `ClientPacket.${path.slice("Play.Client.".length)}`;
  if (path.startsWith("Play.Server.")) return `ServerPacket.${path.slice("Play.Server.".length)}`;
  return `PacketType.${path}`;
}

function buildCatalogEntries(source: CatalogSource): CatalogEntries {
  return {
  bukkit: source.bukkitCatalog.map(entry => ({
    name: entry.name,
    javaName: entry.javaName,
    usage: entry.name,
    parents: entry.parents,
    members: entry.members,
  })),
  support: source.packetSupportTypeCatalog.map(entry => ({
    name: entry.name,
    javaName: entry.javaName,
    usage: entry.name,
    parents: entry.parents,
    members: entry.members,
  })),
  wrappers: source.packetWrapperCatalog.map(entry => ({
    name: entry.name,
    javaName: entry.javaName,
    usage: entry.name,
    parents: entry.parents,
    members: entry.members,
  })),
  packets: source.packetTypeCatalog.map(path => ({
    name: path.split(".").at(-1) ?? path,
    javaName: path,
    usage: packetUsage(path),
    parents: [],
    members: [],
  })),
  };
}

const catalogLabels: Array<{ id: CatalogKind; label: string; short: string }> = [
  { id: "bukkit", label: "Graaly API", short: "API" },
  { id: "wrappers", label: "Packet wrappers", short: "Wrappers" },
  { id: "support", label: "Packet support types", short: "Support" },
  { id: "packets", label: "Packet constants", short: "Constants" },
];

const memberFilters: Array<{ id: MemberFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "properties", label: "Properties" },
  { id: "methods", label: "Methods" },
  { id: "constructors", label: "Constructors" },
  { id: "constants", label: "Constants" },
];

const defaultCatalogEntry: Record<CatalogKind, string> = {
  bukkit: "Player",
  wrappers: "WrapperPlayServerUpdateHealth",
  support: "Component",
  packets: "CHAT_MESSAGE",
};

const resolvedMemberCache = new Map<string, ResolvedCatalogMember[]>();

function simpleTypeName(value: string) {
  return value.replaceAll("$", ".").split(".").at(-1) ?? value;
}

function findCatalogParent(catalogEntries: CatalogEntries, kind: CatalogKind, parentName: string) {
  const pool = kind === "bukkit"
    ? catalogEntries.bukkit
    : [...catalogEntries.support, ...catalogEntries.wrappers];
  const simple = simpleTypeName(parentName);
  return pool.find(entry =>
    entry.name === parentName
    || entry.name === simple
    || entry.javaName === parentName
    || entry.javaName.endsWith(`.${parentName}`)
    || entry.javaName.endsWith(`$${parentName}`),
  );
}

function resolveCatalogMembers(catalogEntries: CatalogEntries, kind: CatalogKind, entry: CatalogEntry): ResolvedCatalogMember[] {
  const cacheKey = `${kind}:${entry.javaName}`;
  const cached = resolvedMemberCache.get(cacheKey);
  if (cached) return cached;

  function walk(current: CatalogEntry, seen: Set<string>, inherited: boolean): ResolvedCatalogMember[] {
    if (seen.has(current.javaName)) return [];
    seen.add(current.javaName);
    const own = current.members.map(member => ({
      ...member,
      declaredBy: current.name,
      inherited,
    }));
    const parents = current.parents.flatMap(parentName => {
      const parent = findCatalogParent(catalogEntries, kind, parentName);
      return parent ? walk(parent, seen, true) : [];
    });
    return [...own, ...parents];
  }

  const unique = new Map<string, ResolvedCatalogMember>();
  for (const member of walk(entry, new Set<string>(), false)) {
    const key = `${member.kind}\u0000${member.typeScript}\u0000${member.python}`;
    if (!unique.has(key)) unique.set(key, member);
  }
  const resolved = [...unique.values()];
  resolvedMemberCache.set(cacheKey, resolved);
  return resolved;
}

function memberGroup(kind: string): Exclude<MemberFilter, "all"> {
  if (kind.includes("constructor")) return "constructors";
  if (kind.includes("method")) return "methods";
  if (kind === "constant" || kind.startsWith("static")) return "constants";
  return "properties";
}

function snakeCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

function instanceName(entry: CatalogEntry, language: Language) {
  if (language === "py") return snakeCase(entry.name);
  const acronym = entry.name.match(/^[A-Z]+(?=[A-Z][a-z]|\d|$)/)?.[0];
  return acronym
    ? acronym.toLowerCase() + entry.name.slice(acronym.length)
    : entry.name.charAt(0).toLowerCase() + entry.name.slice(1);
}

function callableSignature(entry: CatalogEntry, member: ResolvedCatalogMember, language: Language) {
  const signature = language === "py"
    ? member.python
    : language === "ts" ? member.typeScript : member.javaScript;
  if (member.kind.includes("constructor")) return signature;
  const receiver = member.kind === "constant" || member.kind.startsWith("static")
    ? entry.usage
    : instanceName(entry, language);
  return `${receiver}.${signature}`;
}

function javaCallableSignature(entry: CatalogEntry, member: ResolvedCatalogMember) {
  if (member.kind.includes("constructor") || member.kind === "constant" || member.kind.startsWith("static")) {
    return member.java;
  }
  return `${instanceName(entry, "js")}.${member.java}`;
}

function importStatement(entry: CatalogEntry, language: Language) {
  const symbol = entry.usage.split(".")[0];
  if (language === "py") return `from graaly import ${symbol}`;
  return `import { ${symbol} } from "graaly";`;
}

function humanize(value: string) {
  return value
    .replace(/Event$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

const eventCategoryNames: Record<string, string> = {
  block: "Blocks",
  enchantment: "Enchanting",
  entity: "Entities",
  general: "General",
  hanging: "Hanging entities",
  inventory: "Inventories",
  painting: "Legacy paintings",
  player: "Players",
  server: "Server",
  vehicle: "Vehicles",
  weather: "Weather",
  world: "Worlds",
};

const eventSpecificWhen: Record<string, string> = {
  AsyncPlayerChatEvent: "A player sends a chat message. This callback runs asynchronously.",
  AsyncPlayerPreLoginEvent: "A connection is being checked before the player is admitted to the server.",
  BlockBreakEvent: "A player is about to break a block, before the server removes it.",
  BlockPlaceEvent: "A player is about to place a block in the world.",
  EntityDamageEvent: "An entity is about to take damage from any cause.",
  EntityDamageByEntityEvent: "One entity is about to damage another entity.",
  EntityDeathEvent: "A living entity has died and the server is preparing its drops and XP.",
  FoodLevelChangeEvent: "A human entity's hunger level is about to change.",
  InventoryClickEvent: "A player clicks or moves an item inside an inventory view.",
  InventoryCloseEvent: "A player closes an inventory screen.",
  InventoryOpenEvent: "A player is about to open an inventory screen.",
  PlayerCommandPreprocessEvent: "A player has entered a command, before the server dispatches it.",
  PlayerInteractEvent: "A player interacts with a block, air, or an item in hand.",
  PlayerJoinEvent: "A player has finished joining and is now available to plugins.",
  PlayerKickEvent: "A player is about to be disconnected by the server.",
  PlayerLoginEvent: "The server is deciding whether an authenticated player may log in.",
  PlayerMoveEvent: "A player's position, yaw, or pitch is changing.",
  PlayerQuitEvent: "A player is leaving the server.",
  PlayerRespawnEvent: "The server is choosing where a player will respawn.",
  PlayerTeleportEvent: "A player is about to teleport to another location.",
  PlayerInteractEntityEvent: "A player right-clicks an entity.",
  ProjectileHitEvent: "A projectile has hit a block or entity.",
  ServerCommandEvent: "A command is about to run from the console or another server sender.",
  VehicleMoveEvent: "A vehicle moves from one location to another.",
  WeatherChangeEvent: "A world's rain state is about to change.",
  WorldInitEvent: "A world has been created and initialized, before normal gameplay begins.",
  WorldLoadEvent: "A world has completed loading.",
  WorldSaveEvent: "The server is saving a world.",
};

const eventCategoryUse: Record<string, string> = {
  block: "Use it for region protection, custom drops, building rules, and block mechanics.",
  enchantment: "Use it to control enchantment choices, costs, and results.",
  entity: "Use it for combat rules, mob behavior, drops, spawning, and damage systems.",
  general: "Use it to observe or change this part of the server lifecycle.",
  hanging: "Use it to protect paintings and item frames or customize their behavior.",
  inventory: "Use it for menus, item validation, crafting flows, and inventory protection.",
  painting: "Use it when supporting legacy painting behavior on Minecraft 1.8.8.",
  player: "Use it to shape the player experience, permissions, movement, chat, and session flow.",
  server: "Use it for server commands, plugin lifecycle integrations, and service-level rules.",
  vehicle: "Use it for carts, boats, vehicle damage, collisions, and movement rules.",
  weather: "Use it to control storms, lightning, and world weather transitions.",
  world: "Use it during world load, save, initialization, chunk, and structure workflows.",
};

function eventWhen(entry: BukkitEventEntry) {
  return eventSpecificWhen[entry.name]
    ?? `Graaly delivers this event when “${humanize(entry.name).toLowerCase()}” occurs in the ${eventCategoryNames[entry.category]?.toLowerCase() ?? entry.category} lifecycle.`;
}

function eventUse(entry: BukkitEventEntry) {
  const writable = entry.properties.filter(property => property.writable && property.name !== "cancelled");
  const base = eventCategoryUse[entry.category] ?? eventCategoryUse.general;
  if (writable.length) {
    return `${base} This event also lets you change ${writable.map(property => property.name).join(", ")}.`;
  }
  return base;
}

function javaEventExample(entry: BukkitEventEntry) {
  const property = entry.properties.find(candidate => candidate.name !== "cancelled") ?? entry.properties[0];
  const propertyRead = property?.javaRead ?? (property ? `get${property.name.charAt(0).toUpperCase()}${property.name.slice(1)}()` : null);
  return [
    "@EventHandler",
    `public void on${entry.name.replace(/Event$/, "")}(${entry.name} event) {`,
    propertyRead
      ? `    getLogger().info("${entry.name}: " + event.${propertyRead});`
      : `    getLogger().info("${entry.name} fired");`,
    ...(entry.cancellable ? ["    // event.setCancelled(true); // stop the game action"] : []),
    "}",
  ].join("\n");
}

function genericEventExample(entry: BukkitEventEntry, language: GuideLanguage) {
  if (language === "java") return javaEventExample(entry);
  const property = entry.properties.find(candidate => candidate.name !== "cancelled") ?? entry.properties[0];
  const cancellation = entry.cancellable
    ? language === "py" ? ["    # event.cancelled = True  # stop the game action"] : ["  // event.cancelled = true; // stop the game action"]
    : [];
  if (language === "py") {
    return [
      `from graaly import ${entry.name}, event, info`,
      "",
      `@event(${entry.name})`,
      `def on_${snakeCase(entry.name.replace(/Event$/, ""))}(event):`,
      property
        ? `    info(f"${entry.name}: {event.${property.pythonName}}")`
        : `    info("${entry.name} fired")`,
      ...cancellation,
    ].join("\n");
  }
  const prefix = [`import { ${entry.name}, events, info } from "graaly";`, ""];
  return [
    ...prefix,
    `events.on(${entry.name}, event => {`,
    property
      ? `  info(\`${entry.name}: \${String(event.${property.name})}\`);`
      : `  info("${entry.name} fired");`,
    ...cancellation,
    "});",
  ].join("\n");
}

function eventExample(entry: BukkitEventEntry, language: GuideLanguage) {
  if (entry.name === "PlayerJoinEvent") {
    if (language === "java") return [
      "@EventHandler",
      "public void welcome(PlayerJoinEvent event) {",
      "    event.setJoinMessage(\"§a\" + event.getPlayer().getName() + \" joined\");",
      "    event.getPlayer().sendMessage(\"§aWelcome!\");",
      "}",
    ].join("\n");
    if (language === "py") return [
      "from graaly import PlayerJoinEvent, event",
      "",
      "@event(PlayerJoinEvent)",
      "def welcome(event):",
      "    event.join_message = f\"§a{event.player.name} joined\"",
      "    event.player.send_message(\"&aWelcome!\")",
    ].join("\n");
    const prefix = ["import { events, PlayerJoinEvent } from \"graaly\";", ""];
    return [...prefix,
      "events.on(PlayerJoinEvent, event => {",
      "  event.joinMessage = `§a${event.player.name} joined`;",
      "  event.player.sendMessage(\"&aWelcome!\");",
      "});",
    ].join("\n");
  }
  if (entry.name === "BlockBreakEvent") {
    if (language === "java") return [
      "@EventHandler",
      "public void protectDiamondOre(BlockBreakEvent event) {",
      "    if (event.getBlock().getType() == Material.DIAMOND_ORE",
      "            && !event.getPlayer().hasPermission(\"mine.diamond\")) {",
      "        event.setCancelled(true);",
      "        event.getPlayer().sendMessage(\"You cannot mine this ore.\");",
      "        return;",
      "    }",
      "    event.setExpToDrop(0);",
      "}",
    ].join("\n");
    if (language === "py") return [
      "from graaly import BlockBreakEvent, Material, event",
      "",
      "@event(BlockBreakEvent)",
      "def protect_diamond_ore(event):",
      "    if (event.block.type == Material.DIAMOND_ORE",
      "            and not event.player.has_permission(\"mine.diamond\")):",
      "        event.cancelled = True",
      "        event.player.send_message(\"You cannot mine this ore.\")",
      "    else:",
      "        event.exp_to_drop = 0",
    ].join("\n");
    const prefix = ["import { BlockBreakEvent, events, Material } from \"graaly\";", ""];
    return [...prefix,
      "events.on(BlockBreakEvent, event => {",
      "  if (event.block.type === Material.DIAMOND_ORE",
      "      && !event.player.hasPermission(\"mine.diamond\")) {",
      "    event.cancelled = true;",
      "    event.player.sendMessage(\"You cannot mine this ore.\");",
      "    return;",
      "  }",
      "  event.expToDrop = 0;",
      "});",
    ].join("\n");
  }
  if (entry.name === "AsyncPlayerChatEvent") {
    if (language === "java") return [
      "@EventHandler",
      "public void moderateChat(AsyncPlayerChatEvent event) {",
      "    event.setMessage(event.getMessage().trim());",
      "    if (event.getMessage().toLowerCase().contains(\"blocked word\")) {",
      "        event.setCancelled(true);",
      "        Bukkit.getScheduler().runTask(plugin,",
      "            () -> event.getPlayer().sendMessage(\"Message blocked.\"));",
      "    }",
      "}",
    ].join("\n");
    if (language === "py") return [
      "from graaly import AsyncPlayerChatEvent, Player, event, tasks",
      "",
      "async def notify_blocked(player: Player) -> None:",
      "    player.send_message(\"Message blocked.\")",
      "",
      "@event(AsyncPlayerChatEvent)",
      "def moderate_chat(event: AsyncPlayerChatEvent) -> None:",
      "    event.message = event.message.strip()",
      "    if \"blocked word\" in event.message.lower():",
      "        event.cancelled = True",
      "        tasks.create_task(notify_blocked(event.player), name=\"chat-warning\")",
    ].join("\n");
    const prefix = ["import { AsyncPlayerChatEvent, events, tasks } from \"graaly\";", ""];
    return [...prefix,
      "events.on(AsyncPlayerChatEvent, event => {",
      "  event.message = event.message.trim();",
      "  if (event.message.toLowerCase().includes(\"blocked word\")) {",
      "    event.cancelled = true;",
      "    tasks.run(() => event.player.sendMessage(\"Message blocked.\"));",
      "  }",
      "});",
    ].join("\n");
  }
  if (entry.name === "EntityDamageEvent") {
    if (language === "java") return [
      "@EventHandler",
      "public void softenDamage(EntityDamageEvent event) {",
      "    event.setDamage(event.getDamage() * 0.5);",
      "    if (event.getDamage() < 1.0) event.setCancelled(true);",
      "}",
    ].join("\n");
    if (language === "py") return [
      "from graaly import EntityDamageEvent, event",
      "",
      "@event(EntityDamageEvent)",
      "def soften_damage(event):",
      "    event.damage *= 0.5",
      "    if event.damage < 1.0:",
      "        event.cancelled = True",
    ].join("\n");
    const prefix = ["import { EntityDamageEvent, events } from \"graaly\";", ""];
    return [...prefix,
      "events.on(EntityDamageEvent, event => {",
      "  event.damage *= 0.5;",
      "  if (event.damage < 1) event.cancelled = true;",
      "});",
    ].join("\n");
  }
  return genericEventExample(entry, language);
}

function LanguageTabs({ value, onChange, compact = false }: {
  value: Language;
  onChange: (language: Language) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "language-tabs is-compact" : "language-tabs"} role="tablist" aria-label="Code language">
      {languages.map(language => (
        <button
          aria-selected={value === language.id}
          className={value === language.id ? "is-active" : ""}
          key={language.id}
          onClick={() => onChange(language.id)}
          role="tab"
          type="button"
        >
          {compact ? language.id.toUpperCase() : language.label}
        </button>
      ))}
    </div>
  );
}

function QuickstartLanguageTabs({ value, onChange }: {
  value: QuickstartLanguage;
  onChange: (language: QuickstartLanguage) => void;
}) {
  return (
    <div className="language-tabs has-java" role="tablist" aria-label="Quick start language">
      {quickstartLanguages.map(language => (
        <button
          aria-selected={value === language.id}
          className={value === language.id ? "is-active" : ""}
          key={language.id}
          onClick={() => onChange(language.id)}
          role="tab"
          type="button"
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}

function GraalyRuntimeInstallGuide() {
  return (
    <div className="quickstart-install-guide" aria-labelledby="install-graaly-title">
      <div className="quickstart-guide-heading">
        <span>1 · INSTALL THE RUNTIME</span>
        <div>
          <h3 id="install-graaly-title">Put Graaly on the server first</h3>
          <p>
            Graaly does not currently publish a release JAR. Build the current source, copy the single runtime JAR into
            your server&apos;s <code>plugins/</code> directory, and start the server once.
          </p>
        </div>
      </div>

      <ol className="quickstart-path">
        <li><span>01</span><div><strong>Build</strong><p>Java 17+ and Maven produce <code>runtime/target/Graaly-1.0.0.jar</code>.</p></div></li>
        <li><span>02</span><div><strong>Install</strong><p>Copy only that JAR to <code>server/plugins/</code>. The legacy agent is not a plugin.</p></div></li>
        <li><span>03</span><div><strong>Start once</strong><p>Graaly creates its directory and downloads the enabled GraalJS/GraalPy runtimes.</p></div></li>
        <li><span>04</span><div><strong>Verify</strong><p>Check the ready log, then run <code>graaly status</code> from the console.</p></div></li>
      </ol>

      <div className="two-code-columns quickstart-install-code">
        <CodeBlock accent="shell" code={graalyInstallCommands} label="Terminal" />
        <CodeBlock accent="shell" code={graalyFirstStartLayout} label="Created after first start" />
      </div>

      <div className="quickstart-verification">
        <span>READY CHECK</span>
        <div>
          <code>[Graaly] Graaly is ready: 0 script plugin(s), downloaded Graal …</code>
          <p>
            In the server console run <code>graaly status</code>. In game use <code>/graaly status</code> as an operator or
            with <code>graaly.admin</code> permission.
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickstartDeploymentGuide({ language }: { language: QuickstartLanguage }) {
  const deployment = quickstartDeployment[language];
  const languageName = quickstartLanguages.find(item => item.id === language)?.label ?? language;
  const isScript = language !== "java";

  return (
    <div className="quickstart-deploy-guide" aria-labelledby="deploy-plugin-title">
      <div className="quickstart-guide-heading">
        <span>3 · BUILD, COPY, LOAD</span>
        <div>
          <h3 id="deploy-plugin-title">Deploy the {languageName} plugin</h3>
          <p>
            {isScript
              ? <>The whole bundle is one directory. Its suffix tells Graaly which language loader to use, and <code>plugin.yml</code> points to the entry file inside it.</>
              : <>Java remains a normal compiled plugin. It is shown as a direct comparison and is not loaded by Graaly&apos;s script loader.</>}
          </p>
        </div>
      </div>

      <ol className="quickstart-path is-three">
        <li><span>01</span><div><strong>Build or check</strong><p>Run the language toolchain locally; do not install Node.js or CPython on the game server.</p></div></li>
        <li><span>02</span><div><strong>Copy the payload</strong><p>{isScript ? <>Place the bundle under <code>plugins/Graaly/scripts/</code>.</> : <>Place the compiled JAR under <code>plugins/</code>.</>}</p></div></li>
        <li><span>03</span><div><strong>Load and test</strong><p>Follow the load rule below, check the log, then execute <code>/hello</code> in game.</p></div></li>
      </ol>

      <div className="two-code-columns quickstart-command-grid">
        <CodeBlock accent="shell" code={deployment.build} label={deployment.buildLabel} />
        <CodeBlock accent="shell" code={deployment.deploy} label={deployment.deployLabel} />
      </div>
      <CodeBlock accent="shell" code={deployment.layout} label="Required server layout" />

      <div className="quickstart-load-rule">
        <span>LOAD RULE</span>
        <p>{deployment.load}</p>
      </div>
      {isScript && (
        <div className="note-line warning">
          <strong>New bundle or <code>plugin.yml</code> change:</strong> restart the server. <strong>Source-only change to an
          already loaded bundle:</strong> copy the rebuilt file, then use <code>/graaly reload</code> as an operator.
        </div>
      )}
    </div>
  );
}

function GuideLanguageTabs({ value, onChange }: {
  value: GuideLanguage;
  onChange: (language: GuideLanguage) => void;
}) {
  return (
    <div className="language-tabs is-compact has-java" role="tablist" aria-label="Code language and Java equivalent">
      {guideLanguages.map(language => (
        <button
          aria-label={language.label}
          aria-selected={value === language.id}
          className={value === language.id ? "is-active" : ""}
          key={language.id}
          onClick={() => onChange(language.id)}
          role="tab"
          type="button"
        >
          {language.short}
        </button>
      ))}
    </div>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return (
    <button className="copy-button" onClick={copy} type="button" aria-label="Copy code">
      {copied ? <Check size={14} aria-hidden="true" /> : <Clipboard size={14} aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, label, accent = "ts" }: {
  code: string;
  label: string;
  accent?: GuideLanguage | "yaml" | "shell";
}) {
  const codeRef = useRef<HTMLElement>(null);
  const syntaxLanguage: ShjLanguage = accent === "shell" ? "bash" : accent;
  const usesRuntimeLogger = accent !== "java" && /(^|[^\w.])(info|warn)\(/m.test(code);

  useEffect(() => {
    const element = codeRef.current;
    if (!element) return;
    element.textContent = code;
    void highlightElement(element, syntaxLanguage, "multiline", { hideLineNumbers: true });
  }, [code, syntaxLanguage]);

  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span className={`code-dot code-dot-${accent}`} aria-hidden="true" />
        <span>{label}</span>
        <CopyButton code={code} />
      </div>
      <pre><code className={`shj-lang-${syntaxLanguage}`} ref={codeRef}>{code}</code></pre>
      {usesRuntimeLogger && (
        <div className="code-helper-note">
          <code>info(value)</code> writes an INFO line to this plugin&apos;s server logger;
          <code> warn(value)</code> writes a warning. They do not send text to players.
        </div>
      )}
    </div>
  );
}

function LanguageLearningGuide() {
  const [language, setLanguage] = useState<Language>("py");
  const [conceptIndex, setConceptIndex] = useState(0);
  const track = learningTracks[language];
  const examples = learningConceptExamples[language];
  const selectedConcept = track.concepts[conceptIndex] ?? track.concepts[0];
  const selectedExample = examples[conceptIndex] ?? examples[0];

  function selectLanguage(next: Language) {
    setLanguage(next);
    setConceptIndex(0);
  }

  return (
    <div className="learning-guide">
      <div className="runtime-boundary" aria-label="JavaScript runtime boundary">
        <div>
          <span>LANGUAGE</span>
          <strong>JavaScript / TypeScript / Python</strong>
          <p>Keywords, modules, collections, control flow, types, exceptions, and async syntax.</p>
        </div>
        <ArrowRight size={18} aria-hidden="true" />
        <div>
          <span>DOMAIN API</span>
          <strong>Graaly</strong>
          <p>Players, worlds, events, commands, tasks, entities, and packets.</p>
        </div>
        <ArrowRight size={18} aria-hidden="true" />
        <div>
          <span>ENVIRONMENT</span>
          <strong>Game server</strong>
          <p>Live state on Java 17 or newer. This is not a web page or a Node.js process.</p>
        </div>
      </div>

      <div className="dom-note">
        <div>
          <strong>The server runtime has no DOM.</strong>
          <p>
            Graaly runs server-side, so browser globals such as <code>window</code>, <code>document</code>, and
            <code> HTMLElement</code> are intentionally absent there. Website boards are still experimental and remain outside
            the stable public contract until their browser lifecycle and input behavior are ready.
          </p>
        </div>
        <a href="#boards">
          Website board status <ArrowRight size={13} aria-hidden="true" />
        </a>
      </div>

      <div className="learning-toolbar">
        <LanguageTabs value={language} onChange={selectLanguage} />
        <div>
          <span>SELECTED PATH</span>
          <strong>{track.title}</strong>
          <p>{track.intro}</p>
        </div>
      </div>

      <div className="learning-layout" key={language}>
        <div className="keyword-grid" aria-label={`${track.title} concepts`} role="tablist">
          {track.concepts.map((concept, index) => (
            <button
              aria-controls="language-concept-example"
              aria-selected={index === conceptIndex}
              key={concept.syntax}
              onClick={() => setConceptIndex(index)}
              role="tab"
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <code>{concept.syntax}</code>
              <strong>{concept.name}</strong>
              <p>{concept.detail}</p>
            </button>
          ))}
        </div>
        <div
          aria-label={`${selectedConcept.name} example`}
          className="learning-example"
          id="language-concept-example"
          role="tabpanel"
        >
          <div className="concept-example-heading">
            <span>EXAMPLE {String(conceptIndex + 1).padStart(2, "0")}</span>
            <strong>{selectedConcept.name}</strong>
            <p>{selectedConcept.detail}</p>
          </div>
          <CodeBlock accent={language} code={selectedExample.code} label={selectedExample.file} />
          <details className="language-recipes">
            <summary>Complete {language === "py" ? "Python" : language === "ts" ? "TypeScript" : "JavaScript"} path example<ChevronDown size={14} aria-hidden="true" /></summary>
            <CodeBlock accent={language} code={track.code} label={track.file} />
          </details>
          <details className="language-recipes">
            <summary>{track.recipe.title}<ChevronDown size={14} aria-hidden="true" /></summary>
            <CodeBlock accent={language} code={track.recipe.code} label={track.recipe.file} />
          </details>
          <div className="official-reading">
            <span>OFFICIAL LANGUAGE REFERENCES</span>
            <div>
              {track.sources.map(source => (
                <a href={source.href} key={source.href} target="_blank" rel="noreferrer">
                  {source.label} <ExternalLink size={12} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function subscribeReducedMotion(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function reducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function StudioCodeLine({ line, language }: { line: string; language: StudioLesson["language"] }) {
  const ref = useRef<HTMLElement>(null);
  const syntaxLanguage: ShjLanguage = language === "shell" ? "bash" : language;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.textContent = line || " ";
    void highlightElement(element, syntaxLanguage, "inline");
  }, [line, syntaxLanguage]);

  return <code className={`shj-lang-${syntaxLanguage}`} ref={ref}>{line || " "}</code>;
}

function AnimatedStudioCode({ lesson, reducedMotion }: { lesson: StudioLesson; reducedMotion: boolean }) {
  const lines = useMemo(() => lesson.code.split("\n"), [lesson.code]);
  const [visibleLines, setVisibleLines] = useState(1);

  useEffect(() => {
    if (reducedMotion) {
      const frame = window.requestAnimationFrame(() => setVisibleLines(lines.length));
      return () => window.cancelAnimationFrame(frame);
    }

    let nextLine = 1;
    const timer = window.setInterval(() => {
      nextLine += 1;
      setVisibleLines(Math.min(nextLine, lines.length));
      if (nextLine >= lines.length) window.clearInterval(timer);
    }, 110);
    return () => window.clearInterval(timer);
  }, [lines.length, reducedMotion]);

  return (
    <div className="studio-code-lines" aria-label={`${lesson.file} source code`}>
      {lines.map((line, index) => {
        const lineNumber = index + 1;
        const visible = lineNumber <= visibleLines;
        const focused = lineNumber >= lesson.focus[0] && lineNumber <= lesson.focus[1];
        return (
          <div
            aria-hidden={!visible}
            className={`${visible ? "is-visible" : ""} ${focused ? "is-focused" : ""}`}
            key={`${lineNumber}-${line}`}
          >
            <span>{lineNumber}</span>
            <StudioCodeLine language={lesson.language} line={line} />
          </div>
        );
      })}
    </div>
  );
}

function ReactFastApiStudio() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, () => true);
  const lesson = studioLessons[lessonIndex];
  const isFirst = lessonIndex === 0;
  const isLast = lessonIndex === studioLessons.length - 1;
  const autoplay = playing && !reducedMotion;

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(() => {
      if (isLast) setPlaying(false);
      else setLessonIndex(lessonIndex + 1);
    }, 30000);
    return () => window.clearTimeout(timer);
  }, [autoplay, isLast, lessonIndex]);

  function selectLesson(next: number): void {
    setLessonIndex(Math.max(0, Math.min(studioLessons.length - 1, next)));
    setPlaying(false);
  }

  function togglePlayback(): void {
    if (reducedMotion) return;
    if (!playing && isLast) setLessonIndex(0);
    setPlaying(current => !current);
  }

  function openFile(file: string): void {
    const index = studioLessons.findIndex(entry => entry.file === file);
    if (index >= 0) selectLesson(index);
  }

  return (
    <section className="stack-studio" aria-label="Interactive React and FastAPI course">
      <header className="studio-intro">
        <div>
          <span>GUIDED COURSE · 15 LESSONS</span>
          <h3>React and FastAPI, step by step</h3>
        </div>
        <p>
          Follow one architectural decision at a time. Compare game UI with web React, inspect the code,
          and learn why each boundary exists.
        </p>
      </header>

      <div className="studio-coursebar">
        <div className="studio-course-position">
          <span>LESSON {lesson.number} OF {studioLessons.length}</span>
          <strong>{lesson.phase}</strong>
        </div>
        <div
          aria-label={`${lessonIndex + 1} of ${studioLessons.length} lessons completed`}
          aria-valuemax={studioLessons.length}
          aria-valuemin={1}
          aria-valuenow={lessonIndex + 1}
          className="studio-course-meter"
          role="progressbar"
        >
          <i style={{ transform: `scaleX(${(lessonIndex + 1) / studioLessons.length})` }} />
        </div>
        <label className="studio-lesson-picker">
          <span>JUMP TO</span>
          <select
            aria-label="Choose a course lesson"
            onChange={event => selectLesson(Number(event.target.value))}
            value={lessonIndex}
          >
            {studioLessons.map((entry, index) => (
              <option key={entry.id} value={index}>
                {entry.number} · {entry.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="studio-stage" key={lesson.id}>
        <div className="studio-ide">
          <div className="studio-titlebar">
            <div className="studio-window-dots" aria-hidden="true"><i /><i /><i /></div>
            <strong>Graaly Stack Workshop</strong>
            <span>{autoplay ? "TEACHING" : "PAUSED"}</span>
          </div>

          <div className="studio-workbench">
            <aside className="studio-files" aria-label="Example project files">
              {studioProjectFiles.map(group => (
                <div key={group.group}>
                  <span>{group.group}</span>
                  {group.files.map(file => (
                    <button
                      className={file === lesson.file ? "is-active" : ""}
                      key={file}
                      onClick={() => openFile(file)}
                      type="button"
                    >
                      <i className={file.endsWith(".py") ? "is-python" : file === "terminal" ? "is-shell" : "is-typescript"} />
                      {file.split("/").at(-1)}
                    </button>
                  ))}
                </div>
              ))}
            </aside>

            <div className="studio-editor">
              <div className="studio-editor-tab">
                <i className={`is-${lesson.language === "py" ? "python" : lesson.language === "shell" ? "shell" : "typescript"}`} />
                <span>{lesson.file}</span>
                <CopyButton code={lesson.code} />
              </div>
              <div className="studio-code-scroll">
                <AnimatedStudioCode key={lesson.id} lesson={lesson} reducedMotion={reducedMotion} />
              </div>
              <div className="studio-statusbar">
                <span>Graaly 2.0</span>
                <span>{lesson.language === "py" ? "Python" : lesson.language === "shell" ? "Terminal" : "TypeScript React"}</span>
                <span>Focus: Ln {lesson.focus[0]}–{lesson.focus[1]}</span>
              </div>
            </div>
          </div>
        </div>

        <article className="studio-explanation" aria-live="polite">
          <header>
            <div><span>{lesson.phase}</span><span>Lesson {lesson.number} / {studioLessons.length}</span></div>
            <h4>{lesson.title}</h4>
            <p>{lesson.summary}</p>
          </header>

          <div className="studio-reasoning">
            <section>
              <span>WHY IT EXISTS</span>
              <p>{lesson.why}</p>
            </section>
            <section className="is-web-compare">
              <span>WEB REACT ↔ GAME REACT</span>
              <p>{lesson.webDifference}</p>
            </section>
            <section>
              <span>WHY THIS CHOICE</span>
              <p>{lesson.decision}</p>
            </section>
          </div>

          <div className="studio-memory">
            <span>KEEP THIS</span>
            <strong>{lesson.remember}</strong>
          </div>
        </article>
      </div>

      <footer className="studio-controls">
        <div className="studio-autoplay-progress" aria-hidden="true">
          <i key={`${lesson.id}-${autoplay}`} className={autoplay ? "is-running" : ""} />
        </div>
        <div>
          <button disabled={isFirst} onClick={() => selectLesson(lessonIndex - 1)} type="button">
            <ChevronLeft size={14} aria-hidden="true" /> Previous
          </button>
          <button
            aria-label={reducedMotion ? "Autoplay disabled by reduced motion preference" : autoplay ? "Pause course" : "Play course"}
            className="studio-play"
            disabled={reducedMotion}
            onClick={togglePlayback}
            type="button"
          >
            {autoplay ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            {reducedMotion ? "Manual mode" : autoplay ? "Pause" : isLast ? "Replay" : "Play"}
          </button>
          <button disabled={isLast} onClick={() => selectLesson(lessonIndex + 1)} type="button">
            Next <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
        <p>Use the lesson menu or Previous and Next to study at your own pace.</p>
      </footer>
    </section>
  );
}

function ReactFastApiPatternExplorer() {
  const [selectedId, setSelectedId] = useState(reactFastApiPatterns[0].id);
  const [side, setSide] = useState<"react" | "fastapi">("react");
  const pattern = reactFastApiPatterns.find(entry => entry.id === selectedId) ?? reactFastApiPatterns[0];

  return (
    <div className="stack-pattern-lab">
      <header className="pattern-lab-heading">
        <div>
          <span>7 ARCHITECTURE PATTERNS</span>
          <h3>Where React ends and FastAPI begins</h3>
        </div>
        <p>
          Read each pair from left to right: the React pattern controls presentation and interaction;
          the FastAPI pattern protects data and business rules. Every example is ordinary framework code.
        </p>
      </header>

      <div className="pattern-lab-shell">
        <nav className="pattern-index" aria-label="React and FastAPI patterns">
          {reactFastApiPatterns.map(entry => (
            <button
              aria-current={entry.id === pattern.id ? "step" : undefined}
              className={entry.id === pattern.id ? "is-selected" : ""}
              key={entry.id}
              onClick={() => setSelectedId(entry.id)}
              type="button"
            >
              <span>{entry.step}</span>
              <div>
                <strong>{entry.title}</strong>
                <small>{entry.reactPattern} ↔ {entry.fastApiPattern}</small>
              </div>
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          ))}
        </nav>

        <article className="pattern-detail" key={pattern.id}>
          <header>
            <div className="pattern-kicker">
              <span>{pattern.level}</span>
              <span>Pattern {pattern.step} / {String(reactFastApiPatterns.length).padStart(2, "0")}</span>
            </div>
            <h4>{pattern.title}</h4>
            <p>{pattern.reason}</p>
          </header>

          <div className="pattern-pair">
            <div><span>REACT</span><strong>{pattern.reactPattern}</strong></div>
            <ArrowRight size={14} aria-hidden="true" />
            <div><span>FASTAPI</span><strong>{pattern.fastApiPattern}</strong></div>
          </div>

          <ol className="pattern-flow">
            {pattern.flow.map((step, index) => (
              <li key={step}><span>{index + 1}</span><p>{step}</p></li>
            ))}
          </ol>

          <div className="pattern-code-tabs" role="tablist" aria-label={`${pattern.title} code side`}>
            <button
              aria-selected={side === "react"}
              className={side === "react" ? "is-active" : ""}
              onClick={() => setSide("react")}
              role="tab"
              type="button"
            >
              React + TypeScript
            </button>
            <button
              aria-selected={side === "fastapi"}
              className={side === "fastapi" ? "is-active" : ""}
              onClick={() => setSide("fastapi")}
              role="tab"
              type="button"
            >
              FastAPI + Python
            </button>
          </div>
          <CodeBlock
            accent={side === "react" ? "ts" : "py"}
            code={side === "react" ? pattern.reactCode : pattern.fastApiCode}
            label={side === "react" ? pattern.reactFile : pattern.fastApiFile}
          />

          <div className="pattern-avoid">
            <strong>ANTI-PATTERN</strong>
            <p>{pattern.avoid}</p>
          </div>
        </article>
      </div>

      <div className="pattern-reading">
        <span>CONTINUE WITH THE OFFICIAL GUIDES</span>
        <div>
          <a href="https://react.dev/learn/reusing-logic-with-custom-hooks" target="_blank" rel="noreferrer">React custom Hooks <ExternalLink size={11} /></a>
          <a href="https://react.dev/learn/scaling-up-with-reducer-and-context" target="_blank" rel="noreferrer">Reducer + Context <ExternalLink size={11} /></a>
          <a href="https://react.dev/reference/react/useOptimistic" target="_blank" rel="noreferrer">React useOptimistic <ExternalLink size={11} /></a>
          <a href="https://fastapi.tiangolo.com/tutorial/dependencies/" target="_blank" rel="noreferrer">FastAPI dependencies <ExternalLink size={11} /></a>
          <a href="https://fastapi.tiangolo.com/tutorial/bigger-applications/" target="_blank" rel="noreferrer">FastAPI APIRouter <ExternalLink size={11} /></a>
          <a href="https://docs.sqlalchemy.org/en/20/orm/session_transaction.html" target="_blank" rel="noreferrer">SQLAlchemy transactions <ExternalLink size={11} /></a>
        </div>
      </div>
    </div>
  );
}

function ReactFastApiGuide() {
  const [sample, setSample] = useState<"react" | "fastapi" | "python">("react");
  const samples = {
    react: { label: "React + TypeScript", file: "src/main.tsx", accent: "ts" as const, code: reactUiCode },
    fastapi: { label: "FastAPI + SQLAlchemy", file: "backend/app/main.py", accent: "py" as const, code: fastApiCode },
    python: { label: "Python-only UI", file: "main.py", accent: "py" as const, code: pythonUiCode },
  };
  const selected = samples[sample];

  return (
    <div className="react-stack-guide">
      <ReactFastApiStudio />

      <div className="react-truth">
        <div>
          <strong>React semantics stay intact.</strong>
          <p>
            <code>@graaly/react</code> uses React 19 and its reconciler. Components, JSX, props, hooks, context,
            state, effects, composition, error handling, and third-party state libraries keep their normal meaning.
            The only difference is the render target: game UI instead of an HTML DOM.
          </p>
        </div>
      </div>

      <div className="stack-flow" aria-label="React and FastAPI architecture">
        <div><span>1</span><strong>Game event</strong><p>Join, command, inventory click, packet, or your own rule.</p></div>
        <ArrowRight size={17} aria-hidden="true" />
        <div><span>2</span><strong>Graaly adapter</strong><p>Keeps the player reference and publishes safe UI actions.</p></div>
        <ArrowRight size={17} aria-hidden="true" />
        <div><span>3</span><strong>React tree</strong><p>State decides what each player sees; updates are reconciled.</p></div>
        <ArrowRight size={17} aria-hidden="true" />
        <div><span>4</span><strong>FastAPI service</strong><p>Validates requests and persists data with SQLAlchemy.</p></div>
      </div>

      <div className="stack-boundary">
        <div>
          <span>INSIDE THE GAME PROCESS</span>
          <strong>Graaly + React renderer</strong>
          <p>Receives live events, owns player references, and applies UI or world changes on the safe server thread.</p>
        </div>
        <div>
          <span>SEPARATE CPYTHON PROCESS</span>
          <strong>FastAPI + SQLAlchemy</strong>
          <p>Owns HTTP routes, validation, authentication, database sessions, migrations, and business data.</p>
        </div>
        <p>
          FastAPI can be your application backend, but it cannot directly receive in-process game events or hold live player objects.
          The small Graaly adapter is the boundary that makes the split reliable.
        </p>
      </div>

      <div className="catalog-intro">
        <span>WEB-STYLE AUTHORIZATION</span>
        <h3>React displays permissions; FastAPI enforces them</h3>
        <p>
          Graaly uses the long service key only to exchange a trusted player identity for a short-lived JWT.
          Every protected request carries that bearer token, while FastAPI reloads the actor&apos;s current roles
          and permissions from SQL before running the endpoint. A role change therefore revokes access immediately,
          even when the old identity token has not expired.
        </p>
      </div>
      <div className="stack-flow" aria-label="Authentication and authorization flow">
        <div><span>1</span><strong>Session exchange</strong><p><code>POST /v1/auth/session</code> accepts the service key and player identity.</p></div>
        <ArrowRight size={17} aria-hidden="true" />
        <div><span>2</span><strong>Short bearer JWT</strong><p>The token identifies the player; it does not freeze a permission snapshot.</p></div>
        <ArrowRight size={17} aria-hidden="true" />
        <div><span>3</span><strong>Live RBAC lookup</strong><p>Member, moderator, and admin roles resolve to current permission keys.</p></div>
        <ArrowRight size={17} aria-hidden="true" />
        <div><span>4</span><strong>Dependency guard</strong><p><code>require_permission(...)</code> allows or rejects before business logic.</p></div>
      </div>
      <div className="autonomy-grid">
        <article><span>MEMBER</span><strong>Play and purchase</strong><p><code>profile.read</code>, <code>shop.purchase</code>, and <code>realtime.connect</code>.</p></article>
        <article><span>MODERATOR</span><strong>Inspect players</strong><p>Profile and realtime access plus <code>permissions.read</code>, without role mutation.</p></article>
        <article><span>ADMIN</span><strong>Manage assignments</strong><p>All permissions, including <code>permissions.manage</code>. Bootstrap admins cannot remove their own emergency access.</p></article>
      </div>

      <div className="autonomy-grid">
        <article><span>OPTION A</span><strong>All TypeScript</strong><p>Use Graaly for rules and data, plus React for UI. No HTTP service is required.</p></article>
        <article><span>OPTION B</span><strong>All Python</strong><p>Use decorators, asyncio, and <code>ui.render</code>. React is optional, not mandatory.</p></article>
        <article><span>OPTION C · RECOMMENDED FOR THIS SPLIT</span><strong>React + Python service</strong><p>React/TS owns presentation; FastAPI/SQLAlchemy owns durable application data.</p></article>
      </div>

      <div className="surface-reference">
        <header><span>REACT HOST COMPONENTS</span><h3>One component for every native UI surface</h3></header>
        <div>
          <article><code>&lt;Message&gt;</code><p>One-shot chat, action-bar, or title output. Give it a stable unique <code>id</code>.</p><small>Java: sendMessage / sendActionBar / sendTitle</small></article>
          <article><code>&lt;Inventory&gt; + &lt;Item&gt;</code><p>Menu slots, names, lore, amounts, click handlers, and close handlers.</p><small>Java: Inventory + inventory events</small></article>
          <article><code>&lt;Scoreboard&gt; + &lt;Line&gt;</code><p>Up to 15 keyed lines. Stable IDs let Graaly update only changed rows.</p><small>Java: Scoreboard + Objective + Team</small></article>
          <article><code>&lt;BossBar&gt;</code><p>Text and progress from 0 to 1, updated only when the values change.</p><small>Java: legacy 1.8 boss display packets</small></article>
          <article><code>&lt;Tab&gt;</code><p>Per-player header and footer that follow normal React state.</p><small>Java: setPlayerListHeaderFooter</small></article>
          <article><code>&lt;ChatInput&gt;</code><p>A controlled or uncontrolled text field backed by the player&apos;s next chat message, with submit, cancel, and cleanup.</p><small>React: value / defaultValue / onSubmit</small></article>
          <article><code>createRoot(player)</code><p>Creates one isolated React root. Call <code>unmount()</code> when the player leaves.</p><small>React: createRoot lifecycle</small></article>
          <article><code>ref + handle</code><p>Typed Inventory, Scoreboard, BossBar, Tab, and ChatInput handles expose only dismiss, refresh, ID, kind, and current props.</p><small>React 19: ref prop + imperative API</small></article>
          <article><code>createPortal(...)</code><p>Targets another player root while preserving the source component&apos;s Context and logical ownership.</p><small>React: genuine cross-root portal</small></article>
          <article><code>root.getCommits()</code><p>Reads immutable native-surface diffs, durations, and history so performance and batching can be proven.</p><small>Graaly: commit inspector</small></article>
          <article><code>@graaly/react-test</code><p>Uses the real reconciler and <code>act()</code> to click slots, submit input, inspect snapshots, and assert commits.</p><small>Testing: no server or arbitrary sleep</small></article>
        </div>
      </div>

      <ReactFastApiPatternExplorer />

      <div className="stack-code-area">
        <div className="stack-code-tabs" role="tablist" aria-label="Full-stack examples">
          {(Object.keys(samples) as Array<keyof typeof samples>).map(key => (
            <button
              aria-selected={sample === key}
              className={sample === key ? "is-active" : ""}
              key={key}
              onClick={() => setSample(key)}
              role="tab"
              type="button"
            >
              {samples[key].label}
            </button>
          ))}
        </div>
        <CodeBlock accent={selected.accent} code={selected.code} label={selected.file} />
      </div>

      <div className="request-flow">
        <div><span>1</span><p>The player clicks an <code>&lt;Item onClick&gt;</code>.</p></div>
        <div><span>2</span><p>React receives a typed action with player ID, slot, click type, Shift, and right-click state.</p></div>
        <div><span>3</span><p><code>await http.post(...)</code> runs off the tick loop; its continuation returns on the safe server thread.</p></div>
        <div><span>4</span><p>FastAPI authenticates the bearer actor, resolves live permissions, validates the payload, then SQLAlchemy commits.</p></div>
        <div><span>5</span><p>The result updates React state; Graaly diffs inventory slots, lines, tab, and boss bar without reopening unchanged UI.</p></div>
      </div>

      <div className="stack-install">
        <div>
          <span>RUN THE COMPLETE EXAMPLE</span>
          <h3><code>examples/ReactFastApi.jsplugin</code></h3>
          <p>
            The checked-in example includes per-player TanStack Query caches, optimistic rollback, a React role editor,
            JWT identity exchange, live RBAC dependencies, async SQLAlchemy models, Alembic migrations, authenticated WebSocket,
            generated OpenAPI TypeScript models, JavaScript and Python permission clients, health/readiness probes, and automated
            security, transaction, migration, socket, renderer, and contract tests.
          </p>
          <div className="stack-links">
            <a href="./downloads/Graaly-React-FastAPI.zip" download>Download the complete example <ArrowRight size={12} /></a>
            <a href="https://github.com/sk8erboi17/Graaly" target="_blank" rel="noreferrer">Graaly repository <ExternalLink size={12} /></a>
            <a href="https://fastapi.tiangolo.com/" target="_blank" rel="noreferrer">FastAPI reference <ExternalLink size={12} /></a>
            <a href="https://fastapi.tiangolo.com/advanced/websockets/" target="_blank" rel="noreferrer">FastAPI WebSockets <ExternalLink size={12} /></a>
            <a href="https://openapi-ts.dev/cli" target="_blank" rel="noreferrer">OpenAPI TypeScript CLI <ExternalLink size={12} /></a>
            <a href="https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html" target="_blank" rel="noreferrer">SQLAlchemy asyncio <ExternalLink size={12} /></a>
          </div>
        </div>
        <CodeBlock accent="shell" code={reactSetupCode} label="terminal" />
      </div>

      <div className="plain-callout stack-production-note">
        <strong>Production rules:</strong> bind a same-host API to <code>127.0.0.1</code>, keep service and JWT secrets in the environment,
        set request timeouts, validate prices and rewards in Python, never trust an item name sent by the UI, and keep an offline fallback.
        Run Alembic before startup, close WebSockets in Effect cleanup, make writes idempotent, resolve permissions in FastAPI,
        and never grant a reward from optimistic state. Graaly cancels outstanding requests, aborts sockets, and unmounts UI when the plugin disables.
      </div>
    </div>
  );
}

// Kept as an experimental preview component, but intentionally not linked from the stable docs yet.
export function WebsiteBoardGuide() {
  const [language, setLanguage] = useState<GuideLanguage>("ts");
  const [destination, setDestination] = useState("survival");
  const [nickname, setNickname] = useState("");
  const [alerts, setAlerts] = useState(true);
  const [demoStatus, setDemoStatus] = useState("Ready. Try every control.");

  return (
    <div className="board-guide">
      <div className="board-flow" aria-label="Website board data flow">
        <div><span>1</span><strong>Your Graaly plugin</strong><p>Publishes typed JSON state and validates messages.</p></div>
        <ArrowRight size={17} aria-hidden="true" />
        <div><span>2</span><strong>Real Chromium DOM</strong><p>Runs your HTML, CSS and compiled TypeScript in isolation.</p></div>
        <ArrowRight size={17} aria-hidden="true" />
        <div><span>3</span><strong>The in-game board</strong><p>Shows fresh pixels and maps player clicks back to DOM coordinates.</p></div>
      </div>

      <div className="board-demo-wrap">
        <form
          className="board-live-demo"
          onSubmit={event => {
            event.preventDefault();
            setDemoStatus(`Teleport requested: ${destination}`);
          }}
        >
          <header>
            <div><span>LIVE DOM SAMPLE</span><strong>Control panel</strong></div>
            <i aria-hidden="true" />
          </header>
          <label>
            Destination
            <select
              onChange={event => {
                setDestination(event.target.value);
                setDemoStatus(`Selected ${event.target.selectedOptions[0]?.text ?? event.target.value}`);
              }}
              value={destination}
            >
              <option value="survival">Survival</option>
              <option value="arena">Arena</option>
              <option value="mines">Mines</option>
            </select>
          </label>
          <label>
            Board nickname
            <input
              maxLength={24}
              onChange={event => {
                setNickname(event.target.value);
                setDemoStatus(event.target.value ? `Nickname: ${event.target.value}` : "Nickname cleared");
              }}
              placeholder="Type a name"
              value={nickname}
            />
          </label>
          <label className="board-demo-check">
            <input
              checked={alerts}
              onChange={event => {
                setAlerts(event.target.checked);
                setDemoStatus(`Alerts ${event.target.checked ? "enabled" : "disabled"}`);
              }}
              type="checkbox"
            />
            Enable alerts
          </label>
          <div className="board-demo-actions">
            <button type="submit">Teleport</button>
            <button onClick={() => setDemoStatus("Starter kit requested")} type="button">Claim kit</button>
          </div>
          <output key={demoStatus}>{demoStatus}</output>
        </form>

        <div className="board-control-list">
          <article><code>&lt;button&gt;</code><p>Native click and submit events.</p></article>
          <article><code>&lt;select&gt;</code><p>Each board click advances to the next enabled option.</p></article>
          <article><code>&lt;input&gt;</code><p>The next private chat message types into a focused text field.</p></article>
          <article><code>checkbox · range</code><p>Toggle and position controls with ordinary change events.</p></article>
          <article><code>&lt;textarea&gt;</code><p>Multiline text uses the same private input flow.</p></article>
          <article><code>custom elements</code><p>Build tabs, menus and widgets with normal DOM listeners.</p></article>
          <article><code>mouse wheel</code><p>Scrolls the real page while the selected hotbar slot stays unchanged.</p></article>
        </div>
      </div>

      <div className="board-explanation">
        <div><span>WHAT RUNS WHERE</span><h3>Frontend code stays frontend code</h3><p>Your page uses <code>document.querySelector</code>, CSS, forms and events exactly as a website does. Server code uses <code>boards.state</code> and <code>boards.onMessage</code>. Neither side reaches through to Java objects.</p></div>
        <div><span>TEXT INPUT</span><h3>Private and deliberate</h3><p>Click an input or textarea, type one chat message, and GraalyBoard inserts it into the focused element without broadcasting it. Enter <code>!cancel</code> to abort.</p></div>
        <div><span>BOARD UX</span><h3>Design for a crosshair, not a cursor</h3><p>Use hit areas of at least 44 px. The renderer marks <code>html[data-graaly-board=&quot;true&quot;]</code>, so you can disable expensive continuous animation only in game while keeping the normal website animated.</p></div>
      </div>

      <div className="board-code-heading">
        <span>STEP 1 · BUILD THE PAGE</span>
        <h3>Write ordinary HTML and TypeScript</h3>
        <p>CSS works normally too. Run esbuild once to turn TypeScript into browser JavaScript.</p>
      </div>
      <div className="two-code-columns board-code-pair">
        <CodeBlock code={boardFrontendHtml} label="index.html" accent="ts" />
        <CodeBlock code={boardFrontendTypeScript} label="main.ts" accent="ts" />
      </div>

      <div className="board-code-heading">
        <span>STEP 2 · PLACE IT ON A BOARD</span>
        <h3>Point GraalyBoard at the compiled site</h3>
        <p>Local files are allowed. Network access stays off unless you add exact HTTPS hosts.</p>
      </div>
      <CodeBlock code={boardConfigCode} label="control-panel.yml" accent="yaml" />

      <div className="board-code-heading has-tabs">
        <div>
          <span>STEP 3 · CONNECT SERVER STATE</span>
          <h3>Use the same native Graaly API in every language</h3>
          <p>Publish JSON to one viewer, receive a typed action, validate it, then update the game.</p>
        </div>
        <GuideLanguageTabs value={language} onChange={setLanguage} />
      </div>
      <CodeBlock
        code={boardBridgeCode[language]}
        label={`website-board.${language === "py" ? "py" : language === "java" ? "java" : language}`}
        accent={language}
      />

      <div className="board-safety-strip">
        <div><strong>Per-viewer by default</strong><p>Each player gets independent DOM state, focus and controls.</p></div>
        <div><strong>Local-first</strong><p>Paths, symlinks, navigation and remote hosts are checked before loading.</p></div>
        <div><strong>Explicit dynamic code</strong><p>Keep <code>unsafe-eval</code> false. Enable it only for a trusted local UI runtime that compiles expressions.</p></div>
        <div><strong>No bundled browser</strong><p>Install Chrome or Chromium on the host; GraalyBoard does not redistribute it.</p></div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, children }: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <header className="section-heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{children}</p>
    </header>
  );
}

function CompatibilityContract() {
  return (
    <div className="compatibility-contract">
      <div className="compatibility-flow" aria-label="Graaly version translation flow">
        <div><span>YOUR PLUGIN</span><strong>One TS or Python API</strong><code>Materials.GRASS_BLOCK</code></div>
        <ArrowRight size={18} aria-hidden="true" />
        <div><span>GRAALY</span><strong>Version adapter</strong><code>contract {graalyContract.contractVersion}</code></div>
        <ArrowRight size={18} aria-hidden="true" />
        <div><span>SERVER</span><strong>{graalyContract.supportedGameVersions.minimum} → {graalyContract.supportedGameVersions.current}</strong><code>faithful native value</code></div>
      </div>

      <div className="compatibility-rules">
        <div><strong>Names never move</strong><p>The same imports, modules, properties, and canonical constants stay in autocomplete on every supported release.</p></div>
        <div><strong>Renames are internal</strong><p>Graaly maps historical names and method shapes inside its adapter. Plugin code never selects a server version.</p></div>
        <div><strong>No fake mechanics</strong><p>If an old release cannot represent a feature, Graaly reports it through <code>compatibility</code> and <code>GraalyUnsupportedFeature</code>.</p></div>
      </div>

      <div className="compatibility-proof">
        <div className="compatibility-totals">
          <span><strong>{stableModuleCount}</strong> stable modules</span>
          <span><strong>{stableConstantCount.toLocaleString("en-US")}</strong> canonical constants</span>
          <span><strong>{stableCapabilityEntries.length}</strong> explicit feature gates</span>
          <span><strong>0</strong> version imports</span>
        </div>
        <div className="two-code-columns">
          <CodeBlock
            label="portable.ts"
            accent="ts"
            code={[
              'import { Attributes, Materials, compatibility } from "graaly";',
              "",
              "const floor = Materials.GRASS_BLOCK; // same name everywhere",
              "",
              'if (compatibility.supports("attributes")) {',
              "  const health = Attributes.MAX_HEALTH;",
              "}",
            ].join("\n")}
          />
          <CodeBlock
            label="portable.py"
            accent="py"
            code={[
              "from graaly import Attributes, Materials, compatibility",
              "",
              "floor = Materials.GRASS_BLOCK  # same name everywhere",
              "",
              'if compatibility.supports("attributes"):',
              "    health = Attributes.MAX_HEALTH",
            ].join("\n")}
          />
        </div>
      </div>

      <details className="capability-details">
        <summary>See the mechanics that genuinely begin in a later release</summary>
        <div className="capability-list">
          {stableCapabilityEntries.map(([feature, version]) => (
            <div key={feature}><code>{feature}</code><span>available from {version}</span></div>
          ))}
        </div>
      </details>
    </div>
  );
}

function openCatalog(kind: CatalogKind, name: string, target = "api-reference") {
  window.dispatchEvent(new CustomEvent("graaly:open-api", {
    detail: { kind, name },
  }));
  document.querySelector(`#${target}`)?.scrollIntoView({ behavior: "smooth" });
}

function GuideExplorer({
  topics,
  label,
  placeholder,
  catalogTarget = "api-reference",
}: {
  topics: readonly GuideTopic[];
  label: string;
  placeholder: string;
  catalogTarget?: string;
}) {
  const [language, setLanguage] = useState<GuideLanguage>("ts");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(topics[0]?.id ?? "");
  const normalized = query.trim().toLowerCase();
  const matches = useMemo(() => topics.filter(topic => !normalized || [
    topic.title,
    topic.group,
    topic.summary,
    topic.when,
    topic.does,
    topic.javaEquivalent,
    ...topic.operations.flatMap(operation => [operation.native, operation.python, operation.java]),
  ].some(value => value.toLowerCase().includes(normalized))), [normalized, topics]);
  const selected = matches.find(topic => topic.id === selectedId) ?? matches[0];

  return (
    <div className="event-browser guide-browser" data-guide-browser={label.toLowerCase()}>
      <div className="event-browser-toolbar">
        <label className="inline-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search {label}</span>
          <input
            onChange={event => setQuery(event.target.value)}
            placeholder={placeholder}
            type="search"
            value={query}
          />
        </label>
        <GuideLanguageTabs value={language} onChange={setLanguage} />
      </div>
      <div className="event-browser-grid guide-browser-grid">
        <div className="event-index guide-index" role="listbox" aria-label={`${label} topics`}>
          <p className="result-count">{matches.length} practical guides</p>
          {matches.map(topic => (
            <button
              aria-selected={selected?.id === topic.id}
              className={selected?.id === topic.id ? "is-selected" : ""}
              key={topic.id}
              onClick={() => setSelectedId(topic.id)}
              role="option"
              type="button"
            >
              <span>
                <small className="guide-index-group">{topic.group}</small>
                <strong>{topic.title}</strong>
                <small>{topic.summary}</small>
              </span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          ))}
          {!matches.length && <p className="empty-state">No guide matches your search.</p>}
        </div>
        {selected && (
          <article className="event-detail guide-detail" key={`${selected.id}-${language}`}>
            <header className="event-detail-heading">
              <div>
                <span>{selected.group}</span>
                <h3>{selected.title}</h3>
              </div>
              <div className="event-flags">
                {selected.flags?.map(flag => <span key={flag}>{flag}</span>)}
                <span className="is-java-map">Java mapped</span>
              </div>
            </header>
            <div className="event-explanation">
              <div>
                <span>WHEN TO USE IT</span>
                <p>{selected.when}</p>
              </div>
              <div>
                <span>WHAT IT DOES</span>
                <p>{selected.does}</p>
              </div>
            </div>
            <div className="property-summary">
              <div>
                <span>YOU PROVIDE</span>
                <p>{selected.input}</p>
              </div>
              <div>
                <span>YOU GET</span>
                <p>{selected.output}</p>
              </div>
            </div>
            <div className="event-properties guide-operations" aria-label={`${selected.title} operations`}>
              {selected.operations.map((operation, index) => (
                <code key={`${selected.id}-${index}`}>
                  <span>{guideOperationForLanguage(operation, language)}</span>
                </code>
              ))}
            </div>
            <div className="java-correspondence">
              <div>
                <span>JAVA EQUIVALENT</span>
                <code>{selected.javaEquivalent}</code>
              </div>
              {language !== "java" && (
                <button onClick={() => setLanguage("java")} type="button">
                  View Java example <ArrowRight size={13} aria-hidden="true" />
                </button>
              )}
            </div>
            <CodeBlock
              accent={language}
              code={selected.code[language]}
              label={`${selected.id}.${language === "py" ? "py" : language === "java" ? "java" : language}`}
            />
            {selected.note && <p className="guide-note"><strong>Important:</strong> {selected.note}</p>}
            {selected.api && (
              <button
                className="guide-api-link"
                onClick={() => openCatalog(selected.api!.kind, selected.api!.name, catalogTarget)}
                type="button"
              >
                {selected.api.label} <ArrowRight size={14} aria-hidden="true" />
              </button>
            )}
          </article>
        )}
      </div>
    </div>
  );
}

function eventPropertyName(
  property: BukkitEventEntry["properties"][number],
  language: GuideLanguage,
  writable = false,
) {
  if (language === "java") return writable
    ? property.javaWrite ?? "read-only"
    : property.javaRead;
  return language === "py" ? property.pythonName : property.name;
}

const packetPurposeByName: Record<string, string> = {
  CHAT_MESSAGE: "The client submits a chat message to the server.",
  CLIENT_STATUS: "The client reports a gameplay status action such as respawning or requesting statistics.",
  CLOSE_WINDOW: "The client closes an open inventory window.",
  INTERACT_ENTITY: "The client interacts with, attacks, or targets an entity.",
  KEEP_ALIVE: "One side answers the connection heartbeat used to detect timeouts and latency.",
  PLAYER_POSITION: "The client reports a new player position.",
  PLAYER_POSITION_AND_ROTATION: "The client reports a new position together with yaw and pitch.",
  PLAYER_ROTATION: "The client reports new yaw and pitch values.",
  PLUGIN_MESSAGE: "One side sends a custom plugin-channel payload.",
  UPDATE_HEALTH: "The server updates the client health, food level, and saturation display.",
  WINDOW_ITEMS: "The server replaces the item contents of an inventory window.",
  SET_SLOT: "The server changes one slot in a client inventory window.",
  SPAWN_ENTITY: "The server tells the client to create an entity.",
  DESTROY_ENTITIES: "The server tells the client to remove one or more entities.",
  ENTITY_METADATA: "The server updates synchronized metadata for an entity.",
  ENTITY_VELOCITY: "The server updates an entity's client-side velocity.",
  TELEPORT_ENTITY: "The server teleports an entity on the client.",
};

function packetExplanation(entry: CatalogEntry) {
  const direction = entry.javaName.includes(".Server.") ? "server to client" : "client to server";
  return packetPurposeByName[entry.name]
    ?? `This ${direction} packet represents “${entry.name.toLowerCase().replaceAll("_", " ")}” in the Minecraft protocol.`;
}

function EventExplorer() {
  const [language, setLanguage] = useState<GuideLanguage>("ts");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedName, setSelectedName] = useState("BlockBreakEvent");
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of bukkitEventCatalog) {
      counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
    }
    return [...counts].sort(([left], [right]) =>
      (eventCategoryNames[left] ?? left).localeCompare(eventCategoryNames[right] ?? right, "en"),
    );
  }, []);
  const normalized = query.trim().toLowerCase();
  const matches = useMemo(() => bukkitEventCatalog.filter(entry => {
    if (category !== "all" && entry.category !== category) return false;
    if (!normalized) return true;
    return [
      entry.name,
      eventWhen(entry),
      eventCategoryNames[entry.category] ?? entry.category,
      ...entry.properties.flatMap(property => [property.name, property.pythonName, property.javaType]),
    ].some(value => value.toLowerCase().includes(normalized));
  }), [category, normalized]);
  const selected = matches.find(entry => entry.name === selectedName) ?? matches[0];

  function changeCategory(next: string) {
    setCategory(next);
    const first = bukkitEventCatalog.find(entry => next === "all" || entry.category === next);
    if (first) setSelectedName(first.name);
  }

  return (
    <div className="event-browser">
      <div className="event-browser-toolbar">
        <label className="inline-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search Graaly events</span>
          <input
            onChange={event => setQuery(event.target.value)}
            placeholder="Search PlayerMoveEvent, block, damage…"
            type="search"
            value={query}
          />
        </label>
        <GuideLanguageTabs value={language} onChange={setLanguage} />
      </div>
      <div className="event-category-strip" aria-label="Event categories">
        <button className={category === "all" ? "is-active" : ""} onClick={() => changeCategory("all")} type="button">
          All <span>{bukkitEventCatalog.length}</span>
        </button>
        {categories.map(([id, count]) => (
          <button className={category === id ? "is-active" : ""} key={id} onClick={() => changeCategory(id)} type="button">
            {eventCategoryNames[id] ?? id} <span>{count}</span>
          </button>
        ))}
      </div>
      <div className="event-browser-grid">
        <div className="event-index" role="listbox" aria-label="Graaly events">
          <p className="result-count">{matches.length} events</p>
          {matches.map(entry => (
            <button
              aria-selected={selected?.name === entry.name}
              className={selected?.name === entry.name ? "is-selected" : ""}
              key={entry.javaName}
              onClick={() => setSelectedName(entry.name)}
              role="option"
              type="button"
            >
              <span>
                <strong>{entry.name}</strong>
                <small>{eventWhen(entry)}</small>
              </span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          ))}
          {!matches.length && <p className="empty-state">No event matches these filters.</p>}
        </div>
        {selected && (
          <article className="event-detail" key={selected.javaName}>
            <header className="event-detail-heading">
              <div>
                <span>{eventCategoryNames[selected.category] ?? selected.category}</span>
                <h3>{selected.name}</h3>
              </div>
              <div className="event-flags">
                <span className={selected.cancellable ? "is-cancellable" : ""}>
                  {selected.cancellable ? "Can be cancelled" : "Notification event"}
                </span>
                <span>{selected.name.startsWith("Async") ? "Async thread" : "Main thread"}</span>
              </div>
            </header>
            <div className="event-explanation">
              <div>
                <span>WHEN IT FIRES</span>
                <p>{eventWhen(selected)}</p>
              </div>
              <div>
                <span>WHAT TO USE IT FOR</span>
                <p>{eventUse(selected)}</p>
              </div>
            </div>
            <div className="property-summary">
              <div>
                <span>READ</span>
                <p>{selected.properties.length
                  ? selected.properties.map(property => eventPropertyName(property, language)).join(", ")
                  : "Base Event properties only"}</p>
              </div>
              <div>
                <span>CHANGE</span>
                <p>{selected.properties.some(property => property.writable)
                  ? selected.properties.filter(property => property.writable).map(property => eventPropertyName(property, language, true)).join(", ")
                  : "Nothing. This event is read-only."}</p>
              </div>
            </div>
            <div className="event-properties" aria-label={`${selected.name} properties`}>
              {selected.properties.map(property => (
                <code key={property.name}>
                  <span>{eventPropertyName(property, language)}</span>
                  <small>{language === "java" ? property.javaType : language === "py" ? property.pythonType : property.typeScriptType}</small>
                  {property.writable && <b>editable</b>}
                </code>
              ))}
            </div>
            <div className="java-correspondence">
              <div>
                <span>JAVA EQUIVALENT</span>
                <code>{selected.name} · @EventHandler</code>
              </div>
              {language !== "java" && (
                <button onClick={() => setLanguage("java")} type="button">
                  View Java listener <ArrowRight size={13} aria-hidden="true" />
                </button>
              )}
            </div>
            <CodeBlock
              accent={language}
              code={eventExample(selected, language)}
              label={`${selected.name}.${language === "py" ? "py" : language === "java" ? "java" : language}`}
            />
            <details className="advanced-mapping">
              <summary>Advanced: runtime mapping and full inherited API</summary>
              <p>Graaly maps this event directly to its Java listener type.</p>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("graaly:open-api", {
                    detail: { kind: "bukkit", name: selected.name },
                  }));
                  document.querySelector("#api-reference")?.scrollIntoView({ behavior: "smooth" });
                }}
                type="button"
              >
                Open {selected.name} in the API reference <ArrowRight size={14} aria-hidden="true" />
              </button>
            </details>
          </article>
        )}
      </div>
    </div>
  );
}

function ApiTypeDetail({
  catalogEntries,
  entry,
  kind,
}: {
  catalogEntries: CatalogEntries;
  entry: CatalogEntry;
  kind: CatalogKind;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MemberFilter>("all");
  const [primaryLanguage, setPrimaryLanguage] = useState<Language>("ts");
  const members = useMemo(
    () => resolveCatalogMembers(catalogEntries, kind, entry),
    [catalogEntries, entry, kind],
  );
  const normalized = query.trim().toLowerCase();
  const serverPacket = kind === "packets" && entry.javaName.includes(".Server.");
  const listenerMethod = serverPacket ? "onSend" : "onReceive";
  const pythonListener = serverPacket ? "listen_send" : "listen_receive";
  const filtered = members.filter(member => {
    if (filter !== "all" && memberGroup(member.kind) !== filter) return false;
    return !normalized || [member.name, member.java, member.typeScript, member.python, member.declaredBy]
      .some(value => value.toLowerCase().includes(normalized));
  });

  return (
    <article className="api-detail">
      <header>
        <div>
          <span>{catalogLabels.find(label => label.id === kind)?.label}</span>
          <h3><code>{entry.usage}</code></h3>
          <p>{kind === "bukkit" ? `Graaly type · ${simpleTypeName(entry.javaName)}` : entry.javaName}</p>
        </div>
        <LanguageTabs value={primaryLanguage} onChange={setPrimaryLanguage} compact />
      </header>
      <div className="api-import">
        <span>USE IT</span>
        <code>{importStatement(entry, primaryLanguage)}</code>
      </div>
      {!!entry.parents.length && <p className="inherits"><strong>Extends</strong> {entry.parents.join(" · ")}</p>}
      {!members.length && kind === "packets" ? (
        <div className="constant-usage">
          <div className="event-explanation packet-explanation">
            <div>
              <span>DIRECTION</span>
              <p>{serverPacket ? "Server → client" : "Client → server"}</p>
            </div>
            <div>
              <span>WHAT IT MEANS</span>
              <p>{packetExplanation(entry)}</p>
            </div>
          </div>
          <div className="java-correspondence">
            <div>
              <span>JAVA / PACKETEVENTS EQUIVALENT</span>
              <code>PacketType.{entry.javaName}</code>
            </div>
          </div>
          <CodeBlock
            accent={primaryLanguage}
            label={`packet-${serverPacket ? "send" : "receive"}-filter.${primaryLanguage === "py" ? "py" : primaryLanguage}`}
            code={primaryLanguage === "py"
              ? `${importStatement(entry, "py")}\n\n@packets.${pythonListener}(${entry.usage})\ndef handle(context):\n    info(context.packet_name)  # writes to this plugin's logger`
              : `${importStatement(entry, primaryLanguage)}\n\npackets.${listenerMethod}(${entry.usage}, context => {\n  info(context.packetName); // writes to this plugin's logger\n});`}
          />
        </div>
      ) : !members.length ? (
        <div className="empty-type">
          <p>This type has no cataloged public members. Use its Java mapping above when a method accepts this marker or base type.</p>
          <div className="java-correspondence">
            <div>
              <span>JAVA TYPE</span>
              <code>{kind === "bukkit" ? simpleTypeName(entry.javaName) : entry.javaName}</code>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="member-tools">
            <label className="inline-search">
              <Search size={15} aria-hidden="true" />
              <span className="sr-only">Search members of {entry.name}</span>
              <input
                onChange={event => setQuery(event.target.value)}
                placeholder={`Search ${entry.name}: health, teleport, send…`}
                type="search"
                value={query}
              />
            </label>
            <div className="member-filter" role="group" aria-label="Member type">
              {memberFilters.map(candidate => (
                <button
                  aria-pressed={filter === candidate.id}
                  className={filter === candidate.id ? "is-active" : ""}
                  key={candidate.id}
                  onClick={() => setFilter(candidate.id)}
                  type="button"
                >
                  {candidate.label}
                </button>
              ))}
            </div>
          </div>
          <p className="member-count">
            {filtered.length} of {members.length} signatures · {members.filter(member => member.inherited).length} inherited
          </p>
          <div className="member-list">
            {filtered.map((member, index) => (
              <div key={`${member.kind}-${member.declaredBy}-${member.name}-${index}`}>
                <span className="member-meta">
                  <strong>{member.kind}</strong>
                  <small>{member.inherited ? `from ${member.declaredBy}` : "declared here"}</small>
                </span>
                <span className="member-signatures">
                  <code className={primaryLanguage === "ts" ? "is-primary" : ""}>
                    <b>TS</b>{callableSignature(entry, member, "ts")}
                  </code>
                  <code className={primaryLanguage === "py" ? "is-primary" : ""}>
                    <b>PY</b>{callableSignature(entry, member, "py")}
                  </code>
                  {primaryLanguage === "js" && (
                    <code className="is-primary"><b>JS</b>{callableSignature(entry, member, "js")}</code>
                  )}
                  <code className="is-java-signature"><b>JAVA</b>{javaCallableSignature(entry, member)}</code>
                </span>
              </div>
            ))}
            {!filtered.length && <p className="empty-state">No signature matches this filter.</p>}
          </div>
        </>
      )}
    </article>
  );
}

const allCatalogKinds: readonly CatalogKind[] = ["bukkit", "wrappers", "support", "packets"];
const packetCatalogKinds: readonly CatalogKind[] = ["packets", "wrappers", "support"];

function ApiExplorer({
  kinds = allCatalogKinds,
  initialKind = "bukkit",
  searchPlaceholder = "Search Player, Material, CHAT_MESSAGE, health…",
  label = "API",
}: {
  kinds?: readonly CatalogKind[];
  initialKind?: CatalogKind;
  searchPlaceholder?: string;
  label?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingSelection = useRef<{ kind: CatalogKind; name: string } | null>(null);
  const [catalogEntries, setCatalogEntries] = useState<CatalogEntries | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [kind, setKind] = useState<CatalogKind>(initialKind);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(32);
  const [selectedKey, setSelectedKey] = useState("");
  const normalized = query.trim().toLowerCase();
  const matches = useMemo(() => {
    const pool = catalogEntries?.[kind] ?? [];
    return pool.filter(entry =>
      !normalized || [
        entry.name,
        entry.javaName,
        entry.usage,
        ...entry.parents,
        ...entry.members.flatMap(member => [member.name, member.java, member.typeScript, member.python]),
      ].some(value => value.toLowerCase().includes(normalized)),
    );
  }, [catalogEntries, kind, normalized]);
  const selected = matches.find(entry => entry.javaName === selectedKey) ?? matches[0];
  const visible = selected && !matches.slice(0, limit).includes(selected)
    ? [selected, ...matches.slice(0, Math.max(0, limit - 1))]
    : matches.slice(0, limit);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || shouldLoad) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      setShouldLoad(true);
      observer.disconnect();
    }, { rootMargin: "600px 0px" });
    observer.observe(root);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || catalogEntries) return;
    let active = true;
    import("./generated-api-reference").then(source => {
      if (active) setCatalogEntries(buildCatalogEntries(source));
    });
    return () => { active = false; };
  }, [catalogEntries, shouldLoad]);

  useEffect(() => {
    if (!catalogEntries) return;
    const pending = pendingSelection.current;
    const nextKind = pending?.kind ?? initialKind;
    const entries = catalogEntries[nextKind];
    const entry = pending
      ? entries.find(candidate => candidate.name === pending.name)
      : entries.find(candidate => candidate.name === defaultCatalogEntry[nextKind]) ?? entries[0];
    setKind(nextKind);
    setSelectedKey(entry?.javaName ?? "");
    if (pending) setQuery(pending.name);
    pendingSelection.current = null;
  }, [catalogEntries, initialKind]);

  useEffect(() => {
    function openApi(event: Event) {
      const detail = (event as CustomEvent<{ kind?: CatalogKind; name?: string }>).detail;
      if (!detail?.kind || !detail.name) return;
      if (!kinds.includes(detail.kind)) return;
      pendingSelection.current = { kind: detail.kind, name: detail.name };
      setShouldLoad(true);
      if (!catalogEntries) return;
      const entry = catalogEntries[detail.kind].find(candidate => candidate.name === detail.name);
      if (!entry) return;
      setKind(detail.kind);
      setQuery(detail.name);
      setSelectedKey(entry.javaName);
      setLimit(32);
      pendingSelection.current = null;
    }
    window.addEventListener("graaly:open-api", openApi);
    return () => window.removeEventListener("graaly:open-api", openApi);
  }, [catalogEntries, kinds]);

  function changeKind(next: CatalogKind) {
    if (!catalogEntries) return;
    setKind(next);
    setQuery("");
    setLimit(32);
    const entry = catalogEntries[next].find(candidate => candidate.name === defaultCatalogEntry[next]) ?? catalogEntries[next][0];
    setSelectedKey(entry?.javaName ?? "");
  }

  return (
    <div className="api-browser" data-api-browser={label.toLowerCase()} ref={rootRef}>
      {!catalogEntries ? (
        <div className="catalog-loader" role="status">
          <span aria-hidden="true" />
          <div><strong>Loading the complete searchable catalog</strong><small>Kept out of the initial page so navigation and scrolling stay fast.</small></div>
        </div>
      ) : <>
      <div className="api-browser-toolbar">
        <div className="catalog-tabs" role="tablist" aria-label="API catalog">
          {catalogLabels.filter(candidate => kinds.includes(candidate.id)).map(candidate => (
            <button
              aria-selected={kind === candidate.id}
              className={kind === candidate.id ? "is-active" : ""}
              key={candidate.id}
              onClick={() => changeKind(candidate.id)}
              role="tab"
              type="button"
            >
              {candidate.short}<span>{catalogEntries[candidate.id].length}</span>
            </button>
          ))}
        </div>
        <label className="inline-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search {label}</span>
          <input
            onChange={event => {
              setQuery(event.target.value);
              setLimit(32);
            }}
            placeholder={searchPlaceholder}
            type="search"
            value={query}
          />
        </label>
      </div>
      <div className="api-browser-grid">
        <div className="api-index" role="listbox" aria-label={`${label} types`}>
          <p className="result-count">{matches.length} symbols</p>
          {visible.map(entry => (
            <button
              aria-selected={selected?.javaName === entry.javaName}
              className={selected?.javaName === entry.javaName ? "is-selected" : ""}
              key={`${kind}-${entry.javaName}`}
              onClick={() => setSelectedKey(entry.javaName)}
              role="option"
              type="button"
            >
              <code>{entry.usage}</code>
              <small>{resolveCatalogMembers(catalogEntries, kind, entry).length} signatures</small>
            </button>
          ))}
          {visible.length < matches.length && (
            <button className="show-more" onClick={() => setLimit(current => current + 48)} type="button">
              Show 48 more
            </button>
          )}
          {!visible.length && <p className="empty-state">No API symbol matches your search.</p>}
        </div>
        {selected && <ApiTypeDetail catalogEntries={catalogEntries} entry={selected} kind={kind} key={`${kind}-${selected.javaName}`} />}
      </div>
      </>}
    </div>
  );
}

function HomeSearch({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [catalogEntries, setCatalogEntries] = useState<CatalogEntries | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalized = query.trim().toLowerCase();
  const guideItems = navigation.flatMap(group => group.items.map(item => ({
    kind: "guide" as const,
    id: item.id,
    name: item.title,
    detail: group.label,
  })));
  const apiItems = catalogEntries ? catalogLabels.flatMap(label => catalogEntries[label.id].map(entry => ({
    kind: "api" as const,
    id: "api-reference",
    name: entry.usage,
    detail: label.label,
    catalogKind: label.id,
    catalogName: entry.name,
    searchText: `${entry.name} ${entry.usage} ${entry.javaName} ${entry.members.flatMap(member => [member.name, member.java]).join(" ")}`.toLowerCase(),
  }))) : [];
  const results = normalized
    ? [...guideItems, ...apiItems].filter(item =>
      `${item.name} ${item.detail} ${"searchText" in item ? item.searchText : ""}`.toLowerCase().includes(normalized),
    ).slice(0, 24)
    : guideItems.slice(0, 10);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open || catalogEntries) return;
    let active = true;
    import("./generated-api-reference").then(source => {
      if (active) setCatalogEntries(buildCatalogEntries(source));
    });
    return () => { active = false; };
  }, [catalogEntries, open]);

  if (!open) return null;
  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search documentation">
      <div className="search-dialog">
        <label>
          <Search size={18} aria-hidden="true" />
          <input
            onChange={event => setQuery(event.target.value)}
            placeholder="Search guides, types, methods, events, packets…"
            ref={inputRef}
            type="search"
            value={query}
          />
          <button aria-label="Close search" onClick={() => setOpen(false)} type="button"><X size={18} /></button>
        </label>
        <p>{results.length} results</p>
        <div className="search-results">
          {results.map((item, index) => (
            <a
              href={`#${item.id}`}
              key={`${item.kind}-${item.name}-${index}`}
              onClick={() => {
                if (item.kind === "api") {
                  window.dispatchEvent(new CustomEvent("graaly:open-api", {
                    detail: { kind: item.catalogKind, name: item.catalogName },
                  }));
                }
                setOpen(false);
              }}
            >
              <span><strong>{item.name}</strong><small>{item.detail}</small></span>
              <ArrowRight size={15} aria-hidden="true" />
            </a>
          ))}
          {!results.length && <p className="empty-state">No result. Try a type or method name.</p>}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [language, setLanguage] = useState<QuickstartLanguage>("ts");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [activeSection, setActiveSection] = useState("overview");
  const activeSectionIndex = documentationSections.findIndex(item => item.id === activeSection);
  const previousSection = activeSectionIndex > 0 ? documentationSections[activeSectionIndex - 1] : null;
  const nextSection = activeSectionIndex >= 0 && activeSectionIndex < documentationSections.length - 1
    ? documentationSections[activeSectionIndex + 1]
    : null;

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem("graaly-docs-theme");
    } catch {
      // Storage can be disabled without preventing the documentation from rendering.
    }
    const initial: Theme = stored === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = initial;
    const frame = window.requestAnimationFrame(() => setTheme(initial));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let scrollFrame = 0;

    function selectSectionFromLocation() {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      let section = hash || "overview";
      if (!documentationSectionIds.has(section)) {
        const owner = document.getElementById(section)?.closest<HTMLElement>("section[id]")?.id;
        section = owner && documentationSectionIds.has(owner) ? owner : "overview";
      }
      setActiveSection(section);
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(() => {
        const target = document.getElementById(hash || section) ?? document.getElementById(section);
        if (!target) return;
        const stickyOffset = window.matchMedia("(max-width: 760px)").matches ? 104 : 113;
        const top = target.getBoundingClientRect().top + window.scrollY - stickyOffset;
        window.scrollTo({ top: Math.max(0, top), left: 0, behavior: "auto" });
      });
    }

    selectSectionFromLocation();
    window.addEventListener("hashchange", selectSectionFromLocation);
    return () => {
      window.cancelAnimationFrame(scrollFrame);
      window.removeEventListener("hashchange", selectSectionFromLocation);
    };
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("graaly-docs-theme", next);
    } catch {
      // Keep the current-page theme even when persistence is unavailable.
    }
    setTheme(next);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (event.key === "/" && !editing) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-is-open", menuOpen || searchOpen);
    return () => document.body.classList.remove("menu-is-open");
  }, [menuOpen, searchOpen]);

  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <header className="topbar">
        <a className="brand" href="#overview" aria-label="Graaly documentation home">
          {/* A relative asset path works on both GitHub Pages and the hosted root. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="brand-logo" height="36" src="./graaly-logo-96.png" width="36" />
          <span><strong>Graaly</strong></span>
          <span className="docs-badge">Docs</span>
        </a>
        <nav className="topnav" aria-label="Primary navigation">
          <a href="#prerequisites">Get started</a>
          <a href="#learn">Learn</a>
          <a href="#events">Events</a>
          <a href="#worlds">Worlds</a>
          <a href="#react-ui">React UI</a>
          <a href="#academy">Academy</a>
          <a href="#packets">Packets</a>
          <a href="#api-reference">API</a>
        </nav>
        <button className="search-button" aria-label="Search documentation" onClick={() => setSearchOpen(true)} type="button">
          <Search size={16} aria-hidden="true" /><span>Search docs</span><kbd>/</kbd>
        </button>
        <button className="theme-button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={toggleTheme} type="button">
          {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>
        <button className="menu-button" aria-label="Open navigation" onClick={() => setMenuOpen(true)} type="button">
          <Menu size={20} />
        </button>
      </header>

      <div className="docs-meta-bar">
        <div>
          <span>Code language</span>
          <div className="global-language-tabs" role="group" aria-label="Default quick-start language">
            {quickstartLanguages.map(item => (
              <button
                aria-pressed={language === item.id}
                className={language === item.id ? "is-active" : ""}
                key={item.id}
                onClick={() => setLanguage(item.id)}
                type="button"
              >
                {item.id.toUpperCase()}
              </button>
            ))}
          </div>
          <span className="catalog-count">{catalogCounts.events} events · {catalogCounts.api} API symbols · {catalogCounts.packetWrappers} wrappers</span>
        </div>
      </div>

      <div className="docs-layout">
        <aside className={menuOpen ? "sidebar is-open" : "sidebar"} aria-label="Documentation sections">
          <div className="sidebar-mobile-head">
            <strong>Documentation</strong>
            <button aria-label="Close navigation" onClick={() => setMenuOpen(false)} type="button"><X size={19} /></button>
          </div>
          {navigation.map(group => (
            <div className="nav-group" key={group.label}>
              <span>{group.label}</span>
              {group.items.map(item => (
                <a
                  aria-current={activeSection === item.id ? "page" : undefined}
                  href={`#${item.id}`}
                  key={item.id}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.title}
                </a>
              ))}
            </div>
          ))}
        </aside>

        <main id="content">
          <section className="hero" hidden={activeSection !== "overview"} id="overview">
            <div className="hero-copy">
              <span className="hero-kicker">Graaly documentation</span>
              <h1>Minecraft plugins in TypeScript, JavaScript, and Python.</h1>
              <p>
                Use one language-native API from Minecraft {graalyContract.supportedGameVersions.minimum} through {graalyContract.supportedGameVersions.current}.
                Graaly handles release differences and downloads verified language runtimes only when they are needed.
              </p>
              <div className="hero-actions">
                <a className="primary-button" href="#prerequisites">Check prerequisites <ArrowRight size={16} /></a>
                <a className="secondary-button" href="#api-reference">Browse the API</a>
              </div>
            </div>
            <dl className="hero-facts" aria-label="Graaly compatibility summary">
              <div><dt>Server versions</dt><dd>{graalyContract.supportedGameVersions.minimum} → {graalyContract.supportedGameVersions.current}</dd></div>
              <div><dt>Java</dt><dd>17 or newer</dd></div>
              <div><dt>Plugin languages</dt><dd>TypeScript · JavaScript · Python</dd></div>
              <div><dt>Runtime</dt><dd>Downloaded on demand and SHA-256 verified</dd></div>
            </dl>
          </section>

          <section className="doc-section prerequisites-section" hidden={activeSection !== "prerequisites"} id="prerequisites">
            <SectionHeading eyebrow="01 · Prerequisites" title="Install the runtime once. Write plugins in your language.">
              Start here before copying an example. Graaly itself runs on Java 17 or newer; choose a JVM version that also satisfies your server release. Node.js and Python are development tools, not separate in-server runtimes.
            </SectionHeading>
            <div className="prerequisite-grid">
              <article>
                <span>Required</span>
                <h3>Server and Java</h3>
                <ul>
                  <li><strong>Java 17 or newer</strong> for building and running Graaly.</li>
                  <li>A plugin-capable server from <strong>1.7.10 through 26.2</strong>.</li>
                  <li>The legacy-launcher agent from the release only when an old launcher rejects your modern JVM.</li>
                </ul>
              </article>
              <article>
                <span>TypeScript / JavaScript</span>
                <h3>Editor and build tools</h3>
                <ul>
                  <li><strong>Node.js 22.13+</strong> and npm for autocomplete, tests, and bundling.</li>
                  <li>TypeScript plugins compile to one ESM <code>.mjs</code> entry file.</li>
                  <li>Server code imports only from <code>graaly</code> or <code>@graaly/react</code>.</li>
                </ul>
              </article>
              <article>
                <span>Python</span>
                <h3>Native Python workflow</h3>
                <ul>
                  <li><strong>Python 3.12+</strong> for Pyright, tests, FastAPI, and local tooling.</li>
                  <li>GraalPy is downloaded and SHA-256 verified by Graaly; no system Python process executes the plugin.</li>
                  <li>Use ordinary modules, decorators, type hints, exceptions, and <code>async</code>/<code>await</code>.</li>
                </ul>
              </article>
              <article>
                <span>Optional integrations</span>
                <h3>Add only what you use</h3>
                <ul>
                  <li><strong>PacketEvents 2.13.0</strong> remains a separately installed plugin.</li>
                  <li>React 19 is optional for inventory, scoreboard, boss bar, tab, and message UI.</li>
                  <li>FastAPI, Pydantic, SQLAlchemy, and a database are optional service-layer tools.</li>
                </ul>
              </article>
            </div>
            <div className="prerequisite-install">
              <div><span>1</span><p>Download <code>Graaly-1.0.0.jar</code> and, only for historical launchers, the matching legacy-launcher agent.</p></div>
              <div><span>2</span><p>Place only the runtime JAR in <code>plugins/</code>; keep server and PacketEvents JARs separate.</p></div>
              <div><span>3</span><p>Start once. Graaly downloads the enabled runtimes to <code>plugins/Graaly/runtime/25.2.4/</code>, then loads bundles from <code>plugins/Graaly/scripts/</code>.</p></div>
            </div>
            <div className="runtime-config-card">
              <div>
                <span className="section-kicker">First-start configuration</span>
                <h3>Small, pinned, and offline-ready</h3>
                <p>
                  GraalJS and GraalPy are not inside the plugin JAR. Graaly downloads only the enabled languages from Maven Central,
                  checks exact size and SHA-256, and reuses the verified cache on every restart.
                </p>
                <ul>
                  <li>Disable a language if this server will never load its bundles.</li>
                  <li>For an offline server, pre-populate the versioned cache and set <code>auto-download</code> to <code>false</code>.</li>
                  <li>An invalid cached file is quarantined and never executed.</li>
                </ul>
              </div>
              <CodeBlock code={`runtime:\n  auto-download: true\n  languages:\n    javascript: true\n    python: true\n  connect-timeout-seconds: 20\n  request-timeout-seconds: 180\n  retry-attempts: 2`} label="plugins/Graaly/config.yml" accent="yaml" />
            </div>
            <div className="note-line warning">
              The first online start needs outbound HTTPS unless the verified cache was copied beforehand. No server, PacketEvents, GraalJS, or GraalPy JAR is redistributed with this project.
            </div>
            <div className="note-line warning">
              Java 17 is Graaly&apos;s functional minimum; each server release may require a newer JVM. With Graal 25.2.4, Java 25 uses the optimized execution path. Java 17–24 and Java 26 pass the same API contract but use the interpreter fallback and can run guest code more slowly.
            </div>
          </section>

          <section className="doc-section intro-section" hidden={activeSection !== "compatibility"} id="compatibility">
            <SectionHeading eyebrow="02 · Compatibility contract" title="Write once. Graaly translates every supported release.">
              Your public imports and autocomplete stay fixed from {graalyContract.supportedGameVersions.minimum} to {graalyContract.supportedGameVersions.current}.
              Version-specific names, signatures, and fallbacks live behind Graaly&apos;s adapter boundary.
            </SectionHeading>
            <CompatibilityContract />
          </section>

          <section className="doc-section" hidden={activeSection !== "quickstart"} id="quickstart">
            <SectionHeading eyebrow="03 · Quick start" title="Build Graaly plugins">
              Install Graaly once, create one plugin bundle, copy it to the documented server directory, and verify that
              the loader discovered it. Every path below is executable, not just illustrative.
            </SectionHeading>
            <GraalyRuntimeInstallGuide />
            <div className="quickstart-guide-heading quickstart-language-heading">
              <span>2 · WRITE THE PLUGIN</span>
              <div>
                <h3>Choose the language you will deploy</h3>
                <p>The selected tab changes the source, manifest, build command, destination directory, and load instructions together.</p>
              </div>
            </div>
            <QuickstartLanguageTabs value={language} onChange={setLanguage} />
            <div className="two-code-columns">
              <CodeBlock code={pluginYaml[language]} label="plugin.yml" accent="yaml" />
              <CodeBlock
                code={quickstartCode[language]}
                label={language === "java" ? "WelcomePlugin.java" : language === "py" ? "main.py" : language === "ts" ? "src/main.mts" : "main.mjs"}
                accent={language}
              />
            </div>
            <div className="note-line">
              <Zap size={16} aria-hidden="true" /> JavaScript and TypeScript deploy compiled ESM, not <code>node_modules</code>. Python deploys source and runs on GraalPy. Java deploys a compiled JAR.
            </div>
            <QuickstartDeploymentGuide language={language} />
          </section>

          <section className="doc-section learn-section" hidden={activeSection !== "learn"} id="learn">
            <SectionHeading eyebrow="04 · Learn the languages" title="Learn the language, not a Graaly dialect">
              Graaly gives ordinary language constructs useful game-server data. Follow one path at a time, copy the complete example,
              then recognize what belongs to the language, what belongs to Graaly, and what only exists in a browser or Node.js environment.
            </SectionHeading>
            <LanguageLearningGuide />
          </section>

          <section className="doc-section" hidden={activeSection !== "events"} id="events">
            <SectionHeading eyebrow="05 · Events" title="Know exactly when your code runs">
              An event is a notification from the server. Pick the event that describes the moment you care about, register a listener,
              read its data, then optionally change or cancel the action.
            </SectionHeading>
            <div className="event-mental-model">
              <div><span>1</span><strong>The server detects an action</strong><p>A player moves, a block breaks, an entity takes damage, or a world loads.</p></div>
              <div><span>2</span><strong>Your listener runs</strong><p>The callback receives one typed event object. No string resolver is needed.</p></div>
              <div><span>3</span><strong>You decide</strong><p>Read properties, change editable values, or set <code>cancelled</code> when supported.</p></div>
            </div>
            <EventExplorer />
          </section>

          <section className="doc-section" hidden={activeSection !== "commands"} id="commands">
            <SectionHeading eyebrow="06 · Commands & tasks" title="Find the command or scheduler job you need">
              Search by goal, choose a task, and see what it does before the code. Every guide includes native JS, TS, and Python
              plus the exact Java pattern it replaces.
            </SectionHeading>
            <GuideExplorer
              label="Commands and tasks"
              placeholder="Search command, completion, delay, repeat, async…"
              topics={commandTopics}
            />
          </section>

          <section className="doc-section" hidden={activeSection !== "players"} id="players">
            <SectionHeading eyebrow="07 · Players" title="Every common Player workflow in one searchable browser">
              Find players, message them, change inventory or health, teleport, control movement, permissions, scoreboards,
              metadata, time, and weather. The complete inherited Player catalog remains one click away.
            </SectionHeading>
            <GuideExplorer
              label="Player API"
              placeholder="Search message, inventory, health, teleport, permission…"
              topics={playerTopics}
            />
          </section>

          <section className="doc-section" hidden={activeSection !== "worlds"} id="worlds">
            <SectionHeading eyebrow="08 · Worlds" title="Locations, terrain, lifecycle, and generation, explained task by task">
              Location is now a first-class guide beside blocks, chunks, time, weather, spawn rules, effects, world creation,
              custom generators, populators, saving, and unloading.
            </SectionHeading>
            <GuideExplorer
              label="World API"
              placeholder="Search location, block, chunk, weather, generator, unload…"
              topics={worldTopics}
            />
          </section>

          <section className="doc-section" hidden={activeSection !== "entities"} id="entities">
            <SectionHeading eyebrow="09 · Entities" title="Spawn, customize, move, power, and clean up entities">
              Search the exact action you need. The attribute guide includes all {graalyConstants.namespaces.Attribute.constants.length} canonical attributes
              from the current contract and tells you which releases can represent each mechanic faithfully.
            </SectionHeading>
            <GuideExplorer
              label="Entity API"
              placeholder="Search spawn, custom name, speed, strength, target, remove…"
              topics={entityTopics}
            />
          </section>

          <section className="doc-section react-ui-section" hidden={activeSection !== "react-ui"} id="react-ui">
            <SectionHeading eyebrow="10 · React UI & FastAPI" title="Use real React for game UI and Python for persistent services">
              Follow the animated IDE from the first React root to a tested FastAPI transaction. Every lesson explains the code,
              how it differs from browser React, why that boundary was chosen, which simpler alternative exists, and when the
              additional architecture becomes justified.
            </SectionHeading>
            <ReactFastApiGuide />
          </section>

          <section className="doc-section academy-section" hidden={activeSection !== "academy"} id="academy">
            <SectionHeading eyebrow="11 · Graaly Academy" title="From your first component to a production realtime plugin">
              These are 36 long-form lessons, not a list of snippets. Edit and execute real TypeScript React against a
              Minecraft surface simulator, trace the FastAPI request lifecycle, and then run the same
              architecture in the checked-in plugin and backend tests.
            </SectionHeading>
            <GraalyAcademy />
          </section>

          <section className="doc-section board-section" hidden={activeSection !== "boards"} id="boards">
            <SectionHeading eyebrow="12 · Website boards" title="Website boards are coming soon.">
              The board renderer is still experimental and is not part of Graaly&apos;s stable public contract yet.
              Documentation and examples will return when rendering, input, scrolling, and lifecycle behavior are ready to support.
            </SectionHeading>
            <p className="availability-note"><strong>Status:</strong> planned, not available in the current release.</p>
          </section>

          <section className="doc-section" hidden={activeSection !== "packets"} id="packets">
            <SectionHeading eyebrow="13 · PacketEvents" title="Learn the workflow, then search every packet and wrapper">
              PacketEvents stays a separate 2.13.0 plugin. Start with practical receive, send, wrapper, cancellation, player-data,
              and threading guides; then search every client packet, server packet, wrapper, and supporting type below, including
              <code> ClientPacket.CHAT_MESSAGE</code>, <code>ServerPacket.UPDATE_HEALTH</code>, and
              <code> WrapperPlayServerUpdateHealth</code>.
            </SectionHeading>
            <GuideExplorer
              catalogTarget="packet-catalog"
              label="PacketEvents workflows"
              placeholder="Search receive, send, wrapper, cancel, ping, thread…"
              topics={packetTopics}
            />
            <div className="catalog-intro" id="packet-catalog">
              <span>COMPLETE PACKET CATALOG</span>
              <h3>Every packet name tells you its direction and how to listen for it</h3>
              <p>
                Constants explain what travels over the protocol and generate the correct receive or send listener.
                Wrappers show every JS, TypeScript, Python, and Java signature.
              </p>
            </div>
            <ApiExplorer
              initialKind="packets"
              kinds={packetCatalogKinds}
              label="PacketEvents catalog"
              searchPlaceholder="Search CHAT_MESSAGE, UPDATE_HEALTH, entity, window…"
            />
          </section>

          <section className="doc-section api-reference-section" hidden={activeSection !== "api-reference"} id="api-reference">
            <SectionHeading eyebrow="14 · Complete reference" title="Every cataloged type and signature, searchable in one place">
              Search the full public surface: {catalogCounts.api} Graaly API symbols, {catalogCounts.packetWrappers} packet wrappers,
              {catalogCounts.packetSupportTypes} supporting packet types, and {catalogCounts.packetConstants} packet constants.
              TypeScript, Python, and Java signatures are shown side by side, including inherited members and overloads.
            </SectionHeading>
            <ApiExplorer />
          </section>

          <section className="doc-section" hidden={activeSection !== "conformance"} id="conformance">
            <SectionHeading eyebrow="15 · API conformance" title="Exhaustive structure, vertical behavior, and honest limits">
              Graaly checks every compiled public type against the generated JavaScript, TypeScript, Python, and documentation
              catalogs. Three checked-in conformance plugins define 31 behavioral cases and compile against that same contract.
              Dedicated JavaScript and Python probes then run on every supplied real server from 1.7.10 through 26.2; focused
              Java, React, and FastAPI suites cover their own isolated boundaries.
            </SectionHeading>
            <div className="coverage-line conformance-totals" aria-label="Audited API totals">
              <span><strong>{catalogCounts.api}</strong> API exports</span>
              <span><strong>{bukkitEventCatalog.length}</strong> concrete events</span>
              <span><strong>{catalogCounts.packetWrappers}</strong> packet wrappers</span>
              <span><strong>{catalogCounts.packetSupportTypes}</strong> packet support types</span>
              <span><strong>{catalogCounts.packetConstants}</strong> packet constants</span>
            </div>
            <div className="decision-list two conformance-layers">
              <div><strong><Check size={15} /> Structural parity</strong><p>Every compiled public top-level and nested type is present. Generated member signatures must have Java, JS, TS, and Python forms, with zero unresolved SDK types.</p></div>
              <div><strong><Check size={15} /> Real-server runtime</strong><p>All 67 supplied releases load JS and Python, schedule work, dispatch commands, reload, spawn and remove an entity, adapt canonical constants, and report unavailable mechanics natively.</p></div>
              <div><strong><Check size={15} /> Context scenarios</strong><p>Join, move, chat, quit, entity effects, player-bound attributes, and packet traffic stay explicitly labeled as context-dependent; they are not presented as universal passes without the required player or PacketEvents state.</p></div>
              <div><strong><Check size={15} /> Lifecycle edges</strong><p>The real-server harness checks load, enable, task execution, command dispatch, repeated reload, disable, and clean shutdown in isolated directories.</p></div>
            </div>
            <div className="plain-callout conformance-boundary">
              <strong>What “complete” means.</strong> Structural mapping is exhaustive. Behavioral invocation is deliberately
              family-based: calling every destructive world, shutdown, ban, network, and player overload without its required
              state would be unsafe and would not prove correctness. The matrix labels headless, live-event, live-packet, and
              lifecycle evidence separately.
            </div>
            <div className="conformance-downloads">
              <a className="text-link" href="./downloads/api-conformance-matrix.json" download>
                Download the test contract <ArrowRight size={14} />
              </a>
              <a className="text-link" href="./downloads/server-compatibility-matrix.json" download>
                Download the complete 67-server report <ArrowRight size={14} />
              </a>
              <a className="text-link" href="./downloads/packetevents-26.2.json" download>
                Download the PacketEvents 2.13.0 report <ArrowRight size={14} />
              </a>
            </div>
          </section>

          <section className="doc-section" hidden={activeSection !== "safety"} id="safety">
            <SectionHeading eyebrow="16 · Threading & safety" title="Two rules prevent most production bugs">
              Keep live world mutations on the main thread, and only install code you trust. Script plugins have the same power as JAR plugins.
            </SectionHeading>
            <div className="decision-list two">
              <div><strong>Main server thread</strong><p>Players, inventories, worlds, blocks, entities, commands, and most live server state.</p></div>
              <div><strong>Async or Netty thread</strong><p>Database, HTTP, file parsing, and packet inspection. Use <code>tasks.run</code> in JS/TS. Python coroutines run on Graaly&apos;s main loop; <code>await tasks.to_thread(...)</code> resumes there automatically.</p></div>
            </div>
            <div className="plain-callout">
              Direct host-class lookup is disabled, bootstrap bindings are removed before plugin code starts, and the public SDK exposes no raw-object escape.
              This reduces accidental Java coupling; it does not make unknown third-party plugins safe to run.
            </div>
          </section>

          <section className="doc-section" hidden={activeSection !== "troubleshooting"} id="troubleshooting">
            <SectionHeading eyebrow="17 · Troubleshooting" title="Short answers to common failures">
              Check the runtime, bundle entry point, dependency order, and thread before debugging plugin logic.
            </SectionHeading>
            <div className="faq-list">
              <details><summary>The server rejects my Java version</summary><p>Use Oracle GraalVM 25 Innovation 2 (Graal 25.2.4 on JDK 25.0.4). A plain 25.0.4 CPU build has a different JVMCI compiler and falls back to interpreted Polyglot execution.</p></details>
              <details><summary>My TypeScript plugin does not load</summary><p>The entry in <code>plugin.yml</code> must point to compiled ESM, normally <code>dist/main.mjs</code>. Run the bundle build before starting the server.</p></details>
              <details><summary>Can React components use document or HTML elements?</summary><p>No. This is a real React custom renderer whose host elements are <code>Message</code>, <code>Inventory</code>, <code>Item</code>, <code>Scoreboard</code>, <code>Line</code>, <code>BossBar</code>, and <code>Tab</code>. React hooks work normally; browser DOM elements belong only to a website board.</p></details>
              <details><summary>FastAPI is offline. Does the plugin freeze?</summary><p>No. Graaly uses Java&apos;s asynchronous HTTP client, enforces a timeout, and never blocks the server tick. Catch the rejected promise or Python exception and render an offline fallback.</p></details>
              <details><summary>Can FastAPI receive game events directly?</summary><p>No. Keep a thin Graaly adapter in the game process. It receives events, calls FastAPI with serializable data, then safely applies the result to live players and React roots.</p></details>
              <details><summary>PacketEvents is unavailable</summary><p>Install PacketEvents 2.13.0 separately and add <code>depend: [packetevents]</code> to the script bundle. Graaly does not redistribute it.</p></details>
              <details><summary>Why can&apos;t a packet listener be async?</summary><p>PacketEvents must receive cancellation and wrapper changes before its network callback returns. Graaly rejects async functions and generators at registration. A hidden Promise, coroutine, iterator, or any non-void return quarantines that listener after one diagnostic, so repeated packets cannot amplify the same stack trace. Keep the listener synchronous; use <code>tasks.run(() =&gt; ...)</code> in JS/TS, or capture packet data and call <code>tasks.create_task(coroutine)</code> in Python without returning it.</p></details>
              <details><summary>Why did FastAPI return 503?</summary><p>The database was temporarily unavailable or locked. Graaly&apos;s example maps SQLAlchemy operational failures to <code>503 Service Unavailable</code> with <code>Retry-After: 1</code>. Retry a read with backoff; retry a purchase only with its original <code>Idempotency-Key</code>.</p></details>
              <details><summary>Which async API should Python use?</summary><p>Use standard <code>asyncio</code> for sleep, gather, timeout, task creation, and cancellation. Graaly only adds <code>tasks.create_task</code> for synchronous entry points, <code>sleep_ticks</code>, <code>to_thread</code>, and <code>is_main_thread</code>.</p></details>
              <details><summary>What survives a server reload?</summary><p>No plugin-owned state survives: tasks, listeners, packet bindings, React roots, HTTP requests, Python modules, globals, and the event loop are cleared. JavaScript closes its Context. GraalPy keeps one isolated interpreter Context per unchanged bundle, then rebuilds its <code>graaly</code> facade and re-executes the current source. This avoids materializing another full Python runtime on every <code>/reload</code> without preserving stale plugin code or data.</p></details>
              <details><summary>A Python package fails to import</summary><p>Prefer pure-Python packages. Native CPython wheels may require explicit GraalPy compatibility and are not automatically portable.</p></details>
              <details><summary>A website board does not render</summary><p>Install Chrome or Chromium, verify the configured executable path, and keep the compiled site under the GraalyBoard data directory. Remote assets require an explicit HTTPS host allowlist.</p></details>
              <details><summary>How do I type into an input on a board?</summary><p>Click the input or textarea, then send one chat message. GraalyBoard cancels that message before public chat and types it into the focused DOM element. Enter <code>!cancel</code> to abort.</p></details>
              <details><summary>How do I scroll a long website board?</summary><p>Look at the board and use the mouse wheel. GraalyBoard scrolls that viewer&apos;s DOM and restores the selected hotbar slot. Tune distance with <code>website-browser.scroll-pixels-per-step</code>.</p></details>
            </div>
          </section>

          <nav className="section-pager" aria-label="Documentation pagination">
            {previousSection ? (
              <a href={`#${previousSection.id}`} rel="prev">
                <span><ChevronLeft size={14} aria-hidden="true" /> Previous</span>
                <strong>{previousSection.title}</strong>
              </a>
            ) : <span aria-hidden="true" />}
            {nextSection ? (
              <a className="is-next" href={`#${nextSection.id}`} rel="next">
                <span>Next <ChevronRight size={14} aria-hidden="true" /></span>
                <strong>{nextSection.title}</strong>
              </a>
            ) : <span aria-hidden="true" />}
          </nav>

          <footer>
            <div className="brand footer-brand"><span><strong>Graaly</strong><small>JavaScript · TypeScript · Python · Java</small></span></div>
            <p>Complete Graaly and PacketEvents documentation for Java 17 and newer.</p>
            <a href="https://github.com/retrooper/packetevents" target="_blank" rel="noreferrer">PacketEvents project <ExternalLink size={13} /></a>
          </footer>
        </main>
      </div>
      {menuOpen && <button className="menu-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} type="button" />}
      <HomeSearch open={searchOpen} setOpen={setSearchOpen} />
    </>
  );
}
