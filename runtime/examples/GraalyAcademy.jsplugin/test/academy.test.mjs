import assert from "node:assert/strict";
import test from "node:test";
import { academyReducer, initialAcademyState } from "../src/academy-state.ts";

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
