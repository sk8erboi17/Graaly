import { lessonByNumber, lessons } from "./lessons.ts";
export const catalogPageSize = 36;
export const catalogPages = Math.ceil(lessons.length / catalogPageSize);

export type AcademyState = {
  selected: number | null;
  catalogPage: number;
  completed: Readonly<Record<number, true>>;
  answering: boolean;
  notice: { id: number; text: string } | null;
};

export type AcademyAction =
  | { type: "catalog" }
  | { type: "catalog/page"; direction: -1 | 1 }
  | { type: "selected"; number: number }
  | { type: "moved"; direction: -1 | 1 }
  | { type: "completed" }
  | { type: "answer/opened" }
  | { type: "answer/cancelled" }
  | { type: "answer/submitted"; value: string };

export const initialAcademyState: AcademyState = {
  selected: null,
  catalogPage: 0,
  completed: {},
  answering: false,
  notice: null,
};

export function academyReducer(state: AcademyState, action: AcademyAction): AcademyState {
  switch (action.type) {
    case "catalog":
      return { ...state, selected: null, answering: false };
    case "catalog/page":
      return {...state,catalogPage:Math.max(0,Math.min(catalogPages-1,state.catalogPage+action.direction))};
    case "selected":
      return { ...state, selected: lessonByNumber(action.number).number, catalogPage:Math.floor((lessonByNumber(action.number).number-1)/catalogPageSize), answering: false };
    case "moved": {
      const selected = lessonByNumber((state.selected ?? 1) + action.direction).number;
      return { ...state, selected, catalogPage:Math.floor((selected-1)/catalogPageSize), answering: false, notice: null };
    }
    case "completed": {
      if (state.selected === null) return state;
      return {
        ...state,
        completed: { ...state.completed, [state.selected]: true },
        notice: { id: Date.now(), text: "&aLesson marked complete." },
      };
    }
    case "answer/opened":
      return { ...state, answering: true, notice: null };
    case "answer/cancelled":
      return { ...state, answering: false, notice: { id: Date.now(), text: "&7Question cancelled." } };
    case "answer/submitted": {
      if (state.selected === null) return state;
      const lesson = lessonByNumber(state.selected);
      const normalized = action.value.trim().toLowerCase();
      const correct = lesson.accepted.some(value => value.toLowerCase() === normalized);
      return {
        ...state,
        answering: false,
        completed: correct ? { ...state.completed, [lesson.number]: true } : state.completed,
        notice: {
          id: Date.now(),
          text: correct ? "&aCorrect. Lesson completed." : "&cNot yet. Read the concept and retry.",
        },
      };
    }
  }
}
