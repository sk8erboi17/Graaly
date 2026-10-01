import type { Challenge, Json } from "./types.ts";

type PythonDefinition = {
  id: string; title: string; track: string; hard?: boolean;
  mode?: "python" | "asgi" | "pydantic" | "fastapi"; tags: string[]; lessons: number[];
  task: string; rules: string[]; starter: string; solution: string;
  examples: [Json, Json, string?][]; extra: [Json, Json, string?][];
  hints: string[]; why: string[]; cost: string; pitfalls?: string[];
};
export function pythonExercise(d: PythonDefinition): Challenge {
  return {
    id: d.id, number: 0, title: d.title, track: d.track, difficulty: d.hard ? "Hard" : "Medium",
    mode: d.mode ?? "python", tags: d.tags, lessons: d.lessons, modules: [],
    description: [d.task], requirements: d.rules,
    inputType: d.mode === "fastapi" ? "Requests are sent to your exported FastAPI app. Each case starts a fresh lifespan." : "JSON input is passed to solve(input). Return a JSON-compatible value.",
    starters: { py: d.starter.trim() + "\n" }, solutions: { py: d.solution.trim() + "\n" },
    cases: [...d.examples.map(([input, expected, name], index) => ({ input, expected, name: name ?? `Example ${index + 1}`, hidden: false })),
      ...d.extra.map(([input, expected, name], index) => ({ input, expected, name: name ?? `Edge case ${index + 1}`, hidden: true }))],
    hints: d.hints, explanation: d.why, complexity: d.cost, pitfalls: d.pitfalls ?? [],
  };
}

export const modelRunner = `
def solve(input):
    try:
        model = Request.model_validate(input)
        return {"ok": True, "value": model.model_dump(mode="json")}
    except ValidationError as error:
        return {"ok": False, "errors": [
            {"loc": list(item["loc"]), "type": item["type"]}
            for item in error.errors()
        ]}
`;
export function pydanticModel(d: Omit<PythonDefinition, "mode" | "track" | "starter" | "solution"> & { imports?: string; model: string }): Challenge {
  const imports = "from pydantic import BaseModel, Field, ValidationError, ConfigDict, field_validator, model_validator\n"
    + (d.imports ?? "");
  return pythonExercise({ ...d, mode: "pydantic", track: "Pydantic",
    starter: imports + "\nclass Request(BaseModel):\n    # TODO: declare the validated contract.\n    pass\n" + modelRunner,
    solution: imports + "\n" + d.model + "\n" + modelRunner,
  });
}
