import type { Challenge, ChallengeCase, Json } from "./types.ts";

type Definition = {
  id: string; title: string; track: string; hard?: boolean;
  tags: string[]; modules?: string[]; lessons?: number[];
  task: string; rules: string[]; input: string;
  body: string; hints: string[]; why: string[]; cost: string; pitfalls?: string[];
  examples: [Json, Json, string?][];
  extra?: [Json, Json, string?][];
  imports?: string; mode?: "function" | "plugin" | "react";
  starter?: string;
};

export function exercise(d: Definition): Challenge {
  const mode = d.mode ?? "function";
  const entry = mode === "plugin" ? "setup" : mode === "react" ? "App" : "solve";
  const imports = d.imports ? d.imports + "\n\n" : "";
  const solution = `${imports}export ${mode === "react" ? "default " : ""}function ${entry}(input) {\n${d.body.trim().split("\n").map(line => "  " + line).join("\n")}\n}\n`;
  const starter = d.starter ?? `${imports}/** ${d.title} */\nexport ${mode === "react" ? "default " : ""}function ${entry}(input) {\n  // TODO: implement the requirements.\n  throw new Error("Not implemented");\n}\n`;
  const makeCases = (values: Definition["examples"], hidden: boolean): ChallengeCase[] => values.map(([input, expected, name], index) => ({
    name: name ?? `${hidden ? "Edge case" : "Example"} ${index + 1}`, input, expected, hidden,
  }));
  return {
    id: d.id, number: 0, title: d.title, track: d.track,
    difficulty: d.hard ? "Hard" : "Medium", mode, tags: d.tags,
    modules: d.modules ?? [], lessons: d.lessons ?? [], description: [d.task], requirements: d.rules,
    inputType: d.input, starters: { ts: starter, js: starter }, solutions: { ts: solution, js: solution },
    cases: [...makeCases(d.examples, false), ...makeCases(d.extra ?? [], true)],
    hints: d.hints, explanation: d.why, complexity: d.cost, pitfalls: d.pitfalls ?? [],
  };
}
