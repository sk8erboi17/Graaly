export type GameLesson = {
  number: number;
  track: "React" | "TypeScript" | "FastAPI" | "Architecture";
  title: string;
  concept: string;
  question: string;
  accepted: readonly string[];
};

export const lessons: readonly GameLesson[] = [
  { number: 1, track: "React", title: "Components and JSX", concept: "A component is a pure recipe for a UI tree.", question: "What is the basic reusable React unit?", accepted: ["component", "a component"] },
  { number: 2, track: "React", title: "Lists and keys", concept: "Stable domain keys preserve the correct identity.", question: "Should a mutable list use index or a stable id as key?", accepted: ["stable id", "id", "a stable id"] },
  { number: 3, track: "React", title: "State snapshots", concept: "One render sees one immutable state snapshot.", question: "Which setter form composes dependent updates?", accepted: ["functional updater", "updater", "functional update"] },
  { number: 4, track: "React", title: "Controlled input", concept: "One owner stores the authoritative input value.", question: "What principle avoids duplicate state?", accepted: ["single source of truth"] },
  { number: 5, track: "React", title: "Identity and reset", concept: "Type, position, and key determine state identity.", question: "Which prop intentionally resets an instance?", accepted: ["key", "the key"] },
  { number: 6, track: "React", title: "Reducers", concept: "Reducers map state plus an action to next state.", question: "May a reducer perform HTTP requests?", accepted: ["no", "no it must be pure"] },
  { number: 7, track: "React", title: "Render and commit", concept: "Render calculates; commit publishes the accepted tree.", question: "Which phase may mutate the native UI?", accepted: ["commit", "commit phase"] },
  { number: 8, track: "React", title: "Effects", concept: "Effects synchronize committed state with external systems.", question: "What must undo an Effect subscription?", accepted: ["cleanup", "effect cleanup"] },
  { number: 9, track: "React", title: "Race conditions", concept: "Obsolete asynchronous results must be ignored or cancelled.", question: "Should a purchase write live in an Effect or click event?", accepted: ["click event", "event", "click"] },
  { number: 10, track: "React", title: "Refs", concept: "Refs hold mutable values without requesting render.", question: "Does changing ref.current re-render?", accepted: ["no"] },
  { number: 11, track: "React", title: "Context", concept: "Context injects a dependency through the tree.", question: "Which component supplies a Context value?", accepted: ["provider", "the provider"] },
  { number: 12, track: "React", title: "Custom Hooks", concept: "Custom Hooks compose stateful logic and obey Hook rules.", question: "Where may Hooks be called?", accepted: ["top level", "at the top level"] },
  { number: 13, track: "React", title: "Performance", concept: "Profile first, then memoize measured work.", question: "Which API measures React render duration?", accepted: ["profiler", "react profiler"] },
  { number: 14, track: "React", title: "Suspense and errors", concept: "Suspense handles pending work; boundaries handle render failure.", question: "What catches an unexpected render error?", accepted: ["error boundary", "an error boundary"] },
  { number: 15, track: "React", title: "Concurrent Actions", concept: "Transitions mark non-urgent presentation work.", question: "Does a transition make blocking I/O non-blocking?", accepted: ["no"] },
  { number: 16, track: "React", title: "Portals", concept: "A portal changes host destination, not logical parent.", question: "Does Context come from source or target tree?", accepted: ["source", "source tree"] },
  { number: 17, track: "Architecture", title: "Renderer testing", concept: "Drive public UI actions with act and inspect commits.", question: "Should renderer tests use arbitrary sleeps?", accepted: ["no"] },
  { number: 18, track: "Architecture", title: "Server React", concept: "Minecraft has native commits and no HTML hydration.", question: "Does a game client hydrate React HTML?", accepted: ["no"] },
  { number: 19, track: "TypeScript", title: "Strict contracts", concept: "Discriminated unions remove impossible states.", question: "What generates TS models from FastAPI?", accepted: ["openapi", "openapi-typescript"] },
  { number: 20, track: "FastAPI", title: "Request parsing", concept: "The endpoint signature declares extraction and validation.", question: "Which model library validates FastAPI bodies?", accepted: ["pydantic"] },
  { number: 21, track: "FastAPI", title: "Response models", concept: "Separate trusted input from public output.", question: "What filters accidental secret response fields?", accepted: ["response model", "response_model"] },
  { number: 22, track: "FastAPI", title: "Routers and OpenAPI", concept: "Routers adapt protocol; services own business rules.", question: "Where should purchase rules live?", accepted: ["service", "services", "service layer"] },
  { number: 23, track: "FastAPI", title: "Dependency injection", concept: "FastAPI resolves a cached dependency tree per request.", question: "Which helper declares a dependency?", accepted: ["depends", "depends()"] },
  { number: 24, track: "FastAPI", title: "Lifespan and async", concept: "Lifespan owns pools; async code must not block its loop.", question: "Where should a shared connection pool be opened?", accepted: ["lifespan", "application lifespan"] },
  { number: 25, track: "FastAPI", title: "Transactions", concept: "One command commits all persistent effects atomically.", question: "What prevents duplicate writes across retries?", accepted: ["idempotency", "idempotency key", "an idempotency key"] },
  { number: 26, track: "Architecture", title: "Realtime capstone", concept: "HTTP owns finite commands; WebSocket owns live sessions.", question: "Which protocol fits bidirectional live sessions?", accepted: ["websocket", "websockets"] },
];

export function lessonByNumber(number: number): GameLesson {
  return lessons[Math.max(0, Math.min(lessons.length - 1, number - 1))] as GameLesson;
}
