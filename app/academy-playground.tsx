"use client";

import { highlightText, type ShjLanguage } from "@speed-highlight/core";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FlaskConical,
  Play,
  RotateCcw,
  Search,
  Server,
  TerminalSquare,
} from "lucide-react";
import React, {
  Component,
  type ComponentType,
  type FormEvent,
  type PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  academyConceptCount,
  academyLessons,
  academySyllabus,
  type AcademyFile,
  type AcademyLesson,
  type AcademyTrack,
} from "./academy-data";

type SimulatorAction = {
  player: { id: string; name: string };
  slot?: number;
  value?: string;
  type: string;
};

type SimulatorItemProps = {
  slot: number;
  material?: string;
  amount?: number;
  name?: React.ReactNode;
  lore?: readonly React.ReactNode[];
  onClick?: (action: SimulatorAction) => unknown;
};

type PixelSprite = {
  palette: Readonly<Record<string, string>>;
  rows: readonly string[];
};

const materialSprites: Readonly<Record<string, PixelSprite>> = {
  STONE: {
    palette: { s: "#777d80", l: "#aeb3b4", d: "#4c5255" },
    rows: [
      "..........", ".ssssssss.", ".sllssdds.", ".ssssdsss.", ".sdssslls.",
      ".sssldsss.", ".sddsssls.", ".ssssssss.", ".ssssssss.", "..........",
    ],
  },
  BOOK: {
    palette: { b: "#5f2e1d", d: "#2f1712", p: "#e9d8a5", h: "#fff1bf" },
    rows: [
      "..........", "..bbbbb...", ".bppppbb..", ".bphhpdb..", ".bphhpdb..",
      ".bppppbb..", ".bppppb...", ".bbbbbb...", "..dddd....", "..........",
    ],
  },
  COMPASS: {
    palette: { g: "#3d464a", s: "#aeb8b8", w: "#e6ece8", r: "#d54b45", d: "#172125" },
    rows: [
      "..........", "...gg.....", "..gssg....", ".gswwsg...", ".gwrwsg...",
      ".gsrwwg...", "..gssg....", "...gg.....", "..........", "..........",
    ],
  },
  DIAMOND: {
    palette: { c: "#159ca0", l: "#61e4dc", w: "#c6fff5", d: "#0a5d68" },
    rows: [
      "..........", "...cc.....", "..cllc....", ".clwwlc...", ".cwwwwc...",
      "..lwwl....", "..cllc....", "...dd.....", "..........", "..........",
    ],
  },
  EMERALD: {
    palette: { e: "#087839", l: "#19c866", h: "#71f09a", w: "#c2ffd1", d: "#064b2c" },
    rows: [
      "..........", "...ee.....", "..elhe....", ".elhhle...", ".ehwwhe...",
      ".ehwwhe...", ".elhhle...", "..edde....", "...dd.....", "..........",
    ],
  },
  LEVER: {
    palette: { w: "#8b572f", h: "#d5a15c", s: "#737a7d", l: "#aeb4b5", d: "#41474a" },
    rows: [
      ".......w..", "......wh..", ".....wh...", "....wh....", "...wh.....",
      "..wh......", "..ssss....", ".sllsss...", ".sddsss...", "..........",
    ],
  },
  REDSTONE: {
    palette: { r: "#b71919", l: "#f04b38", d: "#6f0c12", h: "#ff7a55" },
    rows: [
      "..........", "....r.....", "..rrlrr...", ".rlhhlrr..", "rrlldlrrr.",
      ".rrldlrr..", "..rrlrr...", ".r..r..r..", "..........", "..........",
    ],
  },
  SKULL_ITEM: {
    palette: { k: "#8f9390", h: "#d9ddd4", w: "#f0f1e8", e: "#313535", t: "#727773" },
    rows: [
      "..........", "..kkkk....", ".khhhhk...", ".khwwhk...", ".kheehk...",
      ".khwwhk...", "..kttk....", "..t..t....", "..........", "..........",
    ],
  },
  BARRIER: {
    palette: { r: "#c9292f", l: "#f45a58", d: "#78171e", w: "#f4e9dc" },
    rows: [
      "..........", "...rr.....", "..rwwr....", ".rwwwlr...", ".rwwlwr...",
      ".rwlwwr...", "..rlwr....", "...dd.....", "..........", "..........",
    ],
  },
};

function MaterialSprite({ material }: { material: string }) {
  const sprite = materialSprites[material.toUpperCase()] ?? materialSprites.STONE;
  return (
    <span aria-hidden="true" className="academy-item-sprite" data-material={material.toUpperCase()}>
      {sprite.rows.flatMap((row, y) => Array.from(row).map((pixel, x) => {
        const color = sprite.palette[pixel];
        if (!color) return null;
        return <i key={`${x}:${y}`} style={{ backgroundColor: color, gridColumn: x + 1, gridRow: y + 1 }} />;
      }))}
    </span>
  );
}

const fakePlayer = { id: "academy-player", name: "Graaly03" };

function SimMessage({ children }: PropsWithChildren<{ id?: string }>) {
  return <div className="academy-sim-chat"><span>Graaly</span>{children}</div>;
}

function SimInventory({ title, rows = 3, children }: PropsWithChildren<{
  id?: string;
  title: React.ReactNode;
  rows?: number;
  onClose?: () => unknown;
}>) {
  return (
    <section className="academy-sim-inventory">
      <div className="academy-sim-inventory-title">{title}</div>
      <div className="academy-sim-slots" style={{ "--academy-rows": rows } as React.CSSProperties}>
        {children}
      </div>
    </section>
  );
}

function SimItem({ slot, material = "STONE", amount = 1, name, lore = [], onClick }: SimulatorItemProps) {
  const column = slot % 9 + 1;
  const row = Math.floor(slot / 9) + 1;
  const label = (typeof name === "string" ? name : material).replace(/&[0-9a-fk-or]/gi, "");
  return (
    <button
      aria-label={label}
      className="academy-sim-item"
      data-label={label}
      onClick={() => onClick?.({
        player: fakePlayer,
        slot,
        type: "inventory.click",
      })}
      style={{ gridColumn: column, gridRow: row }}
      title={[label, ...lore.map(String)].join(" · ")}
      type="button"
    >
      <MaterialSprite material={material} />
      {amount > 1 && <small>{amount}</small>}
    </button>
  );
}

function SimScoreboard({ title, children }: PropsWithChildren<{ title: React.ReactNode }>) {
  return <section className="academy-sim-scoreboard"><strong>{title}</strong>{children}</section>;
}

function SimLine({ children }: PropsWithChildren<{ id?: string }>) {
  return <div className="academy-sim-line">{children}</div>;
}

function SimBossBar({ progress = 1, children }: PropsWithChildren<{ progress?: number }>) {
  return (
    <section className="academy-sim-bossbar">
      <span style={{ transform: "scaleX(" + Math.max(0, Math.min(1, progress)) + ")" }} />
      <strong>{children}</strong>
    </section>
  );
}

function SimTab({ header, footer }: { header?: React.ReactNode; footer?: React.ReactNode }) {
  return <section className="academy-sim-tab"><strong>{header}</strong><span>{footer}</span></section>;
}

function SimChatInput({
  value,
  defaultValue = "",
  prompt = "Type in chat",
  cancelWord = "cancel",
  onChange,
  onSubmit,
  onCancel,
}: {
  value?: string;
  defaultValue?: string;
  prompt?: React.ReactNode;
  cancelWord?: string;
  onChange?: (value: string) => unknown;
  onSubmit?: (value: string, action: SimulatorAction) => unknown;
  onCancel?: (action: SimulatorAction) => unknown;
}) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const selected = value ?? localValue;

  function change(next: string) {
    if (value === undefined) setLocalValue(next);
    onChange?.(next);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const action = { player: fakePlayer, type: "input.submit", value: selected };
    if (selected.trim().toLowerCase() === cancelWord.toLowerCase()) onCancel?.({ ...action, type: "input.cancel" });
    else onSubmit?.(selected, action);
  }

  return (
    <form className="academy-sim-input" onSubmit={submit}>
      <label>{prompt}</label>
      <div>
        <input onChange={event => change(event.target.value)} value={selected} />
        <button type="submit">Send</button>
      </div>
      <small>In game this captures the next chat message · cancel word: {cancelWord}</small>
    </form>
  );
}

const simulatedGraalyReact = {
  Inventory: SimInventory,
  Item: SimItem,
  Message: SimMessage,
  Scoreboard: SimScoreboard,
  Line: SimLine,
  BossBar: SimBossBar,
  Tab: SimTab,
  ChatInput: SimChatInput,
};

type BoundaryProps = PropsWithChildren<{ resetKey: number }>;
type BoundaryState = { error: Error | null };

class PlaygroundBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch() {
    // The visible fallback is more useful than duplicating the error in the console.
  }

  componentDidUpdate(previous: BoundaryProps) {
    if (previous.resetKey !== this.props.resetKey && this.state.error !== null) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error !== null) {
      return (
        <div className="academy-preview-error">
          <CircleAlert size={18} aria-hidden="true" />
          <div><strong>Render failed</strong><span>{this.state.error.message}</span></div>
        </div>
      );
    }
    return this.props.children;
  }
}

function languageFor(file: AcademyFile): ShjLanguage {
  if (file.language === "javascript") return "js";
  if (file.language === "python") return "py";
  if (file.language === "shell") return "bash";
  if (file.language === "json") return "json";
  return "ts";
}

async function compileAcademyComponent(source: string): Promise<ComponentType> {
  const { transform } = await import("sucrase");
  const compiled = transform(source, {
    transforms: ["typescript", "jsx", "imports"],
    filePath: "Academy.tsx",
    production: false,
  }).code;
  const sandboxModule = { exports: {} as Record<string, unknown> };
  const reactModule = Object.assign({ default: React, __esModule: true }, React);
  const graalyModule = Object.assign({ __esModule: true }, simulatedGraalyReact);

  function academyRequire(name: string) {
    if (name === "react") return reactModule;
    if (name === "@graaly/react") return graalyModule;
    throw new Error("The browser lab cannot load " + name + ". Use react and @graaly/react in runnable files.");
  }

  // This playground executes only code typed locally by the current visitor.
  const evaluate = new Function("require", "module", "exports", compiled);
  evaluate(academyRequire, sandboxModule, sandboxModule.exports);
  const selected = sandboxModule.exports.default;
  if (typeof selected !== "function") {
    throw new Error("Export one React component with: export default function App() { ... }");
  }
  return selected as ComponentType;
}

function LessonNavigation({
  selected,
  search,
  completed,
  onSearch,
  onSelect,
}: {
  selected: number;
  search: string;
  completed: ReadonlySet<number>;
  onSearch(value: string): void;
  onSelect(number: number): void;
}) {
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return academyLessons;
    return academyLessons.filter(lesson =>
      lesson.title.toLowerCase().includes(query)
      || lesson.track.toLowerCase().includes(query)
      || lesson.concepts.some(concept => concept.toLowerCase().includes(query))
    );
  }, [search]);
  const tracks: AcademyTrack[] = ["React", "TypeScript", "FastAPI", "Architecture"];

  return (
    <aside className="academy-lessons" aria-label="Academy lessons">
      <div className="academy-search">
        <Search size={15} aria-hidden="true" />
        <input
          aria-label="Search Academy lessons"
          onChange={event => onSearch(event.target.value)}
          placeholder="Search state, WebSocket, Depends..."
          value={search}
        />
      </div>
      <div className="academy-mobile-picker">
        <label htmlFor="academy-lesson-select">Lesson</label>
        <select
          id="academy-lesson-select"
          onChange={event => onSelect(Number(event.target.value))}
          value={selected}
        >
          {academyLessons.map(lesson => (
            <option key={lesson.id} value={lesson.number}>
              {String(lesson.number).padStart(2, "0")} · {lesson.title}
            </option>
          ))}
        </select>
      </div>
      <div className="academy-lesson-scroll">
        {tracks.map(track => {
          const lessons = filtered.filter(lesson => lesson.track === track);
          if (lessons.length === 0) return null;
          return (
            <div className="academy-track" key={track}>
              <span>{track}</span>
              {lessons.map(lesson => (
                <button
                  aria-current={lesson.number === selected ? "step" : undefined}
                  className={lesson.number === selected ? "is-active" : ""}
                  key={lesson.id}
                  onClick={() => onSelect(lesson.number)}
                  type="button"
                >
                  <small>{String(lesson.number).padStart(2, "0")}</small>
                  <span>{lesson.title}</span>
                  {completed.has(lesson.number) && <Check size={13} aria-label="Complete" />}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function MinecraftPlayground({ lesson }: { lesson: AcademyLesson }) {
  const initialFile = lesson.files[0];
  const [fileName, setFileName] = useState(initialFile.name);
  const currentFile = lesson.files.find(file => file.name === fileName) ?? initialFile;
  const [source, setSource] = useState(currentFile.code);
  const [highlighted, setHighlighted] = useState("");
  const [rendered, setRendered] = useState<ComponentType | null>(null);
  const [error, setError] = useState("");
  const [runVersion, setRunVersion] = useState(0);
  const highlightedRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    let active = true;
    void highlightText(source, languageFor(currentFile), false).then(html => {
      if (active) setHighlighted(html);
    });
    return () => {
      active = false;
    };
  }, [currentFile, source]);

  function selectFile(file: AcademyFile) {
    setFileName(file.name);
    setSource(file.code);
    setRendered(null);
    setError("");
  }

  async function run() {
    if (!currentFile.runnable) return;
    try {
      const ComponentToRender = await compileAcademyComponent(source);
      setRendered(() => ComponentToRender);
      setRunVersion(version => version + 1);
      setError("");
    } catch (failure) {
      setRendered(null);
      setError(failure instanceof Error ? failure.message : String(failure));
    }
  }

  function reset() {
    setSource(currentFile.code);
    setRendered(null);
    setError("");
    setRunVersion(version => version + 1);
  }

  return (
    <section className="academy-workbench" aria-label="Minecraft React playground">
      <header>
        <div>
          <TerminalSquare size={17} aria-hidden="true" />
          <span>Minecraft React lab</span>
          <small>real TSX · browser host simulator</small>
        </div>
        <div className="academy-run-actions">
          <button onClick={reset} type="button"><RotateCcw size={14} />Reset</button>
          <button className="is-primary" disabled={!currentFile.runnable} onClick={run} type="button">
            <Play size={14} fill="currentColor" />Run TSX
          </button>
        </div>
      </header>
      <div className="academy-file-tabs" role="tablist" aria-label="Lesson files">
        {lesson.files.map(file => (
          <button
            aria-selected={file.name === currentFile.name}
            className={file.name === currentFile.name ? "is-active" : ""}
            key={file.name}
            onClick={() => selectFile(file)}
            role="tab"
            type="button"
          >
            <i className={"is-" + file.language} />{file.name}
          </button>
        ))}
      </div>
      <div className="academy-workbench-grid">
        <div className="academy-editor">
          <div className="academy-editor-meta">
            <span>{currentFile.language.toUpperCase()}</span>
            <span>{source.split("\n").length} lines</span>
          </div>
          <div className="academy-editor-layer">
            <pre aria-hidden="true" ref={highlightedRef}>
              <code className={`shj-lang-${languageFor(currentFile)}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
            </pre>
            <textarea
              aria-label={"Edit " + currentFile.name}
              onChange={event => setSource(event.target.value)}
              onScroll={event => {
                if (highlightedRef.current) {
                  highlightedRef.current.scrollTop = event.currentTarget.scrollTop;
                  highlightedRef.current.scrollLeft = event.currentTarget.scrollLeft;
                }
              }}
              readOnly={!currentFile.runnable}
              spellCheck={false}
              value={source}
            />
          </div>
          {!currentFile.runnable && (
            <p className="academy-editor-note">
              Python and architecture files are read-only here. They run in the checked-in FastAPI project and its tests, not in a browser imitation.
            </p>
          )}
        </div>
        <div className="academy-preview">
          <div className="academy-preview-meta">
            <span>Minecraft surface preview</span>
            <small>{rendered ? "commit " + runVersion : "waiting for Run"}</small>
          </div>
          <div className="academy-preview-stage">
            {error ? (
              <div className="academy-preview-error">
                <CircleAlert size={18} aria-hidden="true" />
                <div><strong>Compile failed</strong><span>{error}</span></div>
              </div>
            ) : rendered ? (
              <PlaygroundBoundary resetKey={runVersion}>
                {React.createElement(rendered)}
              </PlaygroundBoundary>
            ) : (
              <div className="academy-preview-empty">
                <Play size={22} aria-hidden="true" />
                <strong>{currentFile.runnable ? "Run this lesson" : "Select a runnable TSX file"}</strong>
                <span>The same React component targets native surfaces on Graaly.</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="academy-lab-truth">
        The browser preview executes real React and the lesson TSX. It swaps only the host renderer for visible web controls.
        Server integration is verified separately against Graaly, GraalJS/GraalPy, and FastAPI.
      </p>
    </section>
  );
}

const pipeline = ["Parse", "Validate", "Dependencies", "Endpoint", "Serialize", "Response"] as const;

function FastApiLifecycleLab({ lesson }: { lesson: AcademyLesson }) {
  const [body, setBody] = useState('{\n  "player_id": "Graaly03",\n  "item": "diamond",\n  "quantity": 1\n}');
  const [stage, setStage] = useState(-1);
  const [result, setResult] = useState("Ready");
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearInterval(timer.current);
  }, []);

  function sendRequest() {
    if (timer.current !== null) window.clearInterval(timer.current);
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      setStage(1);
      setResult("422 · body is not valid JSON");
      return;
    }
    const value = parsed as Record<string, unknown>;
    if (!value.player_id || !value.item || typeof value.quantity !== "number" || value.quantity < 1) {
      setStage(1);
      setResult("422 · Pydantic rejected the request shape");
      return;
    }
    setStage(0);
    setResult("Request in flight");
    timer.current = window.setInterval(() => {
      setStage(current => {
        if (current >= pipeline.length - 1) {
          if (timer.current !== null) window.clearInterval(timer.current);
          timer.current = null;
          setResult("201 · validated PurchaseResponse");
          return current;
        }
        return current + 1;
      });
    }, 320);
  }

  return (
    <section className="academy-api-lab" aria-label="FastAPI request lifecycle visualizer">
      <header>
        <div><Server size={17} /><span>FastAPI lifecycle lab</span></div>
        <strong>{lesson.track === "FastAPI" ? "Lesson-linked" : "Always available"}</strong>
      </header>
      <div className="academy-api-grid">
        <div>
          <label htmlFor="academy-request-body">POST /v1/shop/purchase</label>
          <textarea id="academy-request-body" onChange={event => setBody(event.target.value)} spellCheck={false} value={body} />
          <button onClick={sendRequest} type="button"><Play size={14} fill="currentColor" />Send request</button>
        </div>
        <div>
          <div className="academy-pipeline">
            {pipeline.map((item, index) => (
              <div className={index < stage ? "is-done" : index === stage ? "is-active" : ""} key={item}>
                <span>{index < stage ? <Check size={12} /> : index + 1}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
          <output className={result.startsWith("422") ? "is-error" : result.startsWith("201") ? "is-success" : ""}>{result}</output>
        </div>
      </div>
      <p>This is a transparent lifecycle visualizer, not Python emulation. The downloadable backend runs real FastAPI, Pydantic, SQLAlchemy, WebSocket and pytest.</p>
    </section>
  );
}

function LessonArticle({ lesson }: { lesson: AcademyLesson }) {
  return (
    <article className="academy-article" key={lesson.id}>
      <header className="academy-lesson-header">
        <div>
          <span>Lesson {String(lesson.number).padStart(2, "0")}</span>
          <span>{lesson.track}</span>
          <span>{lesson.level}</span>
          <span>{lesson.duration}</span>
        </div>
        <h3>{lesson.title}</h3>
        <p>{lesson.mentalModel}</p>
      </header>

      <div className="academy-concepts">
        {lesson.concepts.map(concept => <span key={concept}>{concept}</span>)}
      </div>

      <section className="academy-reading-grid">
        <div>
          <span className="academy-kicker">After this lesson</span>
          <ul>{lesson.outcomes.map(outcome => <li key={outcome}>{outcome}</li>)}</ul>
        </div>
        <div>
          <span className="academy-kicker">Core explanation</span>
          {lesson.explanation.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </section>

      <section className="academy-boundaries">
        <div><span>IN MINECRAFT</span><p>{lesson.minecraft}</p></div>
        <div><span>VERSUS THE WEB</span><p>{lesson.webDifference}</p></div>
        <div><span>DESIGN DECISION</span><p>{lesson.decision}</p></div>
      </section>

      <MinecraftPlayground key={lesson.id} lesson={lesson} />
      <FastApiLifecycleLab lesson={lesson} />

      <section className="academy-challenge">
        <div>
          <FlaskConical size={20} aria-hidden="true" />
          <span>Hard lab</span>
          <h4>{lesson.lab.mission}</h4>
        </div>
        <ol>{lesson.lab.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <p><Check size={15} aria-hidden="true" /><strong>Definition of done</strong>{lesson.lab.done}</p>
      </section>

      <section className="academy-pitfalls">
        <span className="academy-kicker">Failure modes to recognize</span>
        <div>{lesson.pitfalls.map(pitfall => <span key={pitfall}><CircleAlert size={14} />{pitfall}</span>)}</div>
      </section>
    </article>
  );
}

export function GraalyAcademy() {
  const [selected, setSelected] = useState(1);
  const [search, setSearch] = useState("");
  const [completed, setCompleted] = useState<Set<number>>(() => new Set());
  const lesson = academyLessons[selected - 1] ?? academyLessons[0];
  const progress = completed.size / academyLessons.length;

  function markComplete() {
    setCompleted(current => {
      const next = new Set(current);
      next.add(lesson.number);
      return next;
    });
  }

  function select(number: number) {
    setSelected(Math.max(1, Math.min(academyLessons.length, number)));
  }

  return (
    <div className="academy">
      <section className="academy-intro">
        <div>
          <span>{academyLessons.length} long-form lessons · {academyConceptCount} mapped concepts</span>
          <h3>Learn React and FastAPI by building one complete plugin system</h3>
          <p>
            Start with a component and finish with a transactional, realtime party shop. Every lesson connects the language
            model to Minecraft, contrasts it with the web, includes editable code, and ends with a testable hard lab.
          </p>
          <div className="academy-downloads">
            <a download href="./downloads/Graaly-Academy-Plugin.zip">Download the in-game Academy</a>
            <a href="https://github.com/sk8erboi17/Graaly/tree/main/examples/GraalyAcademy.jsplugin" rel="noreferrer" target="_blank">Read the source on GitHub</a>
          </div>
        </div>
        <div className="academy-progress-card">
          <BookOpen size={22} aria-hidden="true" />
          <strong>{completed.size} / {academyLessons.length}</strong>
          <span>lessons completed in this session</span>
          <i><span style={{ transform: "scaleX(" + progress + ")" }} /></i>
        </div>
      </section>

      <details className="academy-syllabus">
        <summary>Open the complete concept map <span>{academySyllabus.length} modules</span></summary>
        <div>
          {academySyllabus.map(module => (
            <article key={module.area}><strong>{module.area}</strong><p>{module.topics}</p></article>
          ))}
        </div>
      </details>

      <div className="academy-shell">
        <LessonNavigation
          completed={completed}
          onSearch={setSearch}
          onSelect={select}
          search={search}
          selected={lesson.number}
        />
        <main className="academy-content">
          <LessonArticle lesson={lesson} />
          <footer className="academy-lesson-footer">
            <button disabled={lesson.number === 1} onClick={() => select(lesson.number - 1)} type="button">
              <ChevronLeft size={16} />Previous
            </button>
            <button className="is-complete" onClick={markComplete} type="button">
              <Check size={16} />{completed.has(lesson.number) ? "Completed" : "Mark complete"}
            </button>
            <button disabled={lesson.number === academyLessons.length} onClick={() => select(lesson.number + 1)} type="button">
              Next<ChevronRight size={16} />
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
