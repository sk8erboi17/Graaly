import assert from "node:assert/strict";
import test from "node:test";
import { academyReducer, initialAcademyState } from "../src/academy-state.ts";
import { lessons, lessonByNumber } from "../src/lessons.ts";

test("academy reducer navigates, validates checkpoints, and preserves immutable progress", () => {
  const selected = academyReducer(initialAcademyState, { type: "selected", number: 1 });
  assert.equal(selected.selected, 1);

  const wrong = academyReducer(selected, { type: "answer/submitted", value: "class" });
  assert.equal(Object.keys(wrong.completed).length, 0);
  assert.match(wrong.notice.text, /Not yet/);

  const correct = academyReducer(selected, { type: "answer/submitted", value: "component" });
  assert.deepEqual(correct.completed, { 1: true });
  assert.notEqual(correct.completed, selected.completed);

  const next = academyReducer(correct, { type: "moved", direction: 1 });
  assert.equal(next.selected, 2);
  assert.deepEqual(next.completed, { 1: true });
});

test("all 84 companion checkpoints are reachable and validate their canonical answer", () => {
  assert.equal(lessons.length,84);
  for(const lesson of lessons){
    assert.equal(lessonByNumber(lesson.number).number,lesson.number);
    const selected=academyReducer(initialAcademyState,{type:"selected",number:lesson.number});
    const completed=academyReducer(selected,{type:"answer/submitted",value:lesson.accepted[0]});
    assert.equal(completed.completed[lesson.number],true);
  }
});
