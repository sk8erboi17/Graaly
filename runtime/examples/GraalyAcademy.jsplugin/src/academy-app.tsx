import React, { useMemo, useReducer } from "react";
import {
  BossBar,
  ChatInput,
  Inventory,
  Item,
  Line,
  Message,
  Scoreboard,
  Tab,
} from "@graaly/react";
import { lessonByNumber, lessons } from "./lessons";
import { academyReducer, initialAcademyState, catalogPageSize, catalogPages } from "./academy-state";

const materialByTrack = {
  React: "REDSTONE",
  TypeScript: "COMPASS",
  FastAPI: "POTION",
  Architecture: "NETHER_STAR",
  JavaScript: "PAPER", Python: "BOOK", C: "IRON_INGOT", "HTML / CSS": "CHEST",
  Pydantic: "EMERALD", ASGI: "REDSTONE", SQL: "GOLD_INGOT", Configuration: "COMPASS", Java: "DIAMOND",
} as const;

export function AcademyApp({ initialLesson }: { initialLesson?: number } = {}) {
  const [state, dispatch] = useReducer(academyReducer, {
    ...initialAcademyState,
    selected: initialLesson === undefined ? null : lessonByNumber(initialLesson).number,
    catalogPage:initialLesson===undefined?0:Math.floor((lessonByNumber(initialLesson).number-1)/catalogPageSize),
  });
  const lesson = state.selected === null ? null : lessonByNumber(state.selected);
  const completeCount = Object.keys(state.completed).length;
  const progress = completeCount / lessons.length;
  const title = lesson === null ? "Graaly Academy" : "Lesson " + String(lesson.number).padStart(2, "0");

  const catalogItems = useMemo(() => lessons.slice(state.catalogPage*catalogPageSize,(state.catalogPage+1)*catalogPageSize).map((entry, index) => (
    <Item
      amount={Math.min(64,entry.number)}
      key={entry.number}
      lore={[entry.track, entry.concept, state.completed[entry.number] ? "&aCompleted" : "&7Click to study"]}
      material={materialByTrack[entry.track]}
      name={(state.completed[entry.number] ? "&a" : "&f") + entry.title}
      onClick={() => dispatch({ type: "selected", number: entry.number })}
      slot={9 + index}
    />
  )), [state.completed,state.catalogPage]);

  return (
    <>
      {state.notice && <Message id={"academy-notice-" + state.notice.id}>{state.notice.text}</Message>}
      <Scoreboard title="&a&lGraaly Academy">
        <Line id="lesson">{lesson === null ? "Choose a lesson" : title}</Line>
        <Line id="track">{lesson === null ? "JS · TS · Python · C · integrations" : "Track: " + lesson.track}</Line>
        <Line id="progress">Complete: {completeCount} / {lessons.length}</Line>
        <Line id="hint">Command: /academy</Line>
      </Scoreboard>
      <BossBar progress={progress}>&aAcademy progress &8· &f{completeCount}/{lessons.length}</BossBar>
      <Tab header="&a&lGraaly Academy" footer={lesson?.concept ?? "Choose one of " + lessons.length + " lessons"} />

      {lesson === null ? (
        <Inventory id="academy-catalog" title={"Graaly Academy · " + lessons.length + " lessons"} rows={6}>
          {catalogItems}
          <Item slot={45} material="ARROW" name="Previous page" onClick={()=>dispatch({type:"catalog/page",direction:-1})}/>
          <Item slot={49} material="BOOK" name={"Page "+(state.catalogPage+1)+" / "+catalogPages}/>
          <Item slot={53} material="ARROW" name="Next page" onClick={()=>dispatch({type:"catalog/page",direction:1})}/>
        </Inventory>
      ) : (
        <Inventory id={"academy-lesson-" + lesson.number} title={title + " · " + lesson.track} rows={3}>
          <Item slot={9} material="ARROW" name="&7All lessons" onClick={() => dispatch({ type: "catalog" })} />
          <Item
            slot={11}
            material="ARROW"
            name="&fPrevious"
            lore={[lesson.number === 1 ? "&7Already at lesson one" : "&aGo back"]}
            onClick={() => dispatch({ type: "moved", direction: -1 })}
          />
          <Item
            slot={13}
            material={state.completed[lesson.number] ? "EMERALD_BLOCK" : "BOOK"}
            name={state.completed[lesson.number] ? "&aCompleted" : "&aMark complete"}
            lore={[lesson.concept]}
            onClick={() => dispatch({ type: "completed" })}
          />
          <Item
            slot={15}
            material="PAPER"
            name="&eAnswer the checkpoint"
            lore={[lesson.question, "&7Your next chat message becomes the answer."]}
            onClick={() => dispatch({ type: "answer/opened" })}
          />
          <Item
            slot={17}
            material="ARROW"
            name="&fNext"
            lore={[lesson.number === lessons.length ? "&7This is the capstone" : "&aContinue"]}
            onClick={() => dispatch({ type: "moved", direction: 1 })}
          />
        </Inventory>
      )}

      {state.answering && lesson && (
        <ChatInput
          id={"academy-answer-" + lesson.number}
          prompt={"Checkpoint: " + lesson.question}
          cancelWord="cancel"
          onCancel={() => dispatch({ type: "answer/cancelled" })}
          onSubmit={value => dispatch({ type: "answer/submitted", value })}
        />
      )}
    </>
  );
}
