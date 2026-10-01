"use client";
import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { autocompletion, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { html } from "@codemirror/lang-html";
import { sql, SQLite } from "@codemirror/lang-sql";
import { yaml } from "@codemirror/lang-yaml";
import type { ChallengeLanguage } from "./types.ts";

export function AcademyEditor({ value, language, onChange, onRun, onSubmit }: { value:string;language:ChallengeLanguage;onChange:(code:string)=>void;onRun:()=>void;onSubmit:()=>void }) {
  const element = useRef<HTMLDivElement>(null), editor = useRef<EditorView | null>(null);
  const callbacks = useRef({ onChange, onRun, onSubmit });
  useEffect(() => { callbacks.current = { onChange, onRun, onSubmit }; });
  useEffect(() => {
    const view = new EditorView({ parent: element.current!, state: EditorState.create({ doc: value, extensions: [
      lineNumbers(), history(), drawSelection(), highlightActiveLine(), highlightActiveLineGutter(), indentOnInput(), bracketMatching(), closeBrackets(), autocompletion(), syntaxHighlighting(defaultHighlightStyle),
      ["ts","js","react-ts","react-js","plugin-ts","plugin-js"].includes(language) ? javascript({ typescript: language.endsWith("ts"), jsx: true }) : ["py","fastapi","pydantic","asgi"].includes(language) ? python() : language === "c" ? cpp() : language === "html" ? html() : language === "sql" ? sql({ dialect:SQLite }) : yaml(),
      keymap.of([{key:"Mod-Enter",run:()=>{callbacks.current.onRun();return true;}},{key:"Mod-Shift-Enter",run:()=>{callbacks.current.onSubmit();return true;}},indentWithTab,...closeBracketsKeymap,...defaultKeymap,...historyKeymap]),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ "aria-label": "Solution code", "data-testid": "academy-editor", spellcheck: "false" }),
      EditorView.updateListener.of(update => { if(update.docChanged)callbacks.current.onChange(update.state.doc.toString()); }),
      EditorView.theme({ "&": { height:"100%",fontSize:"13px",backgroundColor:"var(--arena-editor)" }, ".cm-scroller":{overflow:"auto",fontFamily:"var(--font-mono, monospace)"},".cm-content":{padding:"16px 0",minHeight:"360px"},".cm-gutters":{backgroundColor:"transparent",color:"var(--text-muted)",borderRight:"1px solid var(--border)"},".cm-activeLine,.cm-activeLineGutter":{backgroundColor:"var(--arena-tint)"},".cm-focused":{outline:"none"} }),
    ] }) });
    editor.current = view;
    return () => { view.destroy(); editor.current = null; };
    // The parent keys this editor by exercise and language; drafts survive outside it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);
  useEffect(() => { const view=editor.current;if(view&&view.state.doc.toString()!==value)view.dispatch({changes:{from:0,to:view.state.doc.length,insert:value}}); }, [value]);
  return <div className="arena-editor" ref={element} />;
}
