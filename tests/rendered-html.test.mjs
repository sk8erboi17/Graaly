import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import {
  bukkitCatalog,
  packetSupportTypeCatalog,
  packetTypeCatalog,
  packetWrapperCatalog,
} from "../app/generated-api-reference.ts";
import { bukkitEventCatalog } from "../app/generated-events.ts";
import {
  cGuideCode,
  commandTopics,
  entityTopics,
  guideTopicCount,
  packetTopics,
  playerTopics,
  worldTopics,
} from "../app/guide-topics.ts";

const checkedInRuntimeRoot = new URL("../runtime/", import.meta.url);
const externalRuntimeRoot = new URL("../../../Graaly/", import.meta.url);
const runtimeRoot = existsSync(new URL("pom.xml", checkedInRuntimeRoot))
  ? checkedInRuntimeRoot
  : externalRuntimeRoot;
const runtimeFile = path => new URL(path, runtimeRoot);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the complete documentation in English", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="en"/i);
  assert.match(html, /class="brand-logo"[^>]*graaly-logo-96\.png/);
  assert.match(html, /Minecraft plugins in TypeScript, JavaScript, Python, and C/);
  assert.match(html, /Build Graaly plugins/);
  assert.match(html, /Know exactly when your code runs/);
  assert.match(html, /Every common Player workflow in one searchable browser/);
  assert.match(html, /Use real React for game UI and Python for persistent services/);
  assert.match(html, /Write code\. Pass the tests\. Build complete plugins\./);
  assert.match(html, /React semantics stay intact/);
  assert.match(html, /Website boards are coming soon/);
  assert.match(html, /Learn the workflow, then search every packet and wrapper/);
  assert.match(html, /Every cataloged type and signature/);
  assert.match(html, /PacketEvents 2\.13\.0/);
  assert.doesNotMatch(html, /Niente stringhe da ricordare|Cerca nella documentazione|Mostra altri eventi|annullabile|proprietà|scrivibile/);
  assert.doesNotMatch(html, /Native-feeling|language you already think in|Graaly-flavoured imitation|REAL-WORLD PATTERNS|real IDE/i);
  assert.doesNotMatch(html, /—/);
  assert.ok(existsSync(new URL("../public/graaly-logo.png", import.meta.url)));
  assert.ok(existsSync(new URL("../public/graaly-logo-96.png", import.meta.url)));
});

test("does not use em dashes in the documentation source or README", async () => {
  const sources = await Promise.all([
    "../README.md",
    "../app/page.tsx",
    "../app/layout.tsx",
    "../app/academy-data.ts",
    "../app/academy-playground.tsx",
    "../app/guide-topics.ts",
  ].map(path => readFile(new URL(path, import.meta.url), "utf8")));

  for (const source of sources) assert.doesNotMatch(source, /—/);
});

test("publishes one versionless Graaly contract from 1.7.10 through 26.2", async () => {
  const published = JSON.parse(await readFile(
    new URL("../public/contracts/graaly-api.json", import.meta.url), "utf8"));
  const runtime = JSON.parse(await readFile(runtimeFile("contract/graaly-api.json"), "utf8"));
  const typeScript = await readFile(runtimeFile("sdk/typescript/graaly.mts"), "utf8");
  const python = await readFile(runtimeFile("sdk/python/graaly/_core.pyi"), "utf8");
  const cHeader = await readFile(runtimeFile("sdk/c/include/graaly/graaly.h"), "utf8");
  const cCatalog = await readFile(runtimeFile("sdk/c/include/graaly/catalog.h"), "utf8");
  const cTyped = await readFile(runtimeFile("sdk/c/include/graaly/typed.h"), "utf8");
  const cPacketTyped = await readFile(runtimeFile("sdk/c/include/graaly/packet-typed.h"), "utf8");
  const cManifest = JSON.parse(await readFile(runtimeFile("sdk/c/catalog-manifest.json"), "utf8"));
  const cTypedManifest = JSON.parse(await readFile(runtimeFile("sdk/c/typed-manifest.json"), "utf8"));
  const cPacketTypedManifest = JSON.parse(await readFile(runtimeFile("sdk/c/packet-typed-manifest.json"), "utf8"));
  const cExample = await readFile(runtimeFile("examples/EducationalC.cplugin/src/main.c"), "utf8");
  const response = await render();
  const html = await response.text();

  assert.deepEqual(published, runtime, "docs and runtime must expose the same contract");
  assert.deepEqual(runtime.supportedGameVersions, { minimum: "1.7.10", current: "26.2" });
  assert.equal(runtime.apiCatalog.canonicalApiVersion, "26.2");
  assert.equal(runtime.apiCatalog.resolution, "lazy-version-adapter");
  assert.equal(runtime.apiCatalog.missingTypeOrMember, "GraalyUnsupportedFeature");
  assert.equal(runtime.cAbi.version, 1);
  assert.equal(runtime.cAbi.target, "wasm32-wasi");
  assert.equal(runtime.cAbi.developerOwnsDomainStructs, true);
  assert.equal(runtime.cAbi.fullGeneratedApiParity, true);
  assert.equal(runtime.cAbi.design, "educational-typed-c");
  assert.equal(runtime.cAbi.hostObjects, "opaque-typed-handles");
  assert.equal(runtime.cAbi.rawAbiOptIn, "GRAALY_ENABLE_RAW_ABI");
  assert.equal(runtime.cAbi.typedFacade.reflectionIsPublicByDefault, false);
  assert.equal(runtime.cAbi.typedFacade.generatedProperties, 26069);
  assert.equal(runtime.cAbi.typedFacade.generatedWriters, 11096);
  assert.equal(runtime.cAbi.typedFacade.generatedMethods, 17875);
  assert.equal(runtime.cAbi.packetTypedFacade.exportedPacketTypes, 822);
  assert.equal(runtime.cAbi.packetTypedFacade.generatedProperties, 5019);
  assert.equal(runtime.cAbi.packetTypedFacade.generatedWriters, 2911);
  assert.equal(runtime.cAbi.packetTypedFacade.generatedMethods, 45578);
  assert.equal(runtime.cAbi.packetTypedFacade.generatedConstructors, 412);
  assert.deepEqual(runtime.cAbi.catalog, {
    types: 1421,
    canonicalClasses: 1411,
    memberReferences: 63044,
    uniqueMemberNames: 9704,
    constants: 4629,
    constantNamespaces: 13,
    generatedHeader: "sdk/c/include/graaly/catalog.h",
    packetWrappers: 289,
    packetSupportTypes: 533,
    packetTypePaths: 288,
    packetMemberNames: 2926,
  });
  assert.equal(cManifest.exportedTypes, 1421);
  assert.equal(cManifest.memberReferences, 63044);
  assert.equal(cManifest.constants, 4629);
  assert.equal(cManifest.packetWrappers, 289);
  assert.equal(cManifest.packetSupportTypes, 533);
  assert.equal(cManifest.packetTypePaths, 288);
  assert.equal(cManifest.packetMemberNames, 2926);
  assert.equal(cTypedManifest.generatedProperties, 26069);
  assert.equal(cTypedManifest.generatedWriters, 11096);
  assert.equal(cTypedManifest.generatedMethods, 17875);
  assert.equal(cPacketTypedManifest.exportedPacketTypes, 822);
  assert.equal(cPacketTypedManifest.generatedProperties, 5019);
  assert.equal(cPacketTypedManifest.generatedMethods, 45578);
  assert.equal(Object.keys(runtime.modules).length, 14);
  for (const [moduleName, moduleDefinition] of Object.entries(runtime.modules)) {
    assert.ok(Array.isArray(moduleDefinition.c) && moduleDefinition.c.length > 0,
      `missing C surface for ${moduleName}`);
  }
  assert.equal(runtime.cAbi.teachingMemory.canary, "DEADBEEF");
  assert.equal(runtime.cAbi.teachingMemory.redZoneBytes, 16);
  assert.match(typeScript, /export const GraalyUnsupportedFeature/);
  assert.match(typeScript, /export const compatibility/);
  assert.match(python, /class GraalyUnsupportedFeature\(RuntimeError\)/);
  assert.match(python, /compatibility: _Compatibility/);
  assert.match(cHeader, /graaly_debug_malloc/);
  assert.match(cHeader, /GRAALY_ENABLE_RAW_ABI/);
  assert.match(cHeader, /graaly_player_list/);
  assert.match(cHeader, /graaly_world_create/);
  assert.match(cHeader, /graaly_http_get/);
  assert.match(cHeader, /graaly_packet_on_receive/);
  assert.match(cHeader, /graaly_text_callback_t/);
  assert.match(cHeader, /GRAALY_POISON_HANDLE/);
  assert.match(cTyped, /graaly_player_health\(/);
  assert.match(cTyped, /graaly_player_health_write\(/);
  assert.match(cTyped, /#define graaly_player_has_permission /);
  assert.match(cPacketTyped, /graaly_pe_wrapper_play_client_chat_message__from_event/);
  assert.match(cPacketTyped, /graaly_pe_wrapper_play_client_chat_message__message_write/);
  assert.match(cCatalog, /GRAALY_TYPE_PLAYER/);
  assert.match(cCatalog, /GRAALY_MEMBER_HEALTH/);
  assert.match(cCatalog, /GRAALY_MATERIAL_STONE/);
  assert.match(cCatalog, /GRAALY_PACKET_WRAPPER_WRAPPERPLAYCLIENTCHATMESSAGE/);
  assert.match(cCatalog, /GRAALY_PACKET_PLAY_CLIENT_CHAT_MESSAGE/);
  assert.match(cCatalog, /GRAALY_PACKET_MEMBER_MESSAGE/);
  assert.doesNotMatch(cHeader, /^\s*typedef\s+struct\s+Player\b/m);
  assert.match(cExample, /typedef struct Player/);
  assert.match(cExample, /graaly_player_t host/);
  assert.match(cExample, /graaly_player_name/);
  assert.match(cExample, /graaly_player_health/);
  assert.doesNotMatch(cExample, /graaly_(?:get|set|call)\(/);
  assert.match(cExample, /coverflow_command/);
  assert.match(cExample, /csegfault_command/);
  assert.match(html, /C \/ WEBASSEMBLY TRACK/);
  assert.match(html, /Typed C API outside, low-level ABI underneath/);
  assert.match(html, /63,044/);
  assert.match(html, /4,629/);
  assert.match(html, /DEADBEEF/);
  assert.match(html, /Names never move/);
  assert.match(html, /Renames are internal/);
  assert.match(html, /No fake mechanics/);
  assert.match(html, /all 67 supplied releases/i);
});

test("ships the declared entry file for every plugin example", async () => {
  const examples = new URL("examples/", runtimeRoot);
  const bundles = (await readdir(examples, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && entry.name.endsWith("plugin"));

  assert.ok(bundles.length >= 15, "expected the complete Graaly example catalog");
  for (const bundle of bundles) {
    const manifestUrl = new URL(`${bundle.name}/plugin.yml`, examples);
    if (!existsSync(manifestUrl)) continue;
    const manifest = await readFile(manifestUrl, "utf8");
    const entry = manifest.match(/^main:\s*(.+?)\s*$/m)?.[1];
    assert.ok(entry, `${bundle.name} does not declare main`);
    assert.ok(
      existsSync(new URL(`${bundle.name}/${entry}`, examples)),
      `${bundle.name} is missing its declared entry ${entry}`,
    );
  }
});

test("ships minimal navigation with valid anchors and accessible controls", async () => {
  const response = await render();
  const html = await response.text();
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const requiredIds = [
    "overview",
    "prerequisites",
    "compatibility",
    "content",
    "quickstart",
    "learn",
    "events",
    "commands",
    "players",
    "worlds",
    "entities",
    "html-css-gui",
    "react-ui",
    "academy",
    "boards",
    "packets",
    "api-reference",
    "conformance",
    "safety",
    "troubleshooting",
  ];
  for (const id of requiredIds) assert.match(html, new RegExp(`id="${id}"`));

  assert.match(html, /aria-label="Search documentation"/);
  assert.match(html, /aria-label="Open navigation"/);
  assert.match(html, /Skip to content/);
  assert.match(html, /aria-label="Documentation pagination"/);
  assert.match(html, /aria-current="page"/);
  assert.match(page, /documentationSections = navigation\.flatMap/);
  assert.match(page, /window\.scrollTo\(\{ top: Math\.max\(0, top\), left: 0/);
  assert.match(page, /rel="prev"/);
  assert.match(page, /rel="next"/);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, "duplicate HTML ids");
  const targets = [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
  for (const target of targets) assert.ok(ids.includes(target), `missing target #${target}`);
});

test("documents and ships semantic HTML CSS native GUI controls", async () => {
  const response = await render();
  const html = await response.text();
  const typeScript = await readFile(runtimeFile("sdk/typescript/graaly.mts"), "utf8");
  const python = await readFile(runtimeFile("sdk/python/graaly/_core.pyi"), "utf8");
  const javaBridge = await readFile(
    runtimeFile("src/main/java/io/github/sk8erboi17/graaly/polyglot/GraalyUiScriptApi.java"),
    "utf8",
  );

  assert.match(html, /Write semantic HTML and map CSS to native Minecraft screens/);
  assert.match(html, /WHITE_STAINED_GLASS_PANE/);
  assert.match(html, /native four-line sign editor/);
  assert.match(html, /slots 0 and 1/);
  assert.match(html, /border-radius/);
  assert.match(html, /--minecraft-material/);
  assert.match(typeScript, /renderHtml\(player: Player, markup: string/);
  assert.match(python, /def render_html\(/);
  assert.match(javaBridge, /PacketPlayOutOpenSignEditor/);
  assert.match(javaBridge, /InventoryType\.ANVIL/);
  assert.ok(existsSync(runtimeFile("examples/HtmlCssGui.jsplugin/dist/main.mjs")));
  assert.ok(existsSync(runtimeFile("examples/HtmlCssGui.pyplugin/main.py")));
});

test("uses a restrained light-first Graaly Docs visual language", async () => {
  const response = await render();
  const html = await response.text();
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(html, /class="docs-meta-bar"/);
  assert.doesNotMatch(html, /class="global-language-tabs"/);
  assert.match(html, /<html[^>]*data-theme="light"/);
  assert.match(html, /aria-label="Switch to dark theme"/);
  assert.match(html, /class="hero-facts"/);
  assert.match(html, /aria-label="Quick start language"/);
  assert.match(layout, /Chivo/);
  assert.match(layout, /IBM_Plex_Mono/);
  assert.match(css, /--canvas: #f7f7f8/);
  assert.match(css, /--paper: #ffffff/);
  assert.match(css, /--panel-2: #fbfafc/);
  assert.match(css, /restrained documentation chrome/);
  assert.match(css, /:root\[data-theme="dark"\]/);
  assert.match(css, /font-size: clamp\(34px, 9vw, 46px\)/);
  assert.match(css, /--code: #f6f5f8/);
  assert.match(css, /:root:not\(\[data-theme="dark"\]\) \.academy-editor/);
  assert.match(css, /\.section-pager/);
  assert.doesNotMatch(html, /class="hero-code"/);
  assert.doesNotMatch(html, /class="hero-runtime-map"/);
  assert.doesNotMatch(html, /class="brand-mark"/);
  assert.match(css, /\.doc-section\.academy-section/);
});

test("documents the real React renderer and FastAPI SQLAlchemy split end to end", async () => {
  const response = await render();
  const html = await response.text();
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const reactSdk = await readFile(runtimeFile("sdk/react/src/index.ts"), "utf8");
  const jsRuntime = await readFile(
    runtimeFile("src/main/resources/polyglot/bootstrap.js"),
    "utf8",
  );
  const pythonRuntime = await readFile(
    runtimeFile("src/main/resources/polyglot/bootstrap.py"),
    "utf8",
  );
  const backend = (
    await Promise.all([
      readFile(runtimeFile("examples/ReactFastApi.jsplugin/backend/app/main.py"), "utf8"),
      readFile(runtimeFile("examples/ReactFastApi.jsplugin/backend/app/routers/shop.py"), "utf8"),
    ])
  ).join("\n");

  assert.match(html, /React 19 and its reconciler/);
  assert.match(html, /game UI instead of an HTML DOM/);
  assert.match(html, /SEPARATE CPYTHON PROCESS/);
  assert.match(html, /FastAPI can be your application backend/);
  for (const surface of ["Message", "Inventory", "Item", "Scoreboard", "Line", "BossBar", "Tab"]) {
    assert.match(page, new RegExp(`&lt;${surface}|${surface}`));
    assert.match(reactSdk, new RegExp(`export function ${surface}\\(`));
  }
  assert.match(page, /await http\.post/);
  assert.match(page, /FastAPI \+ SQLAlchemy/);
  assert.match(page, /All TypeScript/);
  assert.match(page, /All Python/);
  assert.match(page, /React \+ Python service/);
  assert.match(jsRuntime, /const http = Object\.freeze/);
  assert.match(jsRuntime, /const ui = Object\.freeze/);
  assert.match(pythonRuntime, /class _Http:/);
  assert.match(pythonRuntime, /class _Ui:/);
  for (const helper of ["message", "item", "inventory", "scoreboard", "boss_bar", "tab", "view"]) {
    assert.match(pythonRuntime, new RegExp(`def ${helper}\\(`));
  }
  assert.match(backend, /create_async_engine/);
  assert.match(backend, /async_sessionmaker/);
  assert.match(backend, /prefix="\/v1\/shop"/);
  assert.match(backend, /@router\.post\("\/purchase"/);
  assert.match(css, /\.react-stack-guide/);
  assert.match(css, /\.stack-flow/);
  assert.match(css, /\.surface-reference/);
});

test("teaches transferable React and FastAPI patterns with a modular runnable example", async () => {
  const response = await render();
  const html = await response.text();
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const hook = await readFile(
    runtimeFile("examples/ReactFastApi.jsplugin/src/hooks/use-player-profile.ts"),
    "utf8",
  );
  const reducer = await readFile(
    runtimeFile("examples/ReactFastApi.jsplugin/src/state/shop-state.tsx"),
    "utf8",
  );
  const apiClient = await readFile(
    runtimeFile("examples/ReactFastApi.jsplugin/src/api/graaly-api.ts"),
    "utf8",
  );
  const backendMain = await readFile(
    runtimeFile("examples/ReactFastApi.jsplugin/backend/app/main.py"),
    "utf8",
  );
  const backendDependencies = await readFile(
    runtimeFile("examples/ReactFastApi.jsplugin/backend/app/dependencies.py"),
    "utf8",
  );
  const backendServices = await readFile(
    runtimeFile("examples/ReactFastApi.jsplugin/backend/app/services.py"),
    "utf8",
  );

  for (const title of [
    "Make the HTTP boundary typed",
    "Load server state with a custom Hook",
    "Keep one source of truth",
    "Treat writes as explicit commands",
    "Scale shared UI with Reducer + Context",
    "Add optimistic feedback safely",
    "Test through replaceable boundaries",
  ]) {
    assert.match(html, new RegExp(title.replace(/[+]/g, "\\+")));
  }

  assert.match(html, /7 ARCHITECTURE PATTERNS/);
  assert.match(html, /ANTI-PATTERN/);
  assert.match(page, /useOptimistic/);
  assert.match(page, /startTransition/);
  assert.match(page, /dependency_overrides/);
  assert.match(page, /async with session\.begin\(\)/);
  assert.match(page, /react\.dev\/learn\/reusing-logic-with-custom-hooks/);
  assert.match(page, /fastapi\.tiangolo\.com\/tutorial\/dependencies/);
  assert.match(hook, /useQuery/);
  assert.match(hook, /profileQueryKey/);
  assert.match(reducer, /useReducer/);
  assert.match(reducer, /createContext/);
  assert.match(apiClient, /class ApiError/);
  assert.match(backendMain, /include_router/);
  assert.match(backendMain, /lifespan/);
  assert.match(backendDependencies, /SessionDep = Annotated/);
  assert.match(backendServices, /update\(PlayerProfile\)/);
  assert.match(backendServices, /PlayerProfile\.coins >= price/);
  assert.match(backendServices, /returning\(PlayerProfile\)/);
  assert.match(backendServices, /async with session\.begin\(\)/);
  assert.match(css, /\.stack-pattern-lab/);
  assert.match(css, /\.pattern-index/);
  assert.match(css, /\.pattern-detail/);
});

test("ships an accessible animated IDE course for the complete React and FastAPI mental model", async () => {
  const response = await render();
  const html = await response.text();
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const courseSource = page.slice(
    page.indexOf("const studioLessons"),
    page.indexOf("const reactFastApiPatterns"),
  );

  assert.match(html, /GUIDED COURSE · 15 LESSONS/);
  assert.match(html, /React and FastAPI, step by step/);
  assert.match(html, /Interactive React and FastAPI course/);
  assert.match(html, /Graaly Stack Workshop/);
  assert.match(html, /WEB REACT ↔ GAME REACT/);
  assert.match(html, /WHY THIS CHOICE/);
  assert.match(html, /KEEP THIS/);
  assert.match(html, /LESSON/);
  assert.match(html, /aria-valuemax="15"/);
  assert.match(html, /Choose a course lesson/);
  assert.match(html, /Use the lesson menu or Previous and Next/);

  for (const title of [
    "React stays React; only the render target changes",
    "Two processes have two different jobs",
    "Pydantic validates the contract at runtime",
    "Dependencies own authentication and request resources",
    "A thin router translates HTTP into an application call",
    "A custom Hook turns HTTP into a small state machine",
    "The backend owns prices and commits atomically",
    "Reducer, Context, and optimism are earned complexity",
    "Test the seams while keeping the architecture proportional",
  ]) {
    assert.ok(html.includes(title), `${title} is missing from the course`);
  }

  assert.equal((courseSource.match(/number: "\d{2}"/g) ?? []).length, 15);
  assert.match(page, /function AnimatedStudioCode/);
  assert.match(page, /highlightElement\(element, syntaxLanguage, "inline"\)/);
  assert.match(page, /window\.setTimeout/);
  assert.match(page, /useSyncExternalStore\(subscribeReducedMotion/);
  assert.match(page, /aria-label=\{reducedMotion \? "Autoplay disabled/);
  assert.match(css, /\.studio-ide/);
  assert.match(css, /\.studio-coursebar/);
  assert.doesNotMatch(css, /\.studio-timeline/);
  assert.match(css, /\.studio-code-lines > div\.is-visible\.is-focused/);
  assert.match(css, /@keyframes studio-autoplay/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("explains what events do before showing code", async () => {
  assert.ok(bukkitEventCatalog.length >= 260);
  assert.equal(new Set(bukkitEventCatalog.map(event => event.javaName)).size, bukkitEventCatalog.length);

  const response = await render();
  const html = await response.text();
  assert.match(html, /WHEN IT FIRES/);
  assert.match(html, /WHAT TO USE IT FOR/);
  assert.match(html, /READ/);
  assert.match(html, /CHANGE/);
  assert.match(html, /A player has finished joining and is now available to plugins/);
  assert.match(html, /A player is about to break a block, before the server removes it/);
  assert.match(html, /A player&#x27;s position, yaw, or pitch is changing/);
  assert.match(html, /Can be cancelled/);
  assert.match(html, /Main thread/);

  for (const event of bukkitEventCatalog) {
    assert.ok(html.includes(event.name), `${event.name} is not discoverable in the event browser`);
  }
});

test("provides useful event examples for TypeScript, JavaScript, Python, C, and Java", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /events\.on\(BlockBreakEvent/);
  assert.match(source, /@event\(BlockBreakEvent\)/);
  assert.match(source, /mine\.diamond/);
  assert.match(source, /event\.expToDrop = 0/);
  assert.match(source, /event\.exp_to_drop = 0/);
  assert.match(source, /events\.on\(AsyncPlayerChatEvent/);
  assert.match(source, /tasks\.run\(\(\) => event\.player\.sendMessage/);
  assert.match(source, /@event\(AsyncPlayerChatEvent\)/);
  assert.match(source, /public void protectDiamondOre\(BlockBreakEvent event\)/);
  assert.match(source, /event\.setExpToDrop\(0\)/);
  assert.match(source, /graaly_events_on_type/);
  assert.match(source, /graaly_cast\(graaly_/);
  assert.match(source, /_cancelled_write\(event, true\)/);
  assert.doesNotMatch(source, /graaly_get\(/);
  assert.doesNotMatch(source, /graaly_set\(/);
  assert.doesNotMatch(source, /graaly_call\(/);
  assert.match(source, /JAVA EQUIVALENT/);
  assert.match(source, /genericEventExample/);
});

test("keeps all event properties and cancellation metadata", () => {
  const blockBreak = bukkitEventCatalog.find(event => event.name === "BlockBreakEvent");
  assert.ok(blockBreak);
  assert.equal(blockBreak.cancellable, true);
  assert.deepEqual(
    blockBreak.properties.map(property => [property.name, property.pythonName, property.writable]),
    [
      ["block", "block", false],
      ["expToDrop", "exp_to_drop", true],
      ["cancelled", "cancelled", true],
      ["player", "player", false],
      ["dropItems", "drop_items", true],
    ],
  );
  assert.ok(bukkitEventCatalog.every(event => Array.isArray(event.properties)));
});

test("publishes the full Java API and PacketEvents catalogs", async () => {
  assert.ok(bukkitCatalog.length >= 1_390);
  assert.equal(packetWrapperCatalog.length, 289);
  assert.equal(packetSupportTypeCatalog.length, 533);
  assert.equal(packetTypeCatalog.length, 288);

  const player = bukkitCatalog.find(entry => entry.name === "Player");
  const world = bukkitCatalog.find(entry => entry.name === "World");
  assert.ok(player);
  assert.ok(world);
  assert.ok(player.members.length >= 150);
  assert.ok(world.members.length >= 150);
  const playerMemberNames = new Set(player.members.map(member => member.name));
  assert.ok(playerMemberNames.has("flying"));
  assert.ok(playerMemberNames.has("allowFlight"));
  assert.ok(!playerMemberNames.has("isFlying"));
  assert.ok(!playerMemberNames.has("setFlying"));
  assert.ok(!playerMemberNames.has("setAllowFlight"));
  assert.ok(packetTypeCatalog.includes("Play.Client.CHAT_MESSAGE"));
  assert.ok(packetTypeCatalog.includes("Play.Server.UPDATE_HEALTH"));
  assert.ok(packetWrapperCatalog.some(entry => entry.name === "WrapperPlayServerUpdateHealth"));
  assert.ok(bukkitCatalog.every(entry => entry.members.every(member => typeof member.java === "string" && member.java.length > 0)));

  const response = await render();
  const html = await response.text();
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(html, new RegExp(`${bukkitCatalog.length}(?:<!-- -->)? Graaly API symbols`));
  assert.match(html, new RegExp(`${bukkitEventCatalog.length}(?:<!-- -->)? events`));
  assert.match(html, new RegExp(`${packetWrapperCatalog.length}(?:<!-- -->)? packet wrappers`));
  assert.match(html, /ClientPacket\.CHAT_MESSAGE/);
  assert.match(html, /WrapperPlayServerUpdateHealth/);
  assert.match(html, /TypeScript, Python, and Java signatures are shown side by side/);
  assert.match(html, /JavaBean instance accessors/);
  assert.match(html, /player\.allowFlight = true/);
  assert.match(html, /player\.allow_flight = True/);
  assert.match(html, /Every packet name tells you its direction and how to listen for it/);
  assert.match(html, /Loading the complete searchable catalog/);
  assert.match(page, /The client submits a chat message to the server/);
});

test("publishes Java-backed instance state only as native properties", async () => {
  const [typeScriptApi, pythonApi, javaScriptRuntime, pythonRuntime] = await Promise.all([
    readFile(runtimeFile("sdk/typescript/generated-api.mts"), "utf8"),
    readFile(runtimeFile("sdk/python/graaly/api/__init__.pyi"), "utf8"),
    readFile(runtimeFile("src/main/resources/polyglot/bootstrap.js"), "utf8"),
    readFile(runtimeFile("src/main/resources/polyglot/bootstrap.py"), "utf8"),
  ]);
  const typeScriptPlayer = typeScriptApi.match(/export interface Player extends ApiObject \{[\s\S]*?\n\}/)?.[0] ?? "";
  const pythonPlayer = pythonApi.match(/class Player\([^\n]+\):[\s\S]*?(?=\nclass )/)?.[0] ?? "";

  assert.match(typeScriptPlayer, /allowFlight: boolean;/);
  assert.match(typeScriptPlayer, /flying: boolean;/);
  assert.doesNotMatch(typeScriptPlayer, /(?:isFlying|setFlying|setAllowFlight)\(/);
  assert.match(pythonPlayer, /allow_flight: bool/);
  assert.match(pythonPlayer, /flying: bool/);
  assert.doesNotMatch(pythonPlayer, /(?:is_flying|set_flying|set_allow_flight)\(/);
  assert.match(javaScriptRuntime, /isPropertyAccessorCall/);
  assert.match(pythonRuntime, /is_property_accessor_call/);
});

test("documents the auditable vertical API conformance boundary", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /15 · API conformance/);
  assert.match(html, /31 behavioral cases/);
  assert.match(html, /Structural mapping is exhaustive/);
  assert.match(html, /family-based/);
  assert.match(html, /api-conformance-matrix\.json/);
  assert.match(html, /server-compatibility-matrix\.json/);
  assert.match(html, /packetevents-26\.2\.json/);
  const matrix = JSON.parse(await readFile(
    new URL("../public/downloads/api-conformance-matrix.json", import.meta.url), "utf8"));
  assert.equal(matrix.cases.length, 31);
  assert.deepEqual(Object.keys(matrix.plugins), ["javascript", "typescript", "python"]);
  const servers = JSON.parse(await readFile(
    new URL("../public/downloads/server-compatibility-matrix.json", import.meta.url), "utf8"));
  assert.equal(servers.tested, 67);
  assert.equal(servers.passed, 67);
  assert.equal(servers.failed, 0);
  assert.equal(servers.results.length, 67);
  assert.ok(servers.results.every(result => result.passed));
  const packetEvents = JSON.parse(await readFile(
    new URL("../public/downloads/packetevents-26.2.json", import.meta.url), "utf8"));
  assert.equal(packetEvents.packeteventsVersion, "2.13.0");
  assert.equal(packetEvents.passed, true);
  assert.deepEqual(packetEvents.missing, []);
});

test("includes a complete Java quick start beside Graaly languages", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const response = await render();
  const html = await response.text();
  assert.match(source, /type Language = "js" \| "ts" \| "py" \| "c"/);
  assert.match(source, /type QuickstartLanguage = Language \| "java"/);
  assert.match(source, /\{ id: "c", label: "C \/ WebAssembly" \}/);
  assert.match(source, /"main: dist\/plugin\.wasm"/);
  assert.match(source, /zig cc -target wasm32-wasi/);
  assert.match(source, /typedef struct Player/);
  assert.match(source, /WelcomePlugin extends JavaPlugin implements Listener/);
  assert.match(source, /getServer\(\)\.getPluginManager\(\)\.registerEvents/);
  assert.match(source, /from \\"graaly\\"/);
  assert.match(source, /from graaly import PlayerJoinEvent/);
  assert.match(source, /event\.player\.sendMessage\(\\"&aWelcome!\\"\)/);
  assert.match(source, /event\.player\.send_message\(\\"&dWelcome!\\"\)/);
  assert.doesNotMatch(source, /sendMessage\(text\.color/);
  assert.doesNotMatch(source, /send_message\(text\.color/);
  assert.match(source, /WelcomePlugin\.java/);
  assert.match(html, />Java</);
  assert.match(html, /Java deploys a compiled JAR/);
});

test("documents the complete install, deploy, load, and verification path", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const response = await render();
  const html = await response.text();

  assert.match(html, /Graaly does not currently publish a release JAR/);
  assert.match(html, /runtime\/target\/Graaly-1\.0\.0\.jar/);
  assert.match(html, /plugins\/Graaly\/scripts\/WelcomeTS\.jsplugin/);
  assert.match(html, /Graaly is ready: 0 guest plugin\(s\)/);
  assert.match(html, /graaly status/);
  assert.match(html, /New bundle or/);
  assert.match(html, /source-only change to an already loaded bundle/i);
  assert.match(html, /\/graaly reload/);
  assert.match(html, /\/hello/);
  assert.match(source, /WelcomeJS\.jsplugin/);
  assert.match(source, /WelcomePy\.pyplugin/);
  assert.match(source, /WelcomeC\.cplugin/);
  assert.match(source, /plugin\.wasm/);
  assert.match(source, /Java plugins do not use Graaly's guest loader/);
  assert.doesNotMatch(source, /mkdir -p \/server\//);
});

test("uses the event-style browser for every core developer workflow", async () => {
  const response = await render();
  const html = await response.text();
  assert.equal(guideTopicCount, 45);
  assert.deepEqual(
    [commandTopics.length, playerTopics.length, worldTopics.length, entityTopics.length, packetTopics.length],
    [10, 9, 9, 9, 8],
  );
  for (const browser of ["commands and tasks", "player api", "world api", "entity api", "packetevents workflows"]) {
    assert.match(html, new RegExp(`data-guide-browser="${browser}"`));
  }
  for (const topic of [...commandTopics, ...playerTopics, ...worldTopics, ...entityTopics, ...packetTopics]) {
    assert.ok(html.includes(topic.title), `${topic.title} is not discoverable in its guide browser`);
    assert.ok(topic.code.js.length > 0 && topic.code.ts.length > 0 && topic.code.py.length > 0 && topic.code.java.length > 0);
    const cCode = cGuideCode(topic);
    assert.match(cCode, /#include <graaly\/(?:graaly|packets)\.h>/);
    assert.ok(cCode.includes("graaly_") || cCode.includes("/* C equivalent"), `${topic.title} has no C correspondence`);
    assert.ok(topic.operations.every(operation => operation.c.length > 0), `${topic.title} has an operation without C mapping`);
    assert.ok(topic.javaEquivalent.length > 0, `${topic.title} has no Java correspondence`);
  }
  assert.match(html, /WHEN TO USE IT/);
  assert.match(html, /WHAT IT DOES/);
  assert.match(html, /YOU PROVIDE/);
  assert.match(html, /YOU GET/);
  assert.match(html, /Java mapped/);

  const commandPlayerTopic = commandTopics.find(topic => topic.id === "command-player");
  assert.ok(commandPlayerTopic, "the command sender Player guide is missing");
  assert.match(commandPlayerTopic.code.ts, /players\.isPlayer\(context\.sender\)/);
  assert.match(commandPlayerTopic.code.ts, /const player = context\.sender/);
  assert.match(commandPlayerTopic.note ?? "", /players\.broadcast/);

  const commandModuleTopic = commandTopics.find(topic => topic.id === "command-modules");
  assert.ok(commandModuleTopic, "the command module registration guide is missing");
  assert.match(commandModuleTopic.code.ts, /import "\.\/commands\/fly\.mts"/);
  assert.match(commandModuleTopic.note ?? "", /npm run build before \/graaly reload/);
});

test("documents location, custom worlds, entities, and every canonical attribute", async () => {
  const allWorldCode = worldTopics.flatMap(topic => Object.values(topic.code)).join("\n");
  const allEntityCode = entityTopics.flatMap(topic => Object.values(topic.code)).join("\n");
  assert.match(allWorldCode, /worlds\.location/);
  assert.match(allWorldCode, /new Location/);
  assert.match(allWorldCode, /worlds\.generator/);
  assert.match(allWorldCode, /setRegion/);
  assert.match(allWorldCode, /set_region/);
  assert.match(allEntityCode, /entities\.spawn/);
  assert.match(allEntityCode, /EntityTypes\.ZOMBIE/);
  assert.match(allEntityCode, /customName/);
  assert.match(allEntityCode, /custom_name/);

  const constants = JSON.parse(await readFile(
    new URL("../public/contracts/latest-constants.json", import.meta.url), "utf8"));
  const typeScriptConstants = await readFile(runtimeFile("sdk/typescript/constants.mts"), "utf8");
  const pythonConstants = await readFile(runtimeFile("sdk/python/graaly/constants.pyi"), "utf8");
  assert.equal(Object.keys(constants.namespaces.EntityType.entityClasses).length, 159);
  assert.equal(constants.namespaces.EntityType.entityClasses.ZOMBIE, "Zombie");
  assert.equal(constants.namespaces.EntityType.entityClasses.HORSE, "Horse");
  assert.match(typeScriptConstants, /readonly ZOMBIE: EntityTypeOf<Zombie>/);
  assert.match(typeScriptConstants, /readonly HORSE: EntityTypeOf<Horse>/);
  assert.match(pythonConstants, /ZOMBIE: EntityTypeOf\[Zombie\]/);
  assert.match(pythonConstants, /HORSE: EntityTypeOf\[Horse\]/);
  assert.equal(constants.namespaces.Attribute.constants.length, 40);
  for (const attribute of constants.namespaces.Attribute.constants) {
    assert.match(JSON.stringify(entityTopics), new RegExp(attribute));
  }
  assert.match(JSON.stringify(entityTopics), /Strength remains a timed potion effect/);
});

test("documents and types true Python async/await instead of callback-only async", async () => {
  const taskDocs = commandTopics.filter(topic => topic.group === "Tasks");
  const taskCode = taskDocs.flatMap(topic => Object.values(topic.code)).join("\n");
  const pythonStub = await readFile(runtimeFile("sdk/python/graaly/_core.pyi"), "utf8");
  const runtime = await readFile(
    runtimeFile("src/main/resources/polyglot/bootstrap.py"),
    "utf8",
  );
  const stubTasks = pythonStub.match(/class _Tasks:[\s\S]*?\n\nclass _Config:/)?.[0] ?? "";
  const runtimeTasks = runtime.match(/ {4}class _Tasks:[\s\S]*?\n {4}class _Config:/)?.[0] ?? "";

  assert.match(taskCode, /async def welcome/);
  assert.match(taskCode, /await asyncio\.sleep/);
  assert.match(taskCode, /await asyncio\.gather/);
  assert.match(taskCode, /await tasks\.to_thread/);
  assert.match(taskCode, /tasks\.create_task\(load_player\(\)/);
  for (const method of ["create_task", "sleep_ticks", "to_thread", "is_main_thread"]) {
    assert.match(stubTasks, new RegExp(`def ${method}(?:\\[T\\])?\\(`), `missing Python task stub ${method}`);
    assert.match(runtimeTasks, new RegExp(`def ${method}\\(`), `missing Python task runtime ${method}`);
  }
  for (const callbackMethod of ["run", "later", "repeat", "run_async", "later_async", "repeat_async", "start", "background"]) {
    assert.doesNotMatch(stubTasks, new RegExp(`def ${callbackMethod}(?:\\[T\\])?\\(`), `callback API leaked into Python stub: ${callbackMethod}`);
    assert.doesNotMatch(runtimeTasks, new RegExp(`def ${callbackMethod}\\(`), `callback API leaked into Python runtime: ${callbackMethod}`);
  }
  assert.match(runtime, /_asyncio\.new_event_loop\(\)/);
  assert.match(runtime, /configure_python_tasks/);
  assert.match(runtime, /task\.cancel\(\)/);
});

test("teaches native language constructs and keeps server and browser environments explicit", async () => {
  const response = await render();
  const html = await response.text();
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const jsRuntime = await readFile(
    runtimeFile("src/main/resources/polyglot/bootstrap.js"),
    "utf8",
  );
  const pythonRuntime = await readFile(
    runtimeFile("src/main/resources/polyglot/bootstrap.py"),
    "utf8",
  );
  const typeScriptSdk = await readFile(runtimeFile("sdk/typescript/graaly.mts"), "utf8");
  const pythonSdk = await readFile(runtimeFile("sdk/python/graaly/_core.pyi"), "utf8");

  assert.match(html, /Learn the language, not a Graaly dialect/);
  assert.match(html, /what only exists in a browser or Node\.js environment/);
  assert.match(html, /Website boards are coming soon/);
  assert.match(page, /async · await/);
  assert.match(page, /match · case/);
  assert.match(page, /try · except · finally · raise/);
  assert.match(page, /with · as/);
  assert.match(page, /yield/);
  assert.match(page, /\[x for x in values\]/);
  assert.match(page, /href="#boards"/);
  assert.match(page, /docs\.python\.org\/3\/tutorial/);
  assert.match(page, /typescriptlang\.org\/docs\/handbook/);
  const examples = page.slice(
    page.indexOf("const learningConceptExamples"),
    page.indexOf("const quickstartCode"),
  );
  assert.equal([...examples.matchAll(/\bfile: "/g)].length, 31, "every language concept needs its own example");
  for (const file of [
    "modules.mjs",
    "async-flow.mjs",
    "domain-models.ts",
    "type-guards.ts",
    "modules.py",
    "coroutines.py",
    "context_managers.py",
  ]) {
    assert.match(examples, new RegExp(file.replace(".", "\\.")), `missing dedicated example ${file}`);
  }
  assert.match(page, /aria-controls="language-concept-example"/);
  assert.match(page, /setConceptIndex\(index\)/);
  assert.match(html, /EXAMPLE/);
  assert.match(html, /modules\.py/);

  assert.match(jsRuntime, /const players = Object\.freeze\(\{[\s\S]*?\[Symbol\.iterator\]\(\)/);
  assert.match(jsRuntime, /const worlds = Object\.freeze\(\{[\s\S]*?\[Symbol\.iterator\]\(\)/);
  assert.match(pythonRuntime, /class _Players:[\s\S]*?def __iter__\(self\):[\s\S]*?def __len__\(self\):/);
  assert.match(pythonRuntime, /class _Worlds:[\s\S]*?def __iter__\(self\):[\s\S]*?def __len__\(self\):/);
  assert.match(typeScriptSdk, /interface PlayersApi extends Iterable<Player>/);
  assert.match(typeScriptSdk, /interface WorldsApi extends Iterable<World>/);
  assert.match(pythonSdk, /class _Players\(Iterable\[Player\]\):[\s\S]*?__iter__\(self\) -> Iterator\[Player\]/);
  assert.match(pythonSdk, /class _Worlds\(Iterable\[World\]\):[\s\S]*?__iter__\(self\) -> Iterator\[World\]/);
  assert.match(JSON.stringify(playerTopics), /for \(const online of players\)/);
  assert.match(JSON.stringify(playerTopics), /for online in players/);
  assert.match(JSON.stringify(worldTopics), /\[\.\.\.worlds\]/);
  assert.match(JSON.stringify(worldTopics), /for world in worlds/);
  assert.match(css, /\.runtime-boundary/);
  assert.match(css, /\.keyword-grid/);
  assert.match(css, /\.learning-layout/);
});

test("keeps experimental website boards outside the stable documentation surface", async () => {
  const response = await render();
  const html = await response.text();
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const jsRuntime = await readFile(
    runtimeFile("src/main/resources/polyglot/bootstrap.js"),
    "utf8",
  );
  const pythonRuntime = await readFile(
    runtimeFile("src/main/resources/polyglot/bootstrap.py"),
    "utf8",
  );
  const typeScriptSdk = await readFile(runtimeFile("sdk/typescript/graaly.mts"), "utf8");
  const pythonSdk = await readFile(runtimeFile("sdk/python/graaly/_core.pyi"), "utf8");
  const javaBridge = await readFile(
    runtimeFile("src/main/java/io/github/sk8erboi17/graaly/polyglot/GraalyScriptApi.java"),
    "utf8",
  );

  assert.match(html, /Website boards are coming soon/);
  assert.match(html, /planned, not available in the current release/);
  assert.doesNotMatch(html, /LIVE DOM SAMPLE/);
  assert.doesNotMatch(html, /Buttons, inputs, textareas, checkboxes/);
  assert.match(page, /document\.querySelector<HTMLSelectElement>/);
  assert.match(page, /graaly\.onState<PanelData>/);
  assert.match(page, /graaly\.send\(\\"teleport\\"/);
  assert.match(page, /boards\.state\(\\"control-panel\\"/);
  assert.match(page, /@boards\.on_message\(\\"control-panel\\"\)/);
  assert.match(page, /GraalyBoardApi\.get\(\)/);
  assert.match(jsRuntime, /const boards = Object\.freeze/);
  assert.match(jsRuntime, /publishWebState/);
  assert.match(pythonRuntime, /class _Boards:/);
  assert.match(pythonRuntime, /def on_message\(name, callback=None\)/);
  assert.match(typeScriptSdk, /export interface BoardsApi/);
  assert.match(typeScriptSdk, /onMessage<T = unknown>/);
  assert.match(pythonSdk, /class _Boards:/);
  assert.match(javaBridge, /publishWebState/);
  assert.match(javaBridge, /onWebMessage/);
  assert.match(css, /\.availability-note/);
  assert.match(css, /@media \(max-width: 620px\)/);
});

test("resolves every guide import against the generated TypeScript and Python SDKs", async () => {
  const topics = [...commandTopics, ...playerTopics, ...worldTopics, ...entityTopics, ...packetTopics];
  const typeScriptSdk = (await Promise.all([
    "sdk/typescript/graaly.mts",
    "sdk/typescript/generated-api.mts",
    "sdk/typescript/generated-packets.mts",
  ].map(path => readFile(runtimeFile(path), "utf8")))).join("\n");
  const pythonSdk = (await Promise.all([
    "sdk/python/graaly/__init__.pyi",
    "sdk/python/graaly/_core.pyi",
    "sdk/python/graaly/api/__init__.pyi",
    "sdk/python/graaly/constants.pyi",
    "sdk/python/graaly/packetevents/__init__.pyi",
  ].map(path => readFile(runtimeFile(path), "utf8")))).join("\n");

  for (const topic of topics) {
    for (const language of ["js", "ts"]) {
      const nativeImport = topic.code[language].match(/^import \{ ([^}]+) \} from "graaly";/)?.[1] ?? "";
      assert.ok(nativeImport.length > 0, `${topic.id} has no direct Graaly ${language} import`);
      for (const symbol of nativeImport.split(",").map(value => value.trim()).filter(Boolean)) {
        assert.match(
          typeScriptSdk,
          new RegExp(`(?:export (?:const|interface|type|class|function) |var )${symbol}\\b`),
          `${topic.id} imports missing ${language} symbol ${symbol}`,
        );
      }
    }

    const pythonImport = topic.code.py.match(/^from graaly import ([^\n]+)/)?.[1] ?? "";
    for (const symbol of pythonImport.split(",").map(value => value.trim()).filter(Boolean)) {
      assert.match(
        pythonSdk,
        new RegExp(`(?:class |def |^|import[^\\n]*)${symbol}\\b`, "m"),
        `${topic.id} imports missing Python symbol ${symbol}`,
      );
    }
  }
});

test("does not reintroduce developer-facing Java interop escapes", async () => {
  const source = [
    await readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    await readFile(new URL("../app/guide-topics.ts", import.meta.url), "utf8"),
  ].join("\n");
  for (const forbidden of [
    /types\.bukkit/,
    /types\.java/,
    /events\.type\(/,
    /packets\.(?:type|packetType)\(/,
    /Java\.type\(/,
    /spigot\.types/,
    /\.raw\b/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
  assert.match(source, /Direct host-class lookup is disabled/);
  assert.match(source, /public SDK exposes no raw-object escape/);
});

test("includes responsive layouts, polished scrollbars, and restrained accessible animation", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(layout, /width: "device-width"/);
  assert.match(layout, /locale: "en_US"/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@keyframes detail-enter/);
  assert.match(css, /animation-timeline: view\(\)/);
  assert.match(css, /scrollbar-color/);
  assert.match(css, /::-webkit-scrollbar-thumb/);
  assert.match(css, /\.api-reference-section/);
  assert.match(css, /\.api-browser-grid[\s\S]*height: clamp/);
  assert.match(css, /\.api-detail[\s\S]*overflow: auto/);
  assert.match(css, /\.api-browser-grid \.api-index[\s\S]*overflow-y: scroll/);
  assert.match(css, /\.event-category-strip[\s\S]*flex-wrap: wrap/);
  assert.doesNotMatch(css, /coverage-aside|side-proof/);
});

test("ships real syntax highlighting and explains logger helpers", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(packageJson.dependencies["@speed-highlight/core"], "^1.2.24");
  assert.match(page, /highlightElement/);
  assert.match(page, /shj-lang-/);
  assert.match(css, /shj-syn-kwd/);
  assert.match(css, /shj-syn-str/);
  const { highlightText } = await import("@speed-highlight/core");
  const highlighted = await highlightText("const message = 'hello';", "ts", false);
  assert.match(highlighted, /shj-syn-kwd/);
  assert.match(highlighted, /shj-syn-str/);

  const response = await render();
  const html = await response.text();
  assert.match(html, /info\(value\).*writes an INFO line to this plugin/);
  assert.match(html, /They do not send text to players/);
});

test("contains no starter or removed promotional card", async () => {
  const response = await render();
  const html = await response.text();
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/);
  assert.doesNotMatch(html, /Niente stringhe da ricordare|No strings to remember/);
});

test("ships a complete 36-lesson Graaly Academy with a minimal interactive playground", async () => {
  const response = await render();
  const html = await response.text();
  const data = await readFile(new URL("../app/academy-data.ts", import.meta.url), "utf8");
  const playground = await readFile(new URL("../app/academy-playground.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(html, /36 long-form lessons/);
  assert.match(html, /208.*?Medium and Hard problems/);
  assert.match(html, /data-testid="graaly-arena"/);
  for (const integration of ["FastAPI / ASGI", "Pydantic", "HTML / CSS", "SQL / persistence", "C / WebAssembly"]) assert.ok(html.includes(integration),integration);
  assert.match(html, /Submit all tests/);
  assert.match(html, /aria-label="React playground"/);
  assert.match(html, /FastAPI request inspector/);
  assert.doesNotMatch(html, /Hard lab|Definition of done|Minecraft React lab|browser host simulator|Run this lesson|waiting for Run/);
  assert.doesNotMatch(html, /Always available|Lesson-linked|transparent lifecycle visualizer|not Python emulation/);
  assert.equal((data.match(/\n\s+number: \d+,/g) ?? []).length, 36);
  for (const concept of [
    "State snapshot",
    "Render phase",
    "useSyncExternalStore",
    "useActionState",
    "Server Components",
    "Generated OpenAPI types",
    "Dependency tree",
    "WebSocket endpoint",
    "StreamingResponse",
    "Dependency overrides",
    "TanStack Query",
    "Finite state machine",
    "AbortController",
    "Branded types",
    "JWT",
    "RBAC",
    "Alembic",
    "ContextVar",
    "Async iterators",
    "TaskGroup",
    "Reconnect backoff",
    "Multi-server",
    "Edge-case matrix",
  ]) {
    assert.match(data, new RegExp(concept.replace(/[()]/g, "\\$&")));
  }
  assert.match(playground, /import\("sucrase"\)/);
  assert.match(playground, /transforms: \["typescript", "jsx", "imports"\]/);
  assert.match(playground, /compileAcademyComponent\(currentFile\.code\)/);
  assert.match(playground, /--academy-editor-height/);
  assert.match(playground, /academy-workbench-toolbar/);
  assert.doesNotMatch(playground, /browser preview executes real React|Run TSX|Minecraft surface preview|academy-lab-truth/);
  assert.match(playground, /Validate PurchaseRequest/);
  assert.match(playground, /Resolve dependencies/);
  assert.match(playground, /201 Created · PurchaseResponse is valid/);
  assert.doesNotMatch(playground, /FastAPI lifecycle lab|Always available|not Python emulation|<Play(?:\s|>)/);
  assert.match(playground, /const materialSprites/);
  assert.match(playground, /className="academy-item-sprite"/);
  assert.match(playground, /className={`shj-lang-\$\{languageFor\(currentFile\)\}`}/);
  assert.match(css, /\.academy-workbench/);
  assert.match(css, /\.academy-workbench-toolbar/);
  assert.match(css, /\.academy-workbench-grid\.is-source-only/);
  assert.match(css, /height: var\(--academy-editor-height/);
  assert.match(css, /\.academy-lesson-scroll/);
  assert.match(css, /\.academy-editor-layer \.shj-syn-kwd/);
  assert.match(css, /\.academy-run-actions button\.is-primary:hover:not\(:disabled\)/);
  assert.match(css, /\.academy-run-actions button\.is-primary,[\s\S]*?color: #fff;/);
  assert.match(css, /\.academy-api-grid textarea\s*\{[\s\S]*?background: var\(--paper\);[\s\S]*?color: var\(--ink\);/);
  assert.match(css, /\.academy-pipeline > div\.is-done > span\s*\{[\s\S]*?color: #fff;/);
  assert.match(css, /\.academy-item-sprite/);
  assert.match(css, /\.academy-lesson-footer\s*\{[\s\S]*?grid-template-columns: repeat\(3, minmax\(132px, 180px\)\);[\s\S]*?justify-content: center;/);
  assert.match(css, /\.docs-layout\s*\{[\s\S]*?width: min\(1920px, 100%\)/);
  assert.match(css, /\.academy-section\s*\{[\s\S]*?width: calc\(100% - 32px\)/);
  assert.match(css, /container: academy-content \/ inline-size/);
  assert.match(css, /@container academy-content \(max-width: 980px\)/);
  assert.match(css, /@media \(max-width: 900px\)/);
});

test("implements web-style JWT and live RBAC across FastAPI and React", async () => {
  const response = await render();
  const html = await response.text();
  const auth = await readFile(runtimeFile("examples/ReactFastApi.jsplugin/backend/app/auth.py"), "utf8");
  const dependencies = await readFile(runtimeFile("examples/ReactFastApi.jsplugin/backend/app/dependencies.py"), "utf8");
  const permissions = await readFile(runtimeFile("examples/ReactFastApi.jsplugin/backend/app/routers/permissions.py"), "utf8");
  const services = await readFile(runtimeFile("examples/ReactFastApi.jsplugin/backend/app/services.py"), "utf8");
  const panel = await readFile(runtimeFile("examples/ReactFastApi.jsplugin/src/components/permission-panel.tsx"), "utf8");
  const purchase = await readFile(runtimeFile("examples/ReactFastApi.jsplugin/src/hooks/use-purchase.ts"), "utf8");
  const migration = await readFile(runtimeFile("examples/ReactFastApi.jsplugin/backend/alembic/versions/0001_network_shop_authorization.py"), "utf8");

  assert.match(html, /React displays permissions; FastAPI enforces them/);
  assert.match(html, /revokes access immediately/);
  assert.match(auth, /issue_access_token/);
  assert.match(auth, /PERMISSIONS_MANAGE/);
  assert.match(dependencies, /get_current_actor/);
  assert.match(dependencies, /require_permission/);
  assert.match(permissions, /replace_player_roles/);
  assert.match(services, /resolve_actor/);
  assert.match(services, /RolePermission/);
  assert.match(panel, /useMutation/);
  assert.match(panel, /permissions\.manage/);
  assert.match(purchase, /cancelQueries/);
  assert.match(purchase, /onError/);
  assert.match(purchase, /invalidateQueries/);
  assert.match(migration, /player_roles/);
});

test("documents and ships WebSocket, OpenAPI codegen, native input, and renderer inspection", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const tsSdk = await readFile(runtimeFile("sdk/typescript/graaly.mts"), "utf8");
  const pySdk = await readFile(runtimeFile("sdk/python/graaly/_core.pyi"), "utf8");
  const jsRuntime = await readFile(
    runtimeFile("src/main/resources/polyglot/bootstrap.js"),
    "utf8",
  );
  const pyRuntime = await readFile(
    runtimeFile("src/main/resources/polyglot/bootstrap.py"),
    "utf8",
  );
  const reactSdk = await readFile(runtimeFile("sdk/react/src/index.ts"), "utf8");
  const backendRealtime = await readFile(
    runtimeFile("examples/ReactFastApi.jsplugin/backend/app/routers/realtime.py"),
    "utf8",
  );
  const generated = await readFile(
    runtimeFile("examples/ReactFastApi.jsplugin/src/api/generated-schema.ts"),
    "utf8",
  );

  assert.match(tsSdk, /interface WebSocketApi/);
  assert.match(tsSdk, /export const websocket = runtime\.websocket/);
  assert.match(pySdk, /class WebSocketConnector\(Awaitable\[WebSocketConnection\]\)/);
  assert.match(pyRuntime, /async def __aenter__\(self\)/);
  assert.match(jsRuntime, /class GraalyWebSocketConnection/);
  assert.match(backendRealtime, /@router\.websocket/);
  assert.match(backendRealtime, /RealtimeClientMessage\.model_validate/);
  assert.match(generated, /RealtimeClientMessage/);
  assert.match(reactSdk, /export function ChatInput/);
  assert.match(reactSdk, /export function createPortal/);
  assert.match(reactSdk, /getCommits\(\)/);
  assert.match(page, /@graaly\/react-test/);
  assert.match(page, /OpenAPI TypeScript CLI/);
});
