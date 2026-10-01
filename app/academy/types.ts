export type ChallengeLanguage = "ts" | "js" | "py" | "c" | "html" | "sql" | "yaml";
export type ChallengeDifficulty = "Medium" | "Hard";
export type ChallengeMode = "function" | "plugin" | "react" | "python" | "asgi" | "fastapi" | "pydantic" | "html-css" | "sql" | "manifest" | "c";
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type ChallengeCase = {
  name: string;
  input: Json;
  expected: Json;
  hidden?: boolean;
  /** Trusted C test-harness expression; never supplied by the visitor. */
  cExpression?: string;
};

export type Challenge = {
  id: string;
  number: number;
  title: string;
  track: string;
  difficulty: ChallengeDifficulty;
  mode: ChallengeMode;
  tags: string[];
  modules: string[];
  lessons: number[];
  description: string[];
  requirements: string[];
  inputType: string;
  starters: Partial<Record<ChallengeLanguage, string>>;
  solutions: Partial<Record<ChallengeLanguage, string>>;
  cases: ChallengeCase[];
  hints: string[];
  explanation: string[];
  complexity: string;
  pitfalls: string[];
  /** C declarations shared with the harness, and code that prints a solve result as JSON. */
  cDeclarations?: string;
  cPrint?: string;
  htmlChecks?: { selector: string; property: string; expected: Json }[];
  sqlSchema?: string;
};

export type CaseResult = {
  name: string;
  passed: boolean;
  input: Json;
  expected: Json;
  actual?: Json;
  error?: string;
  durationMs: number;
  logs: string[];
};
export type JudgeResult = {
  verdict: "Accepted" | "Wrong Answer" | "Runtime Error" | "Compile Error" | "Time Limit Exceeded" | "Stopped";
  cases: CaseResult[];
  durationMs: number;
  error?: string;
};
export type ProblemProgress = {
  attempts: number;
  solved: boolean;
  assisted: boolean;
  revealed: boolean;
  hints: number;
  lastVerdict?: JudgeResult["verdict"];
};

export const challengeLanguages: { id: ChallengeLanguage; label: string; extension: string }[] = [
  { id: "ts", label: "TypeScript", extension: "ts" },
  { id: "js", label: "JavaScript", extension: "mjs" },
  { id: "py", label: "Python", extension: "py" },
  { id: "c", label: "C / WebAssembly", extension: "c" },
  { id: "html", label: "HTML / CSS", extension: "html" },
  { id: "sql", label: "SQL", extension: "sql" },
  { id: "yaml", label: "YAML", extension: "yml" },
];

export function jsonEqual(left: unknown, right: unknown): boolean {
  if (typeof left === "number" && typeof right === "number") {
    return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= 1e-9;
  }
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => jsonEqual(value, right[index]));
  }
  if (left && right && typeof left === "object" && typeof right === "object"
    && !Array.isArray(left) && !Array.isArray(right)) {
    const a = Object.keys(left).sort(), b = Object.keys(right).sort();
    return a.length === b.length && a.every((key, index) => key === b[index]
      && jsonEqual((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]));
  }
  return false;
}
