import { writeFile } from "node:fs/promises";
import { foundationLessons } from "../app/academy-foundations.ts";

const checkpoints = foundationLessons.map(lesson => {
  if (!lesson.checkpoint?.question || !lesson.checkpoint.accepted.length) throw Error("Missing checkpoint: " + lesson.id);
  return {number:lesson.number,track:lesson.track,title:lesson.title,concept:lesson.mentalModel,...lesson.checkpoint};
});
await writeFile(new URL("../runtime/examples/GraalyAcademy.jsplugin/src/generated-lessons.ts",import.meta.url),
  '// Generated from the authored language courses by scripts/generate-academy-lessons.mjs.\nimport type { GameLesson } from "./lessons.ts";\n\nexport const foundationCheckpoints: readonly GameLesson[] = '+JSON.stringify(checkpoints,null,2)+';\n');
console.log("Generated " + checkpoints.length + " language-course checkpoints.");
