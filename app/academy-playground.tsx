"use client";

import { highlightText, type ShjLanguage } from "@speed-highlight/core";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  RotateCcw,
  Search,
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
  academyTracks,
  academyLessons,
  academySyllabus,
  type AcademyFile,
  type AcademyLesson,
  type AcademyTrack,
} from "./academy-data";
import { GraalyArena, type PracticeRequest } from "./academy/arena";
import { academyProblems } from "./academy/catalog.ts";
import { challengeLanguages, type ChallengeLanguage } from "./academy/types.ts";

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
  if (file.language === "c") return "c";
  if (file.language === "java") return "java";
  if (file.language === "html") return "html";
  if (file.language === "css") return "css";
  if (file.language === "sql") return "sql";
  if (file.language === "yaml") return "yaml";
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
  course, onCourse,
}: {
  course: AcademyTrack | "All courses"; onCourse(value: AcademyTrack | "All courses"): void;
  selected: number;
  search: string;
  completed: ReadonlySet<number>;
  onSearch(value: string): void;
  onSelect(number: number): void;
}) {
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return academyLessons.filter(lesson =>
      (course === "All courses" || lesson.track === course) && (!query ||
      lesson.title.toLowerCase().includes(query)
      || lesson.track.toLowerCase().includes(query)
      || lesson.concepts.some(concept => concept.toLowerCase().includes(query)))
    ).sort((a,b)=>Number(a.number<37)-Number(b.number<37)||a.number-b.number);
  }, [search,course]);
  const tracks = academyTracks;

  return (
    <aside className="academy-lessons" aria-label="Academy lessons">
      <label className="academy-course-picker">Course
        <select aria-label="Academy course" value={course} onChange={event=>onCourse(event.target.value as AcademyTrack | "All courses")}>
          <option>All courses</option>
          {academyTracks.map(track=><option key={track} value={track}>{track} · {academyLessons.filter(lesson=>lesson.track===track).length} lessons</option>)}
        </select>
      </label>
      <div className="academy-search">
        <Search size={15} aria-hidden="true" />
        <input
          aria-label="Search Academy lessons"
          onChange={event => onSearch(event.target.value)}
          placeholder="Search bitset, validation, state…"
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
          {[...filtered,...academyLessons.filter(lesson=>lesson.number===selected&&!filtered.includes(lesson))].map(lesson => (
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
  const editorHeight = Math.min(520, Math.max(320, currentFile.code.split("\n").length * 21 + 64));

  useEffect(() => {
    let active = true;
    void highlightText(source, languageFor(currentFile), false).then(html => {
      if (active) setHighlighted(html);
    });
    return () => {
      active = false;
    };
  }, [currentFile, source]);

  useEffect(() => {
    if (!currentFile.runnable) return;
    let active = true;
    void compileAcademyComponent(currentFile.code).then(component => {
      if (!active) return;
      setRendered(() => component);
      setRunVersion(version => version + 1);
      setError("");
    }).catch(failure => {
      if (!active) return;
      setRendered(null);
      setError(failure instanceof Error ? failure.message : String(failure));
    });
    return () => {
      active = false;
    };
  }, [currentFile.code, currentFile.name, currentFile.runnable]);

  function selectFile(file: AcademyFile) {
    setFileName(file.name);
    setSource(file.code);
    setRendered(null);
    setError("");
  }

  async function renderPreview(nextSource: string) {
    try {
      const ComponentToRender = await compileAcademyComponent(nextSource);
      setRendered(() => ComponentToRender);
      setRunVersion(version => version + 1);
      setError("");
    } catch (failure) {
      setRendered(null);
      setError(failure instanceof Error ? failure.message : String(failure));
    }
  }

  async function run() {
    if (!currentFile.runnable) return;
    await renderPreview(source);
  }

  function reset() {
    setSource(currentFile.code);
    if (currentFile.runnable) void renderPreview(currentFile.code);
  }

  return (
    <section
      className="academy-workbench"
      aria-label={lesson.track === "React" ? "React playground" : "Lesson source examples"}
      style={{ "--academy-editor-height": `${editorHeight}px` } as React.CSSProperties}
    >
      <div className="academy-workbench-toolbar">
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
        {currentFile.runnable && (
          <div className="academy-run-actions">
            <button onClick={reset} type="button"><RotateCcw size={14} />Reset</button>
            <button className="is-primary" onClick={run} type="button">Run</button>
          </div>
        )}
      </div>
      <div className={`academy-workbench-grid${currentFile.runnable ? "" : " is-source-only"}`}>
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
              Source example. Open the practice below to edit and run this course’s language or environment against real tests. Verify Java host examples on a local server.
            </p>
          )}
        </div>
        {currentFile.runnable && (
          <div className="academy-preview">
            <div className="academy-preview-meta"><span>Preview</span></div>
            <div className="academy-preview-stage" aria-busy={!rendered && !error}>
              {error ? (
                <div className="academy-preview-error">
                  <CircleAlert size={18} aria-hidden="true" />
                  <div><strong>Compile failed</strong><span>{error}</span></div>
                </div>
              ) : rendered ? (
                <PlaygroundBoundary resetKey={runVersion}>
                  {React.createElement(rendered)}
                </PlaygroundBoundary>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const requestPipeline = [
  { title: "Parse JSON", detail: "Convert the request body into a Python value." },
  { title: "Validate PurchaseRequest", detail: "Check player_id, item, and quantity with Pydantic." },
  { title: "Resolve dependencies", detail: "Load authorization and the database session." },
  { title: "Execute purchase", detail: "Run the endpoint logic inside its transaction." },
  { title: "Validate PurchaseResponse", detail: "Check the value returned by the endpoint." },
  { title: "Return HTTP 201", detail: "Serialize the response and send it to the caller." },
] as const;

function FastApiRequestInspector() {
  const [body, setBody] = useState('{\n  "player_id": "Graaly03",\n  "item": "diamond",\n  "quantity": 1\n}');
  const [stage, setStage] = useState(-1);
  const [failedStage, setFailedStage] = useState<number | null>(null);
  const [result, setResult] = useState("Ready to run");
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearInterval(timer.current);
  }, []);

  function sendRequest() {
    if (timer.current !== null) window.clearInterval(timer.current);
    setFailedStage(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      setStage(0);
      setFailedStage(0);
      setResult("422 Unprocessable Entity · invalid JSON body");
      return;
    }
    const value = parsed as Record<string, unknown>;
    if (!value.player_id || !value.item || typeof value.quantity !== "number" || value.quantity < 1) {
      setStage(1);
      setFailedStage(1);
      setResult("422 Unprocessable Entity · check player_id, item, and quantity");
      return;
    }
    setStage(0);
    setResult("Running request");
    timer.current = window.setInterval(() => {
      setStage(current => {
        if (current >= requestPipeline.length - 1) {
          if (timer.current !== null) window.clearInterval(timer.current);
          timer.current = null;
          setResult("201 Created · PurchaseResponse is valid");
          return requestPipeline.length;
        }
        return current + 1;
      });
    }, 320);
  }

  return (
    <section className="academy-api-lab" aria-label="FastAPI request inspector">
      <header>
        <div><span>FastAPI request inspector</span><p>Request pipeline illustration. The linked practice executes the actual FastAPI application.</p></div>
      </header>
      <div className="academy-api-grid">
        <div>
          <div className="academy-request-endpoint">
            <span>Request</span>
            <strong><code>POST</code> /v1/shop/purchase</strong>
          </div>
          <label htmlFor="academy-request-body">JSON body</label>
          <textarea id="academy-request-body" onChange={event => setBody(event.target.value)} spellCheck={false} value={body} />
          <button onClick={sendRequest} type="button">Run request</button>
        </div>
        <div>
          <div className="academy-pipeline">
            {requestPipeline.map((item, index) => (
              <div
                className={failedStage === index ? "is-error" : index < stage ? "is-done" : index === stage ? "is-active" : ""}
                key={item.title}
              >
                <span>{index < stage ? <Check aria-hidden="true" size={12} /> : index + 1}</span>
                <div><strong>{item.title}</strong><small>{item.detail}</small></div>
              </div>
            ))}
          </div>
          <output className={result.startsWith("422") ? "is-error" : result.startsWith("201") ? "is-success" : ""}>{result}</output>
        </div>
      </div>
    </section>
  );
}

function LessonArticle({ lesson, onPractice }: { lesson: AcademyLesson; onPractice(id:string,language:ChallengeLanguage):void }) {
  const nativeLanguage:ChallengeLanguage=lesson.track==="React"?"react-ts":lesson.track==="FastAPI"?"fastapi":"ts";
  const practice=lesson.practice??academyProblems.filter(problem=>problem.lessons.includes(lesson.number)).slice(0,3).map(problem=>({id:problem.id,language:nativeLanguage}));
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
      <section className="academy-practice-links" aria-label="Practice this lesson">
        <span className="academy-kicker">Practice this lesson</span>
        <p>Open an exercise in this course’s profile. You can choose another language or environment at any time.</p>
        {practice.map(item=><button key={item.id+item.language} onClick={()=>onPractice(item.id,item.language)} type="button">{academyProblems.find(problem=>problem.id===item.id)?.title} · {challengeLanguages.find(language=>language.id===item.language)?.label}<ChevronRight size={14}/></button>)}
      </section>
      {lesson.track==="FastAPI"&&<FastApiRequestInspector />}

      <section className="academy-pitfalls">
        <span className="academy-kicker">Failure modes to recognize</span>
        <div>{lesson.pitfalls.map(pitfall => <span key={pitfall}><CircleAlert size={14} />{pitfall}</span>)}</div>
      </section>
    </article>
  );
}

function GraalyAcademyLessons({selected,setSelected,onPractice,course,setCourse}:{selected:number;setSelected:(number:number)=>void;onPractice:(id:string,language:ChallengeLanguage)=>void;course:AcademyTrack | "All courses";setCourse:(value:AcademyTrack | "All courses")=>void}) {
  const [search, setSearch] = useState("");
  const [completed, setCompleted] = useState<Set<number>>(() => new Set());
  const lesson = academyLessons.find(lesson=>lesson.number===selected) ?? academyLessons[0];
  const courseLessons=academyLessons.filter(item=>item.track===lesson.track).sort((a,b)=>Number(a.number<37)-Number(b.number<37)||a.number-b.number);
  const position=courseLessons.findIndex(item=>item.number===lesson.number);
  const progress = completed.size / academyLessons.length;

  function markComplete() {
    setCompleted(current => {
      const next = new Set(current);
      next.add(lesson.number);
      return next;
    });
  }

  function select(number: number) {
    const next=academyLessons.find(item=>item.number===number);if(!next)return;
    setSelected(number);if(course!=="All courses"&&course!==next.track)setCourse(next.track);
  }

  return (
    <div className="academy">
      <section className="academy-intro">
        <div>
          <span>{academyLessons.length} long-form lessons · {academyConceptCount} mapped concepts</span>
          <h3>Learn every Graaly language and integration</h3>
          <p>
            Choose a course in JavaScript, TypeScript, Python, C, React, HTML/CSS, FastAPI, Pydantic, ASGI, SQL or configuration.
            Study the language model, inspect complete source examples and open related practice in your chosen profile.
            Java host lessons cover local server integration; advanced lessons connect the courses into a transactional, realtime plugin.
          </p>
          <div className="academy-downloads">
            <a download href="./downloads/Graaly-Academy-Plugin.zip">Download the in-game Academy</a>
            <a href="https://github.com/sk8erboi17/Graaly/tree/main/runtime/examples/GraalyAcademy.jsplugin" rel="noreferrer" target="_blank">Read the source on GitHub</a>
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
          course={course}
          onCourse={value=>{setCourse(value);setSearch("");if(value!=="All courses"){const first=academyLessons.filter(item=>item.track===value).sort((a,b)=>Number(a.number<37)-Number(b.number<37)||a.number-b.number)[0];if(first)setSelected(first.number);}}}
          onSearch={setSearch}
          onSelect={select}
          search={search}
          selected={lesson.number}
        />
        <main className="academy-content">
          <LessonArticle lesson={lesson} onPractice={onPractice}/>
          <footer className="academy-lesson-footer">
            <button disabled={position===0} onClick={() => select(courseLessons[position-1].number)} type="button">
              <ChevronLeft size={16} />Previous
            </button>
            <button className="is-complete" onClick={markComplete} type="button">
              <Check size={16} />{completed.has(lesson.number) ? "Completed" : "Mark complete"}
            </button>
            <button disabled={position===courseLessons.length-1} onClick={() => select(courseLessons[position+1].number)} type="button">
              Next<ChevronRight size={16} />
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}

export function GraalyAcademy() {
  const [view,setView] = useState("Problems");
  const [lesson,setLesson] = useState(37);
  const [course,setCourse] = useState<AcademyTrack | "All courses">("All courses");
  const [requestedPractice,setRequestedPractice] = useState<PracticeRequest>();
  return <div className="academy-root"><div className="academy-view-tabs" role="tablist" aria-label="Academy view">{["Problems","Lessons"].map(item=><button aria-selected={view===item} key={item} onClick={()=>setView(item)} role="tab" type="button">{item}</button>)}</div><div hidden={view!=="Problems"}><GraalyArena requestedPractice={requestedPractice} onLesson={number=>{setLesson(number);setCourse(academyLessons.find(lesson=>lesson.number===number)?.track??"All courses");setView("Lessons");}}/></div><div hidden={view!=="Lessons"}><GraalyAcademyLessons course={course} setCourse={setCourse} selected={lesson} setSelected={setLesson} onPractice={(id,language)=>{setRequestedPractice({id,language,revision:Date.now()});setView("Problems");}}/></div></div>;
}
