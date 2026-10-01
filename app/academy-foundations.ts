import type { AcademyFile, AcademyLesson, AcademyTrack } from "./academy-data.ts";
import type { ChallengeLanguage } from "./academy/types.ts";
import { sqlProblems } from "./academy/problems-sql.ts";

type LessonSpec = {
  number: number; id: string; track: AcademyTrack; title: string;
  concepts: string[]; model: string; why: [string, string]; game: string;
  decision: string; files: AcademyFile[];
  practice: { id: string; language: ChallengeLanguage }[];
  steps: [string, string, string]; pitfalls: string[];
  question: string; accepted: string[];
};
const file = (name: string, language: AcademyFile["language"], code: string): AcademyFile => ({name, language, code: code.trim()+"\n"});
const webBoundary: Partial<Record<AcademyTrack, string>> = {
  C: "C runs as WebAssembly and calls the Graaly host ABI. A browser exercise uses WASI; a deployed bundle uses the generated SDK. The guest never receives a JVM pointer.",
  "HTML / CSS": "Graaly compiles a restricted HTML/CSS vocabulary into native Minecraft inventory items and dialogs. There is no browser DOM, layout engine or arbitrary script execution inside the markup.",
  Java: "Java is the Bukkit host and interoperability path, rather than an Academy guest runner. Build and verify these examples in a local server; the linked JSON contract can be practiced in the supported guest languages.",
  Configuration: "Manifests describe a plugin bundle, rather than a browser page. Validate them against the actual loader before enabling a bundle.",
};
function lesson(spec: LessonSpec): AcademyLesson {
  return {number:spec.number,id:spec.id,track:spec.track,title:spec.title,
    level:[37,38,42,47,48,53,54,61,62,66,71,74,78,80,83].includes(spec.number)?"Foundation":"Intermediate",duration:"45–70 min",
    concepts:spec.concepts,mentalModel:spec.model,explanation:spec.why,
    outcomes:spec.steps,minecraft:spec.game,
    webDifference:webBoundary[spec.track]??"The language and framework semantics are unchanged. Graaly owns game effects through its SDK; browser exercises verify the observable contract with isolated fixtures and the selected execution environment.",
    decision:spec.decision,files:spec.track==="SQL"?[...spec.files,file("schema.sql","sql",sqlProblems[0].sqlSchema!)]:spec.files,practice:spec.practice,
    lab:{mission:spec.title,steps:spec.steps,done:spec.track==="Java"?"Build and verify the host example on a local server, then compare its boundary with the linked guest exercise.":"Submit the linked exercise in this course's profile, then verify the boundary cases described above."},
    pitfalls:spec.pitfalls,checkpoint:{question:spec.question,accepted:spec.accepted}};
}

export const foundationLessons: readonly AcademyLesson[] = [
  lesson({number:37,id:"js-values-ownership",track:"JavaScript",title:"Values, references, and ownership at a plugin boundary",
    concepts:["Primitive values","Object identity","Copying","Input ownership"],
    model:"A reference gives access to an object; it does not grant permission to change that object.",
    why:["Arrays and plain objects are shared through references. A spread creates a new outer object, but nested arrays still belong to the caller unless you copy them too. Decide which layer your function owns before sorting, normalizing or appending.","The Academy judges reject a correct answer obtained by mutating the fixture. Make a new result and copy each nested collection that you will change. Object.freeze is shallow; it is useful as a development assertion, but it cannot replace a clear ownership contract."],
    game:"A loot preview must not reorder the caller's inventory or change the server's authoritative stack list.",decision:"Copy only the data you will write; keep unchanged values shared when their contract is immutable.",
    files:[file("inventory.mjs","javascript",`export function normalized(stacks) {
  return stacks.map(stack => ({
    ...stack,
    lore: [...(stack.lore ?? [])],
  })).sort((a, b) => a.slot - b.slot);
}
const input = [{ slot: 4, lore: ["Owned by caller"] }];
const result = normalized(input);
result[0].lore.push("Preview only");
console.assert(input[0].lore.length === 1);`)],
    practice:[{id:"inventory-merge",language:"js"}],steps:["Separate borrowed input from owned output.","Copy nested collections before writing.","Test empty stacks, incompatible metadata and unchanged input."],
    pitfalls:["Calling sort on borrowed arrays.","Assuming spread recursively clones.","Returning shared mutable defaults."],question:"Does object spread clone nested arrays?",accepted:["no"]}),
  lesson({number:38,id:"js-command-scanner",track:"JavaScript",title:"Build a scanner with explicit quoting states",
    concepts:["Strings","Iteration","State machines","Escapes"],model:"A scanner consumes each character once while carrying the state needed to interpret it.",
    why:["Splitting on spaces loses quoted arguments and escape sequences. Keep the current token, quote delimiter and escape state explicitly. Decide whether an empty quoted token is significant and what an unfinished quote means; these are grammar rules, not incidental string operations.","Scan by character rather than byte offsets so ordinary Unicode text survives. Flush a token only at an unquoted separator or at the end. Reject an unfinished escape or quote before executing a command, so malformed input cannot partially trigger a game effect."],
    game:"A command such as /mail Alex \"meet at spawn\" needs one message argument, even though the message contains spaces.",decision:"Use a small state machine for a bounded command grammar; introduce a parser library when the grammar truly becomes recursive.",
    files:[file("scan.mjs","javascript",`export function scan(text) {
  const words = []; let token = "", quote = false, escape = false, started = false;
  for (const character of text) {
    if (escape) { token += character; escape = false; started = true; }
    else if (character === "\\\\") { escape = true; started = true; }
    else if (character === '"') { quote = !quote; started = true; }
    else if (/\\s/u.test(character) && !quote) {
      if (started) words.push(token);
      token = ""; started = false;
    } else { token += character; started = true; }
  }
  if (quote || escape) throw new Error("Unfinished argument");
  if (started) words.push(token);
  return words;
}`)],practice:[{id:"command-tokenizer",language:"js"}],steps:["Model unquoted, quoted and escaped input.","Preserve empty quoted arguments.","Test unfinished quotes before dispatch."],pitfalls:["Using split(' ') as a grammar.","Dropping empty arguments.","Executing before parsing completes."],question:"What represents the scanner's quoting rules?",accepted:["state machine","a state machine"]}),
  lesson({number:39,id:"js-closures-lifecycle",track:"JavaScript",title:"Closures, subscriptions, and plugin teardown",
    concepts:["Closures","ES modules","Subscriptions","Disposal"],model:"A closure retains the variables it needs for as long as the callback remains reachable.",
    why:["An event subscription keeps its callback alive, and that callback can retain caches or player objects. Put state at the narrowest scope that owns it. Module globals live for the bundle's lifecycle; a command invocation needs request-local variables.","Treat each subscription as a resource with an inverse operation. Dispose it during disable and clear state owned by the old plugin instance. Registering another listener on every command invocation accumulates effects and makes reload behavior differ from first startup."],
    game:"Join messages must be sent once per event, even after repeated enable/disable cycles.",decision:"Pair registration with teardown at the same ownership boundary.",files:[file("lifecycle.mjs","javascript",`export function subscribe(bus, onJoin) {
  const seen = new Set();
  const remove = bus.on("join", player => {
    if (!seen.has(player.id)) { seen.add(player.id); onJoin(player); }
  });
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true; remove(); seen.clear();
  };
}`)],practice:[{id:"event-subscription-lifecycle",language:"js"},{id:"join-welcome-plugin",language:"plugin-js"}],steps:["Give each registration an explicit disposer.","Make teardown idempotent.","Exercise disable followed by re-enable."],pitfalls:["Retaining departed players in a closure.","Registering inside repeated commands.","Cleaning the cache but leaving the callback active."],question:"What undoes a subscription?",accepted:["disposer","dispose","cleanup"]}),
  lesson({number:40,id:"js-async-order",track:"JavaScript",title:"Promises, stale responses, and cancellation",
    concepts:["Promises","async/await","Generation tokens","Cancellation"],model:"Completion order belongs to the network; publication order belongs to your application.",
    why:["Two requests can complete in the opposite order from their start. Await expresses a dependency within one task; it does not impose order across tasks. Increment a generation before each refresh and publish only when the completing task still owns that generation.","Cancellation should reach the underlying operation when its API supports it. A generation check is still necessary because cancellation can race with completion. Handle rejection and dispose session work on close; an unhandled promise cannot tell the player what failed."],
    game:"A late price lookup must not replace the result from a newer shop search.",decision:"Use cancellation to save work and a generation guard to protect state.",files:[file("refresh.mjs","javascript",`export function makeRefresh(fetchPrice, publish) {
  let generation = 0;
  return async sku => {
    const mine = ++generation;
    const result = await fetchPrice(sku);
    if (mine === generation) publish(result);
  };
}`)],practice:[{id:"task-generation",language:"js"},{id:"service-cancellation",language:"js"}],steps:["Tag each refresh with a generation.","Ignore completion after replacement or disposal.","Test slow-first and fast-second responses."],pitfalls:["Treating await as global ordering.","Publishing in finally without checking ownership.","Silencing rejected tasks."],question:"What prevents an obsolete response from publishing?",accepted:["generation guard","generation token","generation"]}),
  lesson({number:41,id:"js-maps-windows",track:"JavaScript",title:"Maps, deterministic order, and bounded event windows",
    concepts:["Map","Set","Stable ordering","Bounded memory"],model:"A cache needs an eviction rule as well as a lookup rule.",
    why:["Map preserves insertion order, which makes a small least-recently-used cache straightforward. A successful read must move the key to the newest position; merely overwriting an existing key does not move it. Make capacity zero a defined case.","Use a queue alongside a Set for bounded duplicate detection. Expire both structures together so a forgotten event can be accepted again. Decide which timestamps define a half-open window; changing an inclusive boundary by one tick changes rate-limit behavior."],game:"Duplicate packet events should be suppressed within a bounded window without retaining every event ever seen.",decision:"Define bounds and tie order before choosing a collection.",files:[file("lru.mjs","javascript",`export class Lru {
  #items = new Map();
  constructor(capacity) { this.capacity = Math.max(0, capacity); }
  get(key) {
    if (!this.#items.has(key)) return undefined;
    const value = this.#items.get(key);
    this.#items.delete(key); this.#items.set(key, value); return value;
  }
  put(key, value) {
    this.#items.delete(key); this.#items.set(key, value);
    while (this.#items.size > this.capacity) this.#items.delete(this.#items.keys().next().value);
  }
}`)],practice:[{id:"lru-session-cache",language:"js"},{id:"event-idempotency",language:"js"}],steps:["Make lookup refresh recency.","Evict to the configured capacity.","Test zero capacity, updates and repeated reads."],pitfalls:["An unbounded Set of IDs.","Overwriting without refreshing recency.","Depending on object key order for ties."],question:"Which operation refreshes a Map key's insertion position?",accepted:["delete then set","delete and set"]}),
  lesson({number:42,id:"ts-unknown-boundary",track:"TypeScript",title:"unknown, narrowing, and runtime validation",
    concepts:["unknown","Type guards","Narrowing","Runtime validation"],model:"A type annotation describes trusted values; it does not validate untrusted bytes.",why:["Use unknown for JSON received from a service or configuration file. Narrow through runtime checks before reading fields. An assertion such as 'as Purchase' only changes the compiler's belief, so it cannot reject a negative quantity or a missing identifier.","Check numeric finiteness and integer bounds explicitly. typeof true is boolean, but permissive coercion can still turn it into 1. Keep parsing and validation separate from the side effect; return a domain error before touching player inventory."],game:"A command or HTTP purchase must validate quantity before granting any item.",decision:"Narrow unknown at each external boundary; use a schema validator when the model is larger.",files:[file("quantity.ts","ts",`export function quantity(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)
      || value < 1 || value > 64) throw new Error("Invalid quantity");
  return value;
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}`)],practice:[{id:"command-usage-parser",language:"ts"}],steps:["Receive external input as unknown.","Narrow with checks that enforce the domain.","Reject booleans, overflow and non-finite numbers."],pitfalls:["Casting JSON into trust.","Using number without finiteness checks.","Validating after a side effect."],question:"Does a TypeScript assertion validate JSON at runtime?",accepted:["no"]}),
  lesson({number:43,id:"ts-unions-exhaustive",track:"TypeScript",title:"Discriminated unions and exhaustive transitions",
    concepts:["Discriminated unions","never","Exhaustiveness","State transitions"],model:"Each state owns only the data that is meaningful in that state.",why:["Independent pending, failed and complete booleans permit contradictory combinations. A discriminated union lists the allowed states and the fields each one requires. Narrow on the tag before reading its payload and keep transition rules in one pure function.","Use never in the final branch to make a new state fail compilation until it is handled. The Academy transpiles TypeScript, so perform semantic checking with tsc in the downloaded SDK project. A browser test proves behavior, while the compiler proves the exhaustiveness of your declared model."],game:"A trade may be open, accepted or committed; a cancelled trade must not retain a usable commit token.",decision:"Represent impossible combinations as unrepresentable types.",files:[file("trade.ts","ts",`type Trade = { kind: "open"; revision: number }
  | { kind: "accepted"; revision: number; by: string[] }
  | { kind: "cancelled" };
function unreachable(value: never): never { throw new Error(String(value)); }
export function label(state: Trade): string {
  switch (state.kind) {
    case "open": return "Review offer " + state.revision;
    case "accepted": return state.by.length + " confirmations";
    case "cancelled": return "Cancelled";
    default: return unreachable(state);
  }
}`)],practice:[{id:"trade-state-machine",language:"ts"}],steps:["Replace overlapping booleans with tagged states.","Guard each permitted transition.","Run tsc after adding a new state."],pitfalls:["Optional fields on every state.","A default branch that hides missing cases.","Assuming transpilation checks types."],question:"Which type detects an unhandled union member?",accepted:["never"]}),
  lesson({number:44,id:"ts-brands-generics",track:"TypeScript",title:"Branded identifiers, generics, and typed ownership",
    concepts:["Branded types","Generics","Readonly","Validated construction"],model:"A brand distinguishes meanings that share the same runtime representation.",why:["A player ID and an order ID may both be strings, but swapping them is still a bug. A unique-symbol brand makes them incompatible inside the checked program. Construct branded values only through a validating function; serializing JSON removes the compile-time distinction.","Generics preserve a relationship between input and output instead of erasing it to any. Readonly expresses a borrowing contract to the compiler, but it is not deep freezing or runtime protection. Keep the mutation boundary explicit and test it independently."],game:"A purchase lookup must never accept an unrelated player ID merely because both values are strings.",decision:"Brand values with different domain meanings; use generics for real relationships, not decorative type parameters.",files:[file("ids.ts","ts",`declare const playerBrand: unique symbol;
export type PlayerId = string & { readonly [playerBrand]: true };
export function playerId(text: string): PlayerId {
  if (!/^[A-Za-z0-9_]{3,16}$/.test(text)) throw new Error("Invalid player id");
  return text as PlayerId;
}
export function mapValues<T, U>(values: readonly T[], fn: (value: T) => U): U[] {
  return values.map(fn);
}`)],practice:[{id:"player-exact-command",language:"plugin-ts"},{id:"inventory-consume",language:"ts"}],steps:["Construct IDs through a validator.","Preserve input/output relationships with generics.","Test the same boundary after JSON decoding."],pitfalls:["Branding every string without validation.","Using any to bypass a mismatch.","Treating Readonly as a deep clone."],question:"Does a TypeScript brand survive JSON as a runtime check?",accepted:["no"]}),
  lesson({number:45,id:"ts-sdk-contracts",track:"TypeScript",title:"Use the generated SDK without inventing callbacks",
    concepts:["SDK modules","Typed callbacks","Permission gates","Plugin lifecycle"],model:"The SDK signature is the executable boundary between a bundle and the server.",why:["Import actual symbols from graaly and inspect their generated declarations. Callback arguments, task handles and packet context methods have specific contracts. A tutorial convenience interface is not a replacement for the production SDK declaration.","Keep callback registration at plugin startup and teardown at disable. Network callbacks cannot safely perform arbitrary world operations; marshal those effects to the server thread with the supported scheduler. The deterministic Academy adapter checks these constraints, while server verification covers platform behavior."],game:"Editing an outgoing packet requires the wrapper write and the context reencode operation, not just changing a JavaScript object.",decision:"Compile against the generated SDK and verify the same callback on a local server.",files:[file("packet.ts","ts",`import { packets, ServerPacket, WrapperPlayServerUpdateHealth } from "graaly";
packets.onSend(ServerPacket.UPDATE_HEALTH, ctx => {
  const packet = ctx.wrap(WrapperPlayServerUpdateHealth);
  if (packet.health > 20) {
    packet.health = 20;
    ctx.reencode();
  }
});`)],practice:[{id:"packet-health-reencode",language:"plugin-ts"},{id:"packet-main-thread",language:"plugin-ts"}],steps:["Read the real context and wrapper signatures.","Write through the wrapper and request reencoding.","Test thread ownership and teardown."],pitfalls:["Guessing a wrapper constructor.","Missing reencode after a write.","Running a game effect on the network thread."],question:"What publishes an edited outgoing wrapper?",accepted:["reencode","ctx.reencode()","reencode()"]}),
  lesson({number:46,id:"ts-build-contract",track:"TypeScript",title:"ES modules, satisfies, and reproducible bundle builds",
    concepts:["ES modules","satisfies","Build entrypoint","Semantic checking"],model:"A bundle is a build artifact with an explicit source entrypoint and an explicit runtime entrypoint.",why:["The loader reads bundle metadata rather than guessing where your TypeScript source lives. Keep source and generated JavaScript paths distinct. Run semantic checking before the build so missing SDK symbols or invalid props fail before deployment.","satisfies validates an object's compatibility while preserving useful literal inference. Use it for a configuration constant, then separately validate any configuration loaded at runtime. Avoid stale artifacts by making the documented build produce exactly the runtime file declared in the manifest."],game:"A .jsplugin directory must load the JavaScript produced from its declared TypeScript build entrypoint.",decision:"Make the build and loader contracts agree and verify from a clean checkout.",files:[file("settings.ts","ts",`type Policy = { retry: number; mode: "safe" | "fast" };
export const policy = { retry: 3, mode: "safe" } satisfies Policy;`),file("bundle.yml","yaml",`name: AcademyTypescript
version: 1.0.0
main: dist/main.mjs`),file("verify.sh","shell",`npx tsc --noEmit
npm run build
test -f dist/main.mjs`)],practice:[{id:"manifest-typescript",language:"yaml"}],steps:["Separate source and runtime paths.","Run semantic checking before bundling.","Verify the output declared by the manifest."],pitfalls:["Shipping stale dist files.","Using satisfies to validate runtime JSON.","Pointing main at unbuilt source."],question:"Which tool performs TypeScript semantic checking?",accepted:["tsc","typescript compiler"]}),
  lesson({number:47,id:"python-values-boundaries",track:"Python",title:"Python values, strict integers, and borrowed collections",
    concepts:["Python types","bool and int","Comprehensions","Input ownership"],model:"Python's convenient coercions are broader than most command contracts.",why:["bool is a subclass of int, so isinstance(True, int) is true. At a strict integer boundary use type(value) is int, then enforce the range. Reject non-finite floats separately if a contract accepts floating-point coordinates.","A list comprehension gives you a new list, but its elements can still reference borrowed dictionaries. Copy the objects you will modify and sort with sorted rather than list.sort on input. Keep validation separate from normalization so invalid input does not quietly become an allowed value."],game:"A command quantity of true must not be interpreted as one item.",decision:"Use strict checks for domain input and explicit conversion only where the protocol permits it.",files:[file("quantity.py","python",`def quantity(value):
    if type(value) is not int or not 1 <= value <= 64:
        raise ValueError("quantity must be an integer from 1 to 64")
    return value

def normalize(rows):
    return sorted((dict(row) for row in rows), key=lambda row: row["id"])

assert quantity(2) == 2
try:
    quantity(True)
except ValueError:
    pass
else:
    raise AssertionError("boolean accepted")`)],practice:[{id:"python-strict-parser",language:"py"}],steps:["Reject booleans at an integer boundary.","Copy borrowed records before normalization.","Test range limits and unchanged input."],pitfalls:["isinstance(value, int) accepts booleans.","Sorting the caller's list.","Relying on int() to validate syntax."],question:"Is bool a subclass of int in Python?",accepted:["yes"]}),
  lesson({number:48,id:"python-collections-order",track:"Python",title:"Counters, generators, and deterministic output",
    concepts:["Counter","Generators","Lazy iteration","Stable ordering"],model:"Iteration order is part of an observable result whenever the caller can see it.",why:["Counter groups hashable values without manual default initialization. Sort the final records by the contract's tie rule instead of relying on arrival order. A stable sort preserves input order for equal keys, but it does not invent a missing secondary key.","A generator computes values as they are consumed. Apply a consumption limit after filtering if the requirement counts accepted events; applying it first changes the answer. Stop consumption promptly so an infinite or expensive producer does not keep doing work after the requested limit."],game:"An event report should list tied event types consistently, regardless of callback arrival order.",decision:"Use lazy pipelines for bounded consumption and explicit ordering for reports.",files:[file("events.py","python",`from collections import Counter
from itertools import islice

def summary(events):
    counts = Counter(event["kind"] for event in events)
    return [{"kind": kind, "count": count}
            for kind, count in sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))]

def first_matching(events, kind, limit):
    selected = (event for event in events if event["kind"] == kind)
    return list(islice(selected, max(0, limit)))`)],practice:[{id:"python-event-groups",language:"py"},{id:"python-generator-limit",language:"py"}],steps:["Group counts without mutating source events.","Write an explicit tie-break rule.","Apply the limit to accepted events."],pitfalls:["Taking the limit before filtering.","Consuming the whole generator unnecessarily.","Unspecified order for tied counts."],question:"Does creating a generator consume every input item immediately?",accepted:["no"]}),
  lesson({number:49,id:"python-decimal-time",track:"Python",title:"Decimal money and timezone-aware instants",
    concepts:["Decimal","Quantization","Timezone awareness","UTC"],model:"A monetary amount and a timestamp each need a representation that preserves their domain meaning.",why:["Construct Decimal from a decimal string, not a binary float. Choose the rounding rule and the point at which rounding happens: rounding each line and rounding only the invoice total can differ. Serialize the final currency value in a representation agreed with the caller.","A timezone-aware timestamp identifies an instant. Normalize offsets to UTC before sorting and preserve a deterministic tie-break for equal instants. A naive local datetime is ambiguous without a timezone policy; reject it when the contract requires an aware value."],game:"A shop total must be exact, and an audit log from multiple timezones must order actual instants.",decision:"Use Decimal for price arithmetic and aware datetimes for cross-service ordering.",files:[file("money_time.py","python",`from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone

def total(lines):
    value = sum((Decimal(row["price"]) * row["quantity"] for row in lines), Decimal("0"))
    return format(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), ".2f")

def instant(text):
    value = datetime.fromisoformat(text.replace("Z", "+00:00"))
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("timezone required")
    return value.astimezone(timezone.utc)`)],practice:[{id:"python-decimal-cart",language:"py"},{id:"python-utc-order",language:"py"}],steps:["Create Decimal from string prices.","Specify when and how to round.","Order aware timestamps after UTC normalization."],pitfalls:["Decimal(0.1) preserves a binary approximation.","Mixing naive and aware timestamps.","Comparing timestamp strings as instants."],question:"Which Python numeric type represents decimal money exactly?",accepted:["decimal","decimal.decimal"]}),
  lesson({number:50,id:"python-async-structured",track:"Python",title:"Async tasks, ordered results, and structured cancellation",
    concepts:["asyncio","TaskGroup","Awaitables","Cancellation"],model:"A task should not outlive the scope that owns its result.",why:["Calling an async function creates an awaitable; it does not run it to completion. TaskGroup owns a set of child tasks, waits for them at exit and cancels siblings when a child fails. Keep references in input order if the output must retain that order, even when completion order differs.","Cancellation is a control signal that cleanup must respect. Use finally or an async context manager to release resources, then let CancelledError propagate. Avoid blocking calls inside async code; the Pyodide judge has one event loop and does not provide production server thread behavior."],game:"Closing a player session must stop all in-flight work owned by that session.",decision:"Use a bounded task scope and retain result order explicitly.",files:[file("tasks.py","python",`import asyncio

async def ordered(values, worker):
    async with asyncio.TaskGroup() as group:
        tasks = [group.create_task(worker(value)) for value in values]
    return [task.result() for task in tasks]

async def worker(value):
    await asyncio.sleep(0)
    return value * 2`)],practice:[{id:"python-async-gather",language:"py"},{id:"service-cancellation",language:"py"}],steps:["Own concurrent tasks inside one scope.","Preserve result order independently of completion.","Test failure and cancellation cleanup."],pitfalls:["Fire-and-forget without an owner.","Swallowing CancelledError.","Blocking inside an async endpoint."],question:"Which asyncio context owns and waits for child tasks?",accepted:["taskgroup","asyncio.taskgroup"]}),
  lesson({number:51,id:"python-context-protocol",track:"Python",title:"Context managers and structural service contracts",
    concepts:["asynccontextmanager","Protocol","Dependency injection","Cleanup"],model:"Acquisition and release belong to one scope, even when the body raises.",why:["An async context manager makes setup and cleanup one construct. Put the yield inside try/finally so normal return, exception and cancellation all release the resource. Do not put cleanup after yield without finally; an exception is thrown back into the generator at that point.","Protocol describes the operations a service needs without forcing inheritance. Inject a narrow protocol into the domain function, then use a deterministic fake in tests and a real implementation at deployment. Structural typing helps the compiler; runtime behavior still needs contract tests."],game:"An acquired purchase session must close on both a successful grant and a rejected purchase.",decision:"Scope resources with context managers and inject the smallest service contract.",files:[file("session.py","python",`from contextlib import asynccontextmanager
from typing import Protocol

class Ledger(Protocol):
    async def close(self) -> None: ...

@asynccontextmanager
async def owned_session(open_session):
    session: Ledger = await open_session()
    try:
        yield session
    finally:
        await session.close()`)],practice:[{id:"python-context-cleanup",language:"py"}],steps:["Pair acquire and close in one scope.","Keep close in finally.","Verify trace order on success and exception."],pitfalls:["Cleanup only on normal return.","Injecting the whole application into a small service.","Assuming a Protocol enforces runtime validation."],question:"Which block guarantees cleanup when the body raises?",accepted:["finally","try finally","try/finally"]}),
  lesson({number:52,id:"python-dataclasses-bundles",track:"Python",title:"Dataclasses, independent defaults, and Python bundles",
    concepts:["Dataclasses","default_factory","Mutable defaults","Python entrypoint"],model:"A new domain object must not inherit another instance's mutable state.",why:["Use default_factory for collections so each dataclass instance receives its own list. frozen prevents field assignment, but it does not recursively freeze a list stored in a field. Prefer tuples for immutable data and copy borrowed collections when publishing a new record.","A .pyplugin bundle declares a Python entrypoint and metadata in plugin.yml. The Academy pure Python profile executes solve(input), while a deployed bundle uses the generated Python SDK callbacks. Keep the tested domain logic independent of the deployment entrypoint."],game:"One party session's scopes or members must not appear in a newly created session.",decision:"Use dataclasses for internal values and schema models for untrusted wire input.",files:[file("party.py","python",`from dataclasses import dataclass, field, replace

@dataclass
class Party:
    name: str
    members: list[str] = field(default_factory=list)

def normalized(party: Party) -> Party:
    return replace(party, name=party.name.strip(), members=list(party.members))

first, second = Party("One"), Party("Two")
first.members.append("Alex")
assert second.members == []`),file("plugin.yml","yaml",`name: AcademyPython
version: "1.0"
main: main.py`)],practice:[{id:"python-dataclass-copy",language:"py"},{id:"manifest-python",language:"yaml"}],steps:["Allocate collection defaults per instance.","Copy mutable fields when publishing a value.","Declare the Python runtime entrypoint."],pitfalls:["Sharing a list default.","Expecting frozen to freeze nested lists.","Shipping an entrypoint different from the manifest."],question:"What creates an independent dataclass collection default?",accepted:["default_factory","field(default_factory=list)"]}),
  lesson({number:53,id:"c-integers-shifts",track:"C",title:"Integer widths, promotions, and total shift functions",
    concepts:["uint64_t","Integer promotions","Undefined behavior","Shift bounds"],model:"WebAssembly does not repair undefined behavior in C source before compilation.",why:["A shift count must be less than the promoted left operand's width. Use an unsigned fixed-width value and a constant of the correct type, then check the count before evaluating the shift. Signed left overflow and negative shift counts require separate attention.","Define the out-of-range policy in the function contract: return zero or report failure, rather than evaluating an invalid shift. Check boundaries 0, width-1, width and larger. Hexadecimal string fixtures preserve exact 64-bit words across the browser's JSON number boundary."],game:"Packet flag masks need the same result for a valid bit and a deliberate failure policy for an invalid bit index.",decision:"Use fixed-width unsigned arithmetic for bit representations and validate shift counts first.",files:[file("shift.c","c",`#include <stdbool.h>
#include <stdint.h>
#include <graaly/bits.h>

uint64_t logical_left(uint64_t value, unsigned count) {
    return count < 64u ? value << count : UINT64_C(0);
}
bool flag32(unsigned bit, uint32_t *out) {
    return graaly_u32_shift_left(UINT32_C(1), bit, out);
}`)],practice:[{id:"c-safe-shift",language:"c"},{id:"c-field-mask",language:"c"}],steps:["Use unsigned operands of the intended width.","Reject or define counts at the width boundary.","Test the highest bit and out-of-range counts."],pitfalls:["1 << 63 uses the wrong operand type.","Checking after the shift.","Expecting Wasm masking to define invalid C."],question:"Is shifting a 64-bit C operand by 64 defined?",accepted:["no"]}),
  lesson({number:54,id:"c-bitset-storage",track:"C",title:"Caller-owned bitsets with the Graaly SDK",
    concepts:["Bitsets","Caller-owned storage","Bounds","Popcount"],model:"A bitset is a logical bit count plus enough words to store those bits.",why:["Compute words as bits/64 plus one when a remainder exists, avoiding the overflow-prone expression (bits+63)/64. graaly_bitset_init checks capacity and clears the required words; it does not allocate or free storage. The caller keeps that storage alive for the set's whole lifetime.","Logical bounds matter even when spare physical bits exist. A 70-bit set uses two words, but bit 70 remains invalid. The SDK get/put operations report failure for invalid access, and count masks the unused tail bits. Check return values instead of interpreting failure as a false bit."],game:"A subscription filter or region membership mask can store many booleans without one host handle per flag.",decision:"Use fixed local storage when the maximum is known; allocate checked storage when the bit count is dynamic.",files:[file("bitset.c","c",`#include <graaly/bits.h>

size_t enabled_count(void) {
    uint64_t words[2];
    graaly_bitset_t set;
    if (!graaly_bitset_init(&set, words, 2, 70)) return 0;
    if (!graaly_bitset_put(&set, 0, true)) return 0;
    if (!graaly_bitset_put(&set, 69, true)) return 0;
    bool enabled = false;
    if (!graaly_bitset_get(&set, 69, &enabled) || !enabled) return 0;
    return graaly_bitset_count(&set);
}`)],practice:[{id:"c-sdk-bitset",language:"c"},{id:"c-word-count",language:"c"}],steps:["Compute word capacity without addition overflow.","Initialize caller-owned storage through the real SDK.","Test last logical bit and the invalid next bit."],pitfalls:["Returning a bitset backed by a local array.","Ignoring initialization failure.","Counting unused tail bits."],question:"Does graaly_bitset_init allocate storage?",accepted:["no"]}),
  lesson({number:55,id:"c-bitset-algebra",track:"C",title:"Union, intersection, difference, and tail padding",
    concepts:["Bitwise OR","Bitwise AND","Set difference","Tail masks"],model:"Physical storage may contain bits that do not belong to the logical set.",why:["Union uses OR, intersection uses AND, and difference uses a & ~b on corresponding words. Require equal logical lengths or define a deliberate conversion policy. Reusing a larger buffer can leave dirty bits beyond the logical end even when every valid bit is correct.","Mask the last word after an operation if the bit count has a remainder. Handle an exact multiple of 64 separately: shifting 1 by 64 to construct a mask is invalid. Tail normalization makes equality, serialization and count agree on the logical set."],game:"Combining permission masks must not accidentally enable unused packet flag positions.",decision:"Normalize the tail after every operation that writes full words.",files:[file("union.c","c",`#include <stdbool.h>
#include <stdint.h>
#include <graaly/bits.h>

bool bitset_union(graaly_bitset_t *out, const graaly_bitset_t *a,
                  const graaly_bitset_t *b) {
    if (!out || !a || !b || out->bit_count != a->bit_count
        || a->bit_count != b->bit_count) return false;
    size_t words = graaly_bitset_word_count(a->bit_count);
    if (words && (!out->words || !a->words || !b->words)) return false;
    for (size_t i = 0; i < words; ++i) out->words[i] = a->words[i] | b->words[i];
    unsigned tail = (unsigned)(a->bit_count % 64u);
    if (tail) out->words[words - 1] &= (UINT64_C(1) << tail) - 1;
    return true;
}`)],practice:[{id:"c-bitset-union",language:"c"},{id:"c-bitset-intersection",language:"c"},{id:"c-bitset-difference",language:"c"}],steps:["Validate matching logical lengths.","Implement OR, AND and AND-NOT word operations.","Test dirty tail bits and exact word boundaries."],pitfalls:["Masking by shifting 64.","Treating capacity as logical size.","Using logical || instead of bitwise |."],question:"Which operation computes set union per word?",accepted:["bitwise or","or","|"]}),
  lesson({number:56,id:"c-struct-padding",track:"C",title:"Alignment, offsetof, padding, and fieldwise equality",
    concepts:["Alignment","offsetof","Struct padding","Fieldwise equality"],model:"A struct layout is an ABI decision; its semantic value is the value of its fields.",why:["A compiler may place padding between fields and at the end so each array element remains aligned. Use sizeof, _Alignof and offsetof to observe the active ABI. wasm32 fixture measurements are not a promise about a different architecture or compiler target.","memcmp compares object representation, including padding bytes that are not part of the logical value. Two records with identical fields can differ in dirty padding. Compare fields directly and serialize each wire field explicitly; packing a struct is not a portable protocol design."],game:"A cached packet record must compare payload fields, while a network encoder must use the protocol's specified offsets.",decision:"Observe ABI layout for memory allocation; define wire layout independently.",files:[file("record.c","c",`#include <stddef.h>
#include <stdint.h>

typedef struct { uint8_t tag; uint32_t counter; uint16_t flags; } Record;
int equal_record(const Record *a, const Record *b) {
    return a->tag == b->tag && a->counter == b->counter && a->flags == b->flags;
}
size_t record_padding(void) {
    return sizeof(Record) - sizeof(uint8_t) - sizeof(uint32_t) - sizeof(uint16_t);
}
size_t counter_offset(void) { return offsetof(Record, counter); }`)],practice:[{id:"c-padding-size",language:"c"},{id:"c-fieldwise-equality",language:"c"}],steps:["Measure offsets, alignment and total size.","Compare fields rather than padding bytes.","Use the dirty-padding fixture to reject memcmp."],pitfalls:["Assuming sum of field sizes equals sizeof.","Sending a struct's raw bytes as a packet.","Expecting memset to make bytewise equality a universal rule."],question:"Which macro measures a field offset within a struct?",accepted:["offsetof","offsetof()"]}),
  lesson({number:57,id:"c-union-dispatch",track:"C",title:"Tagged unions and legal floating-point bit inspection",
    concepts:["Tagged unions","Active member","memcpy","Representation"],model:"The tag tells the reader which payload the producer actually stored.",why:["A union shares storage across members. Put a tag beside it, initialize the matching member and switch on the tag before reading. An unknown tag must fail before payload interpretation; no amount of storage capacity makes the wrong member a valid protocol value.","For bit inspection copy a float's representation into a same-sized unsigned integer with memcpy. Avoid pointer casts that violate effective-type or alignment rules. The exercise uses the target's actual float representation; serialization must still define byte order separately."],game:"A packet can carry a movement payload or a chat payload, but a receiver must dispatch by the declared packet kind.",decision:"Use tagged unions for mutually exclusive payloads and memcpy for representation copies.",files:[file("payload.c","c",`#include <stdint.h>
#include <string.h>
typedef enum { MOVE = 1, CHAT = 2 } Kind;
typedef struct {
    Kind kind;
    union { struct { int x, z; } move; unsigned chat_length; } data;
} Packet;
int payload_size(const Packet *packet) {
    switch (packet->kind) {
        case MOVE: return 8;
        case CHAT: return (int)packet->data.chat_length;
        default: return -1;
    }
}
uint32_t float_bits(float value) {
    _Static_assert(sizeof(float) == sizeof(uint32_t), "32-bit float required");
    uint32_t bits; memcpy(&bits, &value, sizeof bits); return bits;
}`)],practice:[{id:"c-tagged-union",language:"c"},{id:"c-float-bits",language:"c"}],steps:["Keep tag and payload construction together.","Reject unknown tags before reading the union.","Inspect negative zero with memcpy."],pitfalls:["Reading every union member.","Treating an unknown tag as a known default.","Aliasing float through uint32_t*."],question:"Which function legally copies float representation into same-sized integer storage?",accepted:["memcpy","memcpy()"]}),
  lesson({number:58,id:"c-wire-decoding",track:"C",title:"Byte order, bounded VarInts, and overlap-safe moves",
    concepts:["Endianness","VarInt","Bounds checks","memmove"],model:"A wire format is a sequence of bytes with explicit ordering and limits.",why:["Decode a multi-byte integer from unsigned bytes and shifts instead of casting the byte buffer to uint32_t*. A cast can violate alignment, type and byte-order requirements simultaneously. Check length before reading and do not advance the cursor until the complete value is available.","A Minecraft-style 32-bit VarInt requires a bounded loop and a check on the fifth byte's high bits. Continuation without termination is an error. Use memmove for overlapping buffer ranges; memcpy only permits non-overlapping ranges. These conditions belong in tests because ordinary short packets rarely expose them."],game:"Packet parsing must reject truncated or overlong fields without reading beyond the received payload.",decision:"Make byte order and maximum encoded length explicit in each decoder.",files:[file("wire.c","c",`#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>
#include <string.h>
bool read_be32(const uint8_t *bytes, size_t length, uint32_t *out) {
    if (!bytes || !out || length < 4) return false;
    *out = ((uint32_t)bytes[0] << 24) | ((uint32_t)bytes[1] << 16)
         | ((uint32_t)bytes[2] << 8) | (uint32_t)bytes[3];
    return true;
}
bool consume(uint8_t *bytes, size_t *length, size_t count) {
    if (!bytes || !length || count > *length) return false;
    memmove(bytes, bytes + count, *length - count); *length -= count; return true;
}`)],practice:[{id:"c-big-endian",language:"c"},{id:"c-varint",language:"c"},{id:"c-overlap-move",language:"c"}],steps:["Read bytes only after validating length.","Bound continuation decoding and reject excess high bits.","Use memmove when ranges overlap."],pitfalls:["Casting an unaligned packet pointer.","An unbounded continuation loop.","Using memcpy for buffer compaction."],question:"Which copy operation permits overlapping ranges?",accepted:["memmove","memmove()"]}),
  lesson({number:59,id:"c-allocation-ownership",track:"C",title:"Checked allocation, lifetimes, and host handles",
    concepts:["SIZE_MAX","Allocation overflow","Ownership","Idempotent cleanup"],model:"Allocated memory and host handles have separate owners and separate release operations.",why:["Check count > SIZE_MAX/element_size before multiplication. A wrapped byte count can allocate less storage than the loop will write. Define the zero-count case, check malloc failure and keep allocation, use and free within an obvious lifetime.","A numeric host handle is an opaque identity, not a pointer into guest memory. Use the generated SDK's matching release operation for owned handles and do not release borrowed handles. Make teardown idempotent and deduplicate aliases so one resource is not released twice."],game:"A plugin owns some scheduled tasks and subscriptions, but borrows a player context supplied by a callback.",decision:"Document ownership beside each handle and byte buffer; never infer ownership from its numeric representation.",files:[file("allocate.c","c",`#include <stdint.h>
#include <stddef.h>
#include <stdlib.h>
void *allocate_items(size_t count, size_t size) {
    if (size != 0 && count > SIZE_MAX / size) return NULL;
    if (count == 0 || size == 0) return NULL;
    return malloc(count * size);
}
void release_owned(uint32_t *handles, size_t count, void (*release)(uint32_t)) {
    for (size_t i = 0; i < count; ++i) {
        if (!handles[i]) continue;
        uint32_t handle = handles[i];
        for (size_t j = i; j < count; ++j) if (handles[j] == handle) handles[j] = 0;
        release(handle);
    }
}`)],practice:[{id:"c-checked-allocation",language:"c"},{id:"c-lifecycle-handles",language:"c"}],steps:["Check multiplication before allocating.","Separate memory ownership from handle ownership.","Test duplicate handles and repeated cleanup."],pitfalls:["Checking overflow after multiplication.","Casting a host handle to a pointer.","Freeing borrowed callback data."],question:"Should allocation overflow be checked before or after multiplication?",accepted:["before"]}),
  lesson({number:60,id:"c-json-practice",track:"C",title:"Implement any Academy contract in real C17",
    concepts:["cJSON","JSON ownership","C17/WASI","Portable algorithms"],model:"A JSON harness provides input and output plumbing; your C function still performs the algorithm.",why:["Every exercise has a C profile. Native memory exercises keep typed harnesses; other contracts use cJSON through graaly/academy_json.h. j_get borrows a value, while constructors and setters use the harness-owned arena. Return a result and let the trusted harness serialize and release its roots.","Do not embed an expected answer or delegate to another language. Implement the contract in C and test the same examples and edge cases. Exact 64-bit words use string fixtures where JSON numbers cannot preserve them. Framework exercises describe their observable state or protocol behavior; select the framework profile to execute hooks or endpoints themselves."],game:"Normalize a teleport's yaw and pitch in C before applying the same policy to a real SDK teleport.",decision:"Keep the algorithm pure and put SDK side effects behind a separately tested adapter.",files:[file("orientation.c","c",`#include <graaly/academy_json.h>
#include <math.h>
J *solve(J *input) {
    double yaw = j_number(j_get(input, j_str("yaw"), j_num(0)));
    double pitch = j_number(j_get(input, j_str("pitch"), j_num(0)));
    yaw = fmod(fmod(yaw, 360.0) + 360.0, 360.0);
    pitch = fmax(-90.0, fmin(90.0, pitch));
    return j_object(2, j_str("yaw"), j_num(yaw), j_str("pitch"), j_num(pitch));
}`)],practice:[{id:"world-orientation",language:"c"}],steps:["Read borrowed JSON through the C helper API.","Build a result without changing input.","Compile and run all cases with Clang/WASI."],pitfalls:["Releasing a borrowed JSON node.","Treating browser JSON numbers as exact uint64_t.","Replacing the algorithm with fixture lookup."],question:"Which language executes the algorithm in the C profile?",accepted:["c","c17"]}),
  lesson({number:61,id:"html-native-semantics",track:"HTML / CSS",title:"Semantic native markup, actions, and accessible names",
    concepts:["Native HTML subset","Inventory metadata","data-action","Accessible labels"],model:"Markup describes a native game surface; it does not create a web page inside Minecraft.",why:["The main element declares inventory identity, rows and title. A button with data-action becomes a native action item; data-material chooses its Minecraft material. Keep action IDs stable because callbacks use them as protocol identities rather than visible labels.","Visible text and accessible labels have different jobs. aria-label can supply the native inventory title or a meaningful item name, while a data-action remains unchanged across translations. Use the supported subset and inspect the resulting native snapshot instead of judging the markup by browser rendering."],game:"A shop menu becomes real inventory items whose actions are dispatched through the UI protocol.",decision:"Give each action a stable ID and each surface a clear player-facing name.",files:[file("menu.html","html",`<main id="shop" data-rows="3" aria-label="Academy shop">
  <button data-action="shop.buy" data-material="DIAMOND"
          aria-label="Buy one diamond">Buy</button>
</main>`)],practice:[{id:"html-inventory-metadata",language:"html"},{id:"html-accessible-label",language:"html"}],steps:["Declare inventory identity and row count.","Separate action IDs from visible labels.","Inspect compiled native names and slots."],pitfalls:["Expecting a browser DOM.","Using a translated label as an action ID.","Inventing unsupported HTML attributes."],question:"Does native Graaly HTML create a browser DOM in Minecraft?",accepted:["no"]}),
  lesson({number:62,id:"css-native-grid",track:"HTML / CSS",title:"Grid lines, spans, and nested native panels",
    concepts:["Grid coordinates","Spans","Nine columns","Nested layout"],model:"An inventory is a bounded nine-column grid with numbered slots.",why:["CSS grid line coordinates begin at one, while inventory slots begin at zero. For a simple top-level cell the slot is (row-1)*9+(column-1). A span can paint multiple adjacent native items for one action; its physical coverage must stay inside the inventory.","Nested panels establish local layout coordinates. Test both the parent's placement and the child's relative position. Hiding an element must not leave an invisible item occupying a slot. The native compiler's supported layout rules are the contract, rather than a browser's complete CSS grid specification."],game:"A bordered panel and a wide confirm action can share an inventory without overlapping unrelated buttons.",decision:"Plan slot ownership before adding spans or nested panels.",files:[file("grid.html","html",`<style>
  .confirm { grid-row: 2; grid-column: 3 / span 3; }
  .hidden { display: none; }
</style>
<main data-rows="3" aria-label="Confirm purchase">
  <button class="confirm" data-action="confirm" data-material="EMERALD">Confirm</button>
  <button class="hidden" data-action="debug">Debug</button>
</main>`)],practice:[{id:"html-grid-position",language:"html"},{id:"html-grid-span",language:"html"},{id:"html-nested-grid",language:"html"}],steps:["Translate grid lines into native slots.","Bound spans to the inventory.","Verify nested offsets and hidden elements."],pitfalls:["Confusing slot zero with grid line one.","Overlapping independently owned actions.","Assuming full browser grid behavior."],question:"How many columns does a native inventory row have?",accepted:["9","nine"]}),
  lesson({number:63,id:"css-cascade-variables",track:"HTML / CSS",title:"Specificity, source order, inheritance, and native variables",
    concepts:["Specificity","Source order","Inheritance","Custom properties"],model:"A computed native style comes from a deliberate cascade, not whichever rule looks closest.",why:["When supported rules target the same property, selector specificity resolves stronger matches and source order breaks equal ties. Inline declarations have their own precedence. Keep selectors narrow and test the resulting item property, because an attractive browser mockup cannot prove the native cascade.","Inherited text style and custom properties allow a menu theme to flow into its children. Graaly also uses supported custom properties for Minecraft-specific item settings. A fallback should be explicit when a variable may be absent; do not assume arbitrary browser CSS functions are available."],game:"A menu theme can style all labels while one selected purchase button has a distinct color.",decision:"Prefer a small theme plus explicit state selectors over layers of conflicting overrides.",files:[file("theme.html","html",`<style>
  main { color: white; }
  .choice { color: yellow; }
  #selected { color: green; }
  .choice { color: red; }
</style>
<main data-rows="1" aria-label="Choose">
  <button id="selected" class="choice" data-action="choose" data-material="EMERALD">Selected</button>
</main>`)],practice:[{id:"html-css-specificity",language:"html"},{id:"html-css-source-order",language:"html"},{id:"html-css-variables",language:"html"}],steps:["Predict the winning rule for each property.","Distinguish inherited values from direct declarations.","Inspect the compiled color and item metadata."],pitfalls:["Assuming the last rule always wins.","Unsupported browser-only style values.","Overriding a theme with accidental inline style."],question:"What breaks a tie between equal-specificity CSS rules?",accepted:["source order","order"]}),
  lesson({number:64,id:"html-native-forms",track:"HTML / CSS",title:"Text input, confirmation, and cancellation contracts",
    concepts:["Native dialogs","Text input","Confirmation","Cancellation"],model:"An input action can complete, cancel, or lose its owning session.",why:["Native forms compile to supported Minecraft interaction surfaces, not DOM input controls. Declare the action and the limits supported by the compiler, then handle its result through the native callback contract. A cancellation result must remain distinguishable from an empty submitted string.","A confirmation dialog should name both choices and give each action a stable identity. Revalidate the domain decision after submission: inventory, permission or price may have changed while the dialog was open. UI validation improves the interaction, while authoritative validation protects the game state."],game:"Renaming a party must not apply an empty name just because the player closed the input surface.",decision:"Treat completion and cancellation as different transitions and recheck the server-side invariant.",files:[file("input.html","html",`<main data-rows="1" aria-label="Party name">
  <input id="name" type="text" data-action="party.rename" data-cancel-action="party.cancel"
         placeholder="Enter a name" value="Raid party" />
</main>`)],practice:[{id:"html-native-input",language:"html"},{id:"html-confirm-dialog",language:"html"},{id:"react-input-cancel",language:"html"}],steps:["Declare a native input action.","Keep cancellation separate from empty submission.","Revalidate the current domain state on commit."],pitfalls:["Expecting browser submit events.","Treating cancellation as an empty value.","Trusting a stale displayed price."],question:"Should cancellation and an empty submitted string be the same state?",accepted:["no"]}),
  lesson({number:65,id:"html-algorithm-profile",track:"HTML / CSS",title:"Combine an algorithm with checked native HTML and CSS",
    concepts:["Algorithm profile","Native compilation","JSON result","HTML escaping"],model:"JavaScript computes the result; native markup presents the result under a checked UI contract.",why:["Any Academy exercise can use the HTML/CSS profile. Put solve(input) in the marked module script and leave {{result}} on the result action. The playground extracts and executes that algorithm in its worker, escapes the JSON result and compiles the remaining markup through the native UI compiler.","This script convention belongs to the Academy adapter, not to deployed native HTML. A production bundle keeps its logic in a JS/TS entrypoint and supplies markup through the UI SDK. Do not remove or hide the result action: the judge decodes the compiled native label and checks the same examples and edge cases."],game:"You can practice a teleport algorithm while rendering its returned yaw and pitch in a native inventory.",decision:"Separate algorithm logic from presentation and keep the result visible through native compilation.",files:[file("orientation.html","html",`<style>.result { grid-row: 1; grid-column: 1 / span 9; color: white; }</style>
<main data-rows="1" aria-label="Orientation result">
  <button class="result" data-action="academy.result" data-material="PAPER">{{result}}</button>
</main>
<script type="module" data-academy-solution>
export function solve(input) {
  return { yaw: ((input.yaw % 360) + 360) % 360,
           pitch: Math.max(-90, Math.min(90, input.pitch)) };
}
</script>`)],practice:[{id:"world-orientation",language:"html"}],steps:["Implement the algorithm in the marked module.","Keep a visible native result action.","Test both the returned JSON and compiled markup."],pitfalls:["Assuming native HTML executes inline scripts on a server.","Inserting raw unescaped JSON into markup.","Hiding the result to bypass presentation checks."],question:"What computes the algorithm in the HTML/CSS Academy profile?",accepted:["javascript","js"]}),
  lesson({number:66,id:"pydantic-strict-fields",track:"Pydantic",title:"Strict fields and forbidden extras before side effects",
    concepts:["BaseModel","ConfigDict","Strict fields","Extra policy"],model:"Validation turns untrusted input into a value that satisfies a declared contract.",why:["Pydantic normally supports useful conversions, but a purchase quantity may require a strict integer. Set strict fields or strict model policy and declare bounds. extra='forbid' catches misspelled or injected fields instead of silently accepting an ambiguous request.","Use model_validate for Python data and model_validate_json when the input is JSON text. Error type, location and context explain which boundary failed. Keep a validated request distinct from the service result and the public response so input acceptance does not leak internal output fields."],game:"A purchase must reject quantity=true, negative quantity and an undeclared admin field before inventory changes.",decision:"Choose coercion and extra-field policies deliberately for each wire model.",files:[file("request.py","python",`from pydantic import BaseModel, ConfigDict, Field

class Purchase(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    player: str = Field(min_length=3, max_length=16)
    quantity: int = Field(ge=1, le=64)

request = Purchase.model_validate({"player": "Alex", "quantity": 2})
assert request.quantity == 2`)],practice:[{id:"purchase-model",language:"pydantic"},{id:"api-purchase-body",language:"fastapi"}],steps:["Declare strict type and range checks.","Forbid undeclared purchase fields.","Inspect error locations before any side effect."],pitfalls:["Accepting boolean quantity through coercion.","Ignoring unknown fields unintentionally.","Treating validation as authorization."],question:"Which extra-field policy rejects unknown model fields?",accepted:["forbid","extra='forbid'","extra=forbid"]}),
  lesson({number:67,id:"pydantic-validator-order",track:"Pydantic",title:"Normalization and cross-field invariants",
    concepts:["field_validator","model_validator","Validator order","Finite values"],model:"Normalize representation first, then enforce invariants on the validated model.",why:["A before field validator receives raw input, so check its type before calling string methods. Normalize only transformations allowed by the domain, such as stripping and lowercasing a slug. Normalization must not turn an invalid identifier into an unrelated valid identity.","An after model validator can compare fields that have already passed their individual checks. A trade window requires start before end, and a transfer cannot send to itself. Return the model from an after validator, and report invariant failures before a service executes."],game:"A party trade needs valid individual amounts and a valid relationship between sender and recipient.",decision:"Place one-field normalization on a field and multi-field rules on the model.",files:[file("trade.py","python",`from typing import Self
from pydantic import BaseModel, Field, field_validator, model_validator

class Trade(BaseModel):
    sender: str
    recipient: str
    quantity: int = Field(ge=1, le=64)

    @field_validator("sender", "recipient", mode="before")
    @classmethod
    def normalized(cls, value):
        if not isinstance(value, str): raise ValueError("identifier must be text")
        return value.strip().lower()

    @model_validator(mode="after")
    def different_players(self) -> Self:
        if self.sender == self.recipient: raise ValueError("self trade")
        return self`)],practice:[{id:"trade-invariant-model",language:"pydantic"},{id:"slug-normalization-model",language:"pydantic"}],steps:["Validate raw types in before validators.","Normalize permitted representations.","Enforce relationships after field validation."],pitfalls:["Calling strip on arbitrary raw input.","Comparing unvalidated fields.","Forgetting to return the model."],question:"Which validator handles an invariant across multiple fields?",accepted:["model_validator","model validator"]}),
  lesson({number:68,id:"pydantic-alias-union",track:"Pydantic",title:"Aliases, nested models, and discriminated payloads",
    concepts:["Aliases","Nested models","Discriminators","Tagged unions"],model:"A wire name and an internal field name can differ without becoming two sources of truth.",why:["Declare an alias for the external protocol field and serialize with by_alias when the caller expects that wire spelling. Validation aliases and serialization aliases can have different jobs. Keep nested models typed so invalid members produce precise nested error locations.","A discriminated union uses a Literal tag to choose a payload schema. It avoids guessing among overlapping models and makes an unknown tag an explicit error. Add bounds and uniqueness rules to collections rather than assuming each individually valid member makes the whole collection valid."],game:"Realtime packet payloads share an envelope but movement and chat events require different fields.",decision:"Use an explicit discriminator for protocol variants and preserve wire aliases at serialization.",files:[file("events.py","python",`from typing import Annotated, Literal
from pydantic import BaseModel, Field, TypeAdapter

class Move(BaseModel):
    kind: Literal["move"]
    x: float
    z: float

class Chat(BaseModel):
    kind: Literal["chat"]
    text: str = Field(min_length=1)

Event = Annotated[Move | Chat, Field(discriminator="kind")]
event = TypeAdapter(Event).validate_python({"kind": "chat", "text": "Hello"})
assert event.kind == "chat"`)],practice:[{id:"packet-discriminator-model",language:"pydantic"},{id:"api-alias-model",language:"pydantic"},{id:"nested-party-model",language:"pydantic"}],steps:["Declare stable external field aliases.","Tag each union member with a Literal.","Test unknown tags and invalid nested members."],pitfalls:["Serializing internal names into the wire protocol.","An untagged ambiguous union.","Validating members without collection invariants."],question:"What selects a discriminated union's payload model?",accepted:["discriminator","tag","discriminator tag"]}),
  lesson({number:69,id:"pydantic-serialization",track:"Pydantic",title:"Computed fields, secrets, Decimal, and JSON output",
    concepts:["computed_field","SecretStr","Decimal","JSON serialization"],model:"The public response is a separate schema, rather than a dump of everything the service knows.",why:["A computed_field can derive a total from validated quantity and unit price without storing a second mutable total. Decimal preserves currency precision, while model_dump(mode='json') produces JSON-compatible representations. Agree on wire formats instead of depending on Python repr.","SecretStr masks accidental display, but a response model should omit secret fields entirely when the API must not expose them. Do not call get_secret_value during public serialization. Test absence of sensitive keys, rather than merely checking that a masked string appears."],game:"A shop response should expose the total and order ID while excluding service tokens and internal balance notes.",decision:"Derive totals from trusted values and publish only an explicit output model.",files:[file("response.py","python",`from decimal import Decimal
from pydantic import BaseModel, SecretStr, computed_field

class InternalOrder(BaseModel):
    token: SecretStr
    price: Decimal
    quantity: int

class PublicOrder(BaseModel):
    price: Decimal
    quantity: int
    @computed_field
    @property
    def total(self) -> Decimal:
        return self.price * self.quantity

public = PublicOrder(price=Decimal("1.25"), quantity=2).model_dump(mode="json")
assert public["total"] == "2.50" and "token" not in public`)],practice:[{id:"computed-total-model",language:"pydantic"},{id:"decimal-price-model",language:"pydantic"}],steps:["Use Decimal for currency input.","Derive totals rather than duplicating state.","Verify public output contains no secret field."],pitfalls:["Dumping an internal model as a public response.","Unwrapping SecretStr into JSON.","Building Decimal from a float."],question:"Should a secret field be omitted from a response that must not expose it?",accepted:["yes"]}),
  lesson({number:70,id:"pydantic-immutability-profile",track:"Pydantic",title:"Frozen models, default factories, and any-exercise validation",
    concepts:["Frozen models","default_factory","RootModel","JsonValue"],model:"Frozen field assignment and independent mutable defaults solve different problems.",why:["ConfigDict(frozen=True) rejects assigning a new field value, but a contained list can still be mutated. Use default_factory so each instance gets independent storage and use an immutable collection when recursive immutability is required. The Academy model probe creates two actual model instances and tests both properties.","Every exercise also offers a Pydantic profile with real RootModel[JsonValue] input and output boundaries. Replace these generic boundaries with domain models as you refine the algorithm. A generic JSON model checks JSON shape; it does not automatically know your business rules."],game:"Frozen session configuration must resist reassignment without sharing scopes between unrelated sessions.",decision:"Choose frozen values for stable configuration, and validate domain rules beyond generic JSON.",files:[file("session.py","python",`from pydantic import BaseModel, ConfigDict, Field, JsonValue, RootModel

class Session(BaseModel):
    model_config = ConfigDict(frozen=True)
    player: str
    scopes: list[str] = Field(default_factory=list)

class Input(RootModel[JsonValue]): pass
class Output(RootModel[JsonValue]): pass

first, second = Session(player="Alex"), Session(player="Sam")
first.scopes.append("read")
assert second.scopes == []`)],practice:[{id:"immutable-session-model",language:"pydantic"},{id:"world-orientation",language:"pydantic"}],steps:["Separate frozen assignment from nested mutability.","Allocate defaults independently.","Strengthen a generic JSON boundary with domain validation."],pitfalls:["Expecting frozen to recursively freeze.","Sharing defaults across instances.","Treating JsonValue as a business schema."],question:"Does a frozen Pydantic model recursively freeze its contained list?",accepted:["no"]}),
  lesson({number:71,id:"asgi-scope-routing",track:"ASGI",title:"ASGI scopes, byte headers, and explicit routing",
    concepts:["ASGI scope","HTTP routing","Byte headers","Protocol types"],model:"ASGI is an asynchronous message protocol between a server and an application.",why:["An application receives scope, receive and send. The scope identifies the protocol and supplies request metadata; HTTP, lifespan and WebSocket scopes require different handling. Route by method and decoded path, and return deliberate 404 or 405 results rather than allowing fallthrough.","ASGI headers are sequences of byte pairs, so preserve duplicates and compare header names case-insensitively. Do not turn all headers into a dict if duplicate values have meaning. The browser judge drives actual protocol messages and validates their ordering."],game:"A lightweight Python service can expose a readiness route without adopting a larger framework.",decision:"Use raw ASGI when you need protocol-level control and can own its complete contract.",files:[file("app.py","python",`async def app(scope, receive, send):
    if scope["type"] != "http":
        raise RuntimeError("This example supports HTTP only")
    ready = scope["method"] == "GET" and scope["path"] == "/health"
    await send({"type": "http.response.start", "status": 200 if ready else 404,
                "headers": [(b"content-type", b"application/json")]})
    await send({"type": "http.response.body",
                "body": b'{"ready":true}' if ready else b'{"detail":"Not found"}',
                "more_body": False})`)],practice:[{id:"asgi-routing",language:"asgi"},{id:"asgi-header-auth",language:"asgi"}],steps:["Check the protocol type before routing.","Handle method and path explicitly.","Read headers as byte pairs with a declared duplicate policy."],pitfalls:["Assuming every scope is HTTP.","Comparing a byte header to a string.","Losing duplicate headers in a dict."],question:"Which ASGI argument contains protocol and request metadata?",accepted:["scope"]}),
  lesson({number:72,id:"asgi-body-streams",track:"ASGI",title:"Chunked bodies, response ordering, and disconnects",
    concepts:["http.request","more_body","Response frames","Disconnect"],model:"One HTTP body can arrive as many messages, while one response must still obey a single ordered lifecycle.",why:["Receive body chunks until more_body becomes false. Impose a byte limit before accumulating untrusted data, and handle http.disconnect instead of waiting forever. Decode only after the full body arrives so a multibyte character split across frames is not decoded prematurely.","Send http.response.start once before any body frame. Every non-final response frame uses more_body=true; the final frame uses false. Once the response finishes, do not send another body. Streaming changes delivery shape, not permission to violate protocol order."],game:"A service receiving a party payload must parse all chunks before validating the request.",decision:"Bound memory, distinguish disconnect from completion, and test frame ordering.",files:[file("body.py","python",`async def body_bytes(receive, limit=65536):
    parts = []; size = 0
    while True:
        message = await receive()
        if message["type"] == "http.disconnect": raise ConnectionError("disconnected")
        if message["type"] != "http.request": raise ValueError("unexpected frame")
        part = message.get("body", b""); size += len(part)
        if size > limit: raise ValueError("body too large")
        parts.append(part)
        if not message.get("more_body", False): return b"".join(parts)`)],practice:[{id:"asgi-body-chunks",language:"asgi"},{id:"asgi-stream-response",language:"asgi"}],steps:["Accumulate bounded body bytes across frames.","Handle a disconnected caller.","Send start before body and terminate the final frame."],pitfalls:["Assuming one receive is the whole body.","Decoding each byte chunk independently.","Sending body before response.start."],question:"Which flag tells ASGI that more body frames follow?",accepted:["more_body"]}),
  lesson({number:73,id:"asgi-solve-profile",track:"ASGI",title:"Expose any algorithm through a real ASGI application",
    concepts:["JSON endpoint","Protocol adapter","Async results","Contract parity"],model:"The protocol adapter translates messages; the domain function owns the algorithm.",why:["Every Academy problem can be implemented with an ASGI profile. Its adapter receives POST /solve, decodes the same JSON fixture, calls your solve function and sends the returned JSON. The judge validates actual response messages and status, rather than simulating a route decorator.","Keep the algorithm independent so the same behavior can be compared with C, Python or JavaScript. Check whether a returned value is awaitable before awaiting it. A production adapter also needs routing, body limits, disconnect handling and an explicit error policy; the minimal exercise adapter does not claim to be a deployed service."],game:"An orientation normalization algorithm can be served through ASGI while preserving exactly the same edge cases.",decision:"Share domain behavior across adapters while testing each adapter's own protocol obligations.",files:[file("orientation_asgi.py","python",`import json
from inspect import isawaitable

def solve(value):
    return {"yaw": value["yaw"] % 360,
            "pitch": min(90, max(-90, value["pitch"]))}

async def app(scope, receive, send):
    parts = []
    while True:
        frame = await receive(); parts.append(frame.get("body", b""))
        if not frame.get("more_body", False): break
    result = solve(json.loads(b"".join(parts)))
    if isawaitable(result): result = await result
    await send({"type": "http.response.start", "status": 200,
                "headers": [(b"content-type", b"application/json")]})
    await send({"type": "http.response.body", "body": json.dumps(result).encode(), "more_body": False})`)],practice:[{id:"world-orientation",language:"asgi"}],steps:["Keep solve independent of ASGI messages.","Serialize the same result through a real response.","Verify algorithm parity and response ordering."],pitfalls:["Putting an expected fixture answer in the adapter.","Awaiting a non-awaitable.","Treating a minimal exercise adapter as production-ready."],question:"Should domain logic depend on ASGI frame dictionaries?",accepted:["no"]}),
  lesson({number:74,id:"sql-order-joins",track:"SQL",title:"Deterministic leaderboards and outer joins",
    concepts:["ORDER BY","Tie-breaks","LEFT JOIN","NULL"],model:"Rows have no guaranteed result order until the query declares one.",why:["A leaderboard must specify descending score and a stable secondary key for ties. LIMIT without a complete order can choose different tied players. Keep identifiers parameterized when they are values, and treat table names as schema decisions rather than interpolated user input.","LEFT JOIN retains players without matching purchases. A WHERE condition on the optional table can accidentally eliminate those rows and behave like an inner join. Put matching conditions in ON and use COALESCE only when an absent value has a defined replacement."],game:"A shop leaderboard must include new players with zero purchases and deterministic score ties.",decision:"Declare tie order and preserve unmatched rows deliberately.",files:[file("leaderboard.sql","sql",`SELECT p.id, p.coins, COUNT(o.id) AS purchases
FROM players AS p
LEFT JOIN orders AS o ON o.player_id = p.id
GROUP BY p.id, p.coins
ORDER BY p.coins DESC, p.id ASC;`)],practice:[{id:"sql-player-balances",language:"sql"},{id:"sql-zero-purchases",language:"sql"}],steps:["Specify a complete leaderboard order.","Retain players without matching orders.","Test empty tables and tied balances."],pitfalls:["LIMIT without deterministic ORDER BY.","Filtering optional rows in WHERE.","Confusing NULL with zero in every domain."],question:"Which join retains rows with no matching right-hand row?",accepted:["left join","left outer join"]}),
  lesson({number:75,id:"sql-aggregate-windows",track:"SQL",title:"Aggregation, HAVING, and ordered window functions",
    concepts:["GROUP BY","HAVING","DENSE_RANK","Window frames"],model:"Aggregation collapses rows; a window computes over related rows while keeping each row visible.",why:["WHERE filters source rows before grouping, while HAVING filters groups after aggregate values exist. Group only the intended dimensions and compute revenue from the declared unit and quantity fields. An accidental join multiplicity can inflate totals, so verify the row relationship first.","Window functions preserve individual rows. DENSE_RANK gives equal values the same rank without gaps; ROW_NUMBER needs a deterministic tie-break. For running totals, specify ordering and an explicit ROWS frame so equal timestamps do not unexpectedly share a peer-group total."],game:"A shop report needs revenue by SKU, a ranked player list and an ordered running sales total.",decision:"Choose aggregates for summaries and windows when row-level detail must remain.",files:[file("reports.sql","sql",`SELECT sku, SUM(total) AS revenue
FROM orders GROUP BY sku
HAVING SUM(total) >= 1000
ORDER BY revenue DESC, sku ASC;

SELECT id, DENSE_RANK() OVER (ORDER BY coins DESC) AS rank
FROM players ORDER BY rank, id;`)],practice:[{id:"sql-having",language:"sql"},{id:"sql-dense-rank",language:"sql"},{id:"sql-running-revenue",language:"sql"}],steps:["Separate source filters from aggregate filters.","Choose a rank policy for ties.","Specify the running-total order and frame."],pitfalls:["Using WHERE for an aggregate condition.","Summing duplicated rows after a many-to-many join.","Omitting a window frame when peers matter."],question:"Which clause filters grouped aggregate results?",accepted:["having"]}),
  lesson({number:76,id:"sql-transactions-reservation",track:"SQL",title:"Atomic stock reservation and rollback",
    concepts:["Conditional UPDATE","Transactions","Rollback","Affected rows"],model:"A purchase either commits all its persistent effects or commits none of them.",why:["Reserve stock with one conditional UPDATE whose WHERE requires enough remaining units. Inspect the affected-row count before creating an order. A separate read followed by an unconditional write leaves a race in a concurrent production database.","Keep debit, reservation and order creation in one transaction. If an invariant fails, roll back rather than compensating with guessed values. The Academy uses a fresh in-memory SQLite database for each case, while deployment tests must also cover real connection and concurrency policies."],game:"Two buyers must not both reserve the last stack because they observed the same old stock count.",decision:"Place the invariant in the write condition and commit only after all dependent writes succeed.",files:[file("reserve.sql","sql",`BEGIN;
UPDATE items SET stock = stock - 2
WHERE sku = 'stone' AND stock >= 2;
-- The service checks the affected-row count before inserting an order.
-- COMMIT after all required writes; ROLLBACK on any failure.
ROLLBACK;
SELECT sku, stock FROM items ORDER BY sku;`)],practice:[{id:"sql-stock-reservation",language:"sql"},{id:"sql-rollback",language:"sql"}],steps:["Encode stock availability in the UPDATE condition.","Check whether the write actually reserved anything.","Test rollback restores every tentative effect."],pitfalls:["Read-check-write without atomicity.","Committing the debit before the order.","Assuming a browser fixture proves production concurrency."],question:"Which transaction operation undoes tentative writes?",accepted:["rollback"]}),
  lesson({number:77,id:"sql-outbox-reconciliation",track:"SQL",title:"Ledger reconciliation and ordered outbox delivery",
    concepts:["Ledger","Outbox","Aggregate sequence","Reconciliation"],model:"Persistent facts and delivery attempts have different lifecycles.",why:["A ledger records committed changes so a reconciliation query can compare derived totals with stored balances. Missing entries and mismatched signs are observable failures, not values to hide with a default. Use stable identifiers to explain which aggregate disagrees.","An outbox stores an event in the same transaction as its domain change. Deliver only the earliest pending sequence for each aggregate so a retry cannot let a later event overtake it. Mark delivery only after the matching acknowledgement; external publication cannot be made atomic merely by putting it between database statements."],game:"A committed purchase must eventually reach another server without silently losing its event or reordering the player's purchases.",decision:"Persist delivery intent with the domain change and reconcile independently.",files:[file("outbox.sql","sql",`SELECT o.id, o.aggregate_id, o.seq
FROM outbox AS o
WHERE o.delivered = 0 AND NOT EXISTS (
  SELECT 1 FROM outbox AS earlier
  WHERE earlier.aggregate_id = o.aggregate_id
    AND earlier.delivered = 0 AND earlier.seq < o.seq
)
ORDER BY o.aggregate_id, o.seq;`)],practice:[{id:"sql-outbox-head",language:"sql"},{id:"sql-ledger-reconciliation",language:"sql"}],steps:["Compare balances with committed ledger facts.","Select only the next pending aggregate sequence.","Test duplicate attempts and missing acknowledgements."],pitfalls:["Publishing externally before commit.","Delivering later sequences during a retry.","Masking reconciliation failures with defaults."],question:"Which pattern persists event delivery intent with a domain transaction?",accepted:["outbox","transactional outbox"]}),
  lesson({number:78,id:"config-manifests-types",track:"Configuration",title:"Bundle manifests, scalar types, and entrypoints",
    concepts:["YAML mappings","Scalar types","Entrypoints","Duplicate keys"],model:"Configuration is typed input to the loader, not a collection of plausible-looking strings.",why:["YAML distinguishes booleans, numbers, strings, mappings and sequences. Quote a version that must stay a string and a label whose punctuation could be parsed differently. Duplicate keys are rejected by the Academy parser; repeating a mapping key does not merge its declarations.","Bundle suffix and main entrypoint must match the language surface. A .cplugin loads a compiled Wasm entrypoint, a .pyplugin loads Python, and a .jsplugin loads emitted JavaScript. Validate from the same folder layout that you will deploy, including command and permission declarations."],game:"A feature flag containing the string 'false' is not the same input as the boolean false.",decision:"Preserve scalar types and validate the complete bundle structure at startup.",files:[file("plugin.yml","yaml",`name: AcademyNative
version: "1.0"
main: main.wasm
commands:
  academy:
    description: Open the Academy
    permission: academy.use
permissions:
  academy.use:
    default: true`),file("config.yml","yaml",`features:
  packets: true
  boards: false
limits:
  per_tick: 50`)],practice:[{id:"manifest-c",language:"yaml"},{id:"config-native-values",language:"yaml"}],steps:["Keep typed scalars typed.","Match the runtime entrypoint to the bundle.","Reject duplicate and missing declarations."],pitfalls:["Boolean values encoded as strings.","Duplicate keys that hide earlier values.","Declaring a source file as an unbuilt Wasm entrypoint."],question:"Does YAML text 'false' have the same type as boolean false?",accepted:["no"]}),
  lesson({number:79,id:"config-capability-dependencies",track:"Configuration",title:"Dependencies, load order, and explicit capability gates",
    concepts:["depend","softdepend","Load phases","Capability gates"],model:"A declared intention to use a feature does not prove that the runtime can provide it.",why:["Required dependencies gate startup; optional dependencies require a capability check before use. loadbefore changes ordering without making the other plugin a required dependency. World generators need startup loading so the provider exists when worlds request their generator.","A feature toggle can disable an integration, but enabling it cannot make an unavailable renderer work. Boards remain experimental and unavailable in the current contract. Report that capability honestly and test both enabled configuration with missing capability and deliberately disabled configuration."],game:"PacketEvents can be required while an economy bridge is optional; an unavailable board renderer must fail its gate clearly.",decision:"Separate required dependencies, optional integrations and platform capabilities.",files:[file("plugin.yml","yaml",`name: AcademyBridge
version: "1"
main: main.mjs
depend: [PacketEvents]
softdepend: [Vault]
loadbefore: [AcademyConsumer]
load: STARTUP`)],practice:[{id:"manifest-dependencies",language:"yaml"},{id:"manifest-generator",language:"yaml"},{id:"boards-capability-gate",language:"ts"}],steps:["Declare required and optional dependencies separately.","Choose the load phase required by the feature.","Gate unavailable capabilities even when configuration enables them."],pitfalls:["Treating loadbefore as depend.","Assuming a toggle supplies platform support.","Loading a generator after world initialization."],question:"Which manifest key declares an optional dependency?",accepted:["softdepend"]}),
  lesson({number:80,id:"java-host-boundary",track:"Java",title:"Java host boundaries and a conventional Bukkit companion",
    concepts:["Java host","Bukkit lifecycle","Guest boundary","Local verification"],model:"Java implements the host plugin; Graaly guest bundles access that host through the canonical SDK.",why:["Graaly's guest languages are JavaScript, TypeScript, Python and C/WebAssembly. Java remains relevant for conventional Bukkit companions and for understanding the host's lifecycle. It is not advertised as an extra Academy browser compiler or as a required interop path for normal guest code.","A JavaPlugin owns onEnable/onDisable and registers host-side commands and listeners. Build against the repository's supported server API and verify on a local server. Keep data exchanged with guest bundles explicit so domain code does not depend on arbitrary JVM class names."],game:"A conventional host companion can log its startup and expose a stable integration boundary to Graaly bundles.",decision:"Use the canonical SDK in guests; build a Java companion only when a host integration actually needs one.",files:[file("AcademyHost.java","java",`package example;
import org.bukkit.plugin.java.JavaPlugin;

public final class AcademyHost extends JavaPlugin {
    @Override public void onEnable() { getLogger().info("Academy host enabled"); }
    @Override public void onDisable() { getLogger().info("Academy host disabled"); }
}`),file("plugin.yml","yaml",`name: AcademyHost
version: "1.0"
main: example.AcademyHost`)],practice:[{id:"diagnostic-startup-check",language:"ts"}],steps:["Identify host lifecycle versus guest lifecycle.","Build the companion against the supported server API.","Verify startup and shutdown on a local server."],pitfalls:["Inventing a Java browser runner.","Requiring JVM paths in ordinary guest code.","Calling compilation proof of server compatibility."],question:"Is Java one of Graaly's four guest languages?",accepted:["no"]}),
  lesson({number:81,id:"java-thread-lifecycle",track:"Java",title:"Host thread ownership and listener cleanup",
    concepts:["Server thread","Network callbacks","Listeners","Cleanup"],model:"A callback's thread is part of its contract, not an implementation detail you can ignore.",why:["A server API operation that mutates world or player state must run on its permitted thread. A network or asynchronous callback should capture only necessary immutable data and schedule the permitted game effect. Recheck that its player and owning plugin are still valid when the scheduled task runs.","Listener registration and scheduling create host resources. Unregister explicit listeners and cancel owned work on disable, even when the platform also performs lifecycle cleanup. An old completion must not publish into a new plugin generation after reload."],game:"An asynchronous chat or packet observation can request a safe game-thread notification without directly mutating the world.",decision:"Marshal effects to the permitted thread and keep their ownership tied to the plugin generation.",files:[file("ThreadBoundary.java","java",`package example;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;

public final class ThreadBoundary {
    public static void notifyLater(Plugin plugin, Player player, String message) {
        Bukkit.getScheduler().runTask(plugin, () -> {
            if (plugin.isEnabled() && player.isOnline()) player.sendMessage(message);
        });
    }
}`)],practice:[{id:"packet-main-thread",language:"plugin-ts"},{id:"event-subscription-lifecycle",language:"py"}],steps:["Identify the callback's permitted thread.","Schedule only the necessary game effect.","Cancel work and reject old-generation completion on teardown."],pitfalls:["World mutation on a network thread.","Using a stale player after scheduling.","Retaining listeners across reload."],question:"Should a network callback directly perform arbitrary world mutations?",accepted:["no"]}),
  lesson({number:82,id:"java-contract-testing",track:"Java",title:"Host contract tests and independent ABI evidence",
    concepts:["Contract testing","Independent fixtures","ABI evidence","Compatibility"],model:"A guest implementation and the host must agree on behavior, rather than merely sharing a vocabulary.",why:["Test native HTML compilation against fixtures generated by the actual Java compiler and compare the complete native snapshot. Independent fixtures detect mistakes that a test duplicating the guest implementation cannot detect. Regenerate fixtures only when the host contract intentionally changes.","For C, measure layout on the actual target and compare semantic fields or explicit wire bytes. A Java object layout is not a C ABI layout, and a numeric handle is not a Java object address. Record server-version evidence separately from browser-only algorithm tests."],game:"A native inventory built from HTML must match the host compiler's slot and action snapshot.",decision:"Use independent host fixtures and target measurements at boundaries that can drift.",files:[file("verify.sh","shell",`npm run generate:c
npm run typecheck:sdk
npm run typecheck:academy
npm run test:academy
# Host compiler parity fixtures are checked by the Academy tests.
# Verify deployed bundles separately on the supported local server matrix.`)],practice:[{id:"c-padding-size",language:"c"},{id:"html-grid-position",language:"html"}],steps:["Compare independent native snapshots.","Measure the active C target ABI.","Keep browser evidence separate from local server evidence."],pitfalls:["A test that only repeats its implementation.","Transferring Java layout assumptions to C.","Claiming all server versions from one browser test."],question:"What kind of fixture helps detect drift against a host compiler?",accepted:["independent fixture","independent fixtures","host-generated fixture","host generated fixture"]}),
  lesson({number:83,id:"fastapi-signatures-validation",track:"FastAPI",title:"Typed endpoint signatures, status, and response models",
    concepts:["Path parameters","Query validation","Request bodies","response_model"],model:"An endpoint signature declares how protocol input becomes validated application input.",why:["FastAPI uses path names, annotations and Body/Query declarations to extract and validate requests. A malformed integer path or an out-of-range query is rejected before the endpoint runs. Explicit response models then validate and filter the returned public representation.","Keep not-found errors distinct from valid empty data and select status codes that express the outcome. A response model is not authorization; check current permissions in the service or dependency. Browser exercises use actual async endpoints and ASGI requests, while production thread and network behavior need server tests."],game:"A shop route can validate quantity and filter internal tokens from its response before a Graaly client receives it.",decision:"Let the framework own protocol parsing while the domain service owns authorization and invariants.",files:[file("app.py","python",`from typing import Annotated
from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
app = FastAPI()

class Item(BaseModel):
    sku: str
    price_cents: int

@app.get("/items/{sku}", response_model=Item)
async def item(sku: str, quantity: Annotated[int, Query(ge=1, le=64)] = 1):
    if sku != "stone": raise HTTPException(404, "Unknown SKU")
    return {"sku": sku, "price_cents": 25 * quantity, "internal_token": "private"}`)],practice:[{id:"api-path-validation",language:"fastapi"},{id:"api-response-contract",language:"fastapi"},{id:"api-not-found",language:"fastapi"}],steps:["Declare extraction and validation in the signature.","Separate missing data from empty data.","Filter the public response through its own model."],pitfalls:["Validation mistaken for authorization.","Leaking an internal service dictionary.","Returning 200 for a failed lookup."],question:"Which FastAPI option validates and filters an endpoint's public output?",accepted:["response_model","response model"]}),
  lesson({number:84,id:"fastapi-any-exercise",track:"FastAPI",title:"Run any Academy algorithm as a FastAPI endpoint",
    concepts:["POST /solve","Body","Async endpoint","ASGI execution"],model:"Changing the execution environment should preserve the exercise's observable domain contract.",why:["Select FastAPI on any exercise to receive a real app and POST /solve starter. The fixture becomes the endpoint's JSON body and the endpoint must return HTTP 200 with the correct result. The judge drives actual ASGI requests through the installed FastAPI package, including the relevant native lifecycle when the problem requires it.","Keep solve independent of request objects, then choose a domain input model when the algorithm needs stronger validation. This lets you compare equivalent results in React, Python, C, JS or TS without changing the task. Original FastAPI exercises keep their richer route, lifespan, authentication and WebSocket contracts."],game:"A teleport normalization exercise can become a real FastAPI route while preserving the same yaw and pitch tests.",decision:"Keep the algorithm portable and let each adapter prove its real framework behavior.",files:[file("orientation_api.py","python",`from typing import Any
from fastapi import FastAPI, Body
app = FastAPI()

def solve(value):
    return {"yaw": value["yaw"] % 360,
            "pitch": min(90, max(-90, value["pitch"]))}

@app.post("/solve")
async def endpoint(value: Any = Body(...)):
    return solve(value)`)],practice:[{id:"world-orientation",language:"fastapi"},{id:"api-lifespan",language:"fastapi"}],steps:["Implement solve independently of the framework.","Return its result from a real POST endpoint.","Submit the same edge cases in another environment for parity."],pitfalls:["Replacing the domain function with a fixture answer.","Returning a string containing JSON instead of JSON.","Calling a simulated inspector an endpoint test."],question:"Does the FastAPI Academy profile execute the actual FastAPI package?",accepted:["yes"]}),
];
