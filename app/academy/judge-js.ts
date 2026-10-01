import * as React from "react";
import * as GraalyReact from "../../runtime/sdk/react/src/index.ts";
import { render } from "../../runtime/sdk/react-test/src/index.ts";
import { transform } from "sucrase";
import { parseDocument } from "yaml";
import { createAcademyHost } from "./host.ts";
import { jsonEqual, type Challenge, type ChallengeCase, type Json } from "./types.ts";
import * as portableHelpers from "./portable-helpers.ts";
export const initJsSql=portableHelpers.initPortableSql;

type Callable = (...args: unknown[]) => unknown;
type Exports = Record<string, Callable>;
function evaluate(source: string, host: ReturnType<typeof createAcademyHost>, roots: GraalyReact.GraalyRoot[]): Exports {
  const compiled = transform(source, { transforms: ["typescript", "jsx", "imports"], production: true, filePath: "solution.tsx" }).code;
  const output = { exports: {} as Exports };
  const require = (name: string): unknown => {
    if (name === "react") return React;
    if (name === "@graaly/react") return {...GraalyReact,createRoot:(...args:Parameters<typeof GraalyReact.createRoot>)=>{const root=GraalyReact.createRoot(...args);roots.push(root);return root;}};
    if (name === "graaly") return host.exports;
    if (name === "@graaly/academy") return portableHelpers;
    throw new Error(`Module '${name}' is not available in this exercise. Use react, @graaly/react or graaly.`);
  };
  new Function("module", "exports", "require", compiled)(output, output.exports, require);
  return output.exports;
}
function clean(value: unknown): Json {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value)) as Json;
}
function select(value: unknown, path: string): unknown {
  const parts=path.split(".");let item=value;
  while(parts.length){if(item==null)return null;const record=item as Record<string,unknown>;let length=parts.length;while(length>1&&!Object.hasOwn(record,parts.slice(0,length).join(".")))length--;item=record[parts.splice(0,length).join(".")];}
  return item;
}
export async function judgeJsCase(problem: Challenge, source: string, test: ChallengeCase): Promise<Json> {
  if (problem.mode === "manifest") {
    const document = parseDocument(source, { uniqueKeys: true, maxAliasCount: 20 } as never);
    if (document.errors.length) throw new SyntaxError(document.errors.map(error => error.message).join("\n"));
    const data = document.toJS({ maxAliasCount: 20 });
    const fixture = test.input as { paths?: string[]; values?: Record<string, Json> };
    return clean(Object.fromEntries((fixture.paths ?? []).map(path => [path, select(data, path)])));
  }
  const host = createAcademyHost(test.input);
  (globalThis as unknown as { __academyHost: unknown }).__academyHost = host.exports;
  const ownedRoots:GraalyReact.GraalyRoot[]=[];
  const exports = evaluate(source, host,ownedRoots);
  if (problem.mode === "plugin") {
    if (typeof exports.setup !== "function") throw new Error("Export function setup(input).");
    if(problem.jsonFunction==="plugin"){
      const input=structuredClone(test.input);await exports.setup(input);
      if(!jsonEqual(input,test.input))throw Error("setup(input) must preserve the caller's input.");
      const trace=host.trace as Json[][];
      if(trace.length!==1||trace[0][0]!=="log"||trace[0][1]!=="info"||typeof trace[0][2]!=="string")throw Error("Send exactly one info(JSON.stringify(result)) through the SDK.");
      return JSON.parse(trace[0][2]) as Json;
    }
    const dispose = await exports.setup(host.input);
    await host.drive(dispose);
    if ((test.input as { dispose?: boolean }).dispose && typeof dispose === "function") await dispose();
    return clean(host.trace);
  }
  if (problem.mode === "react") {
    if (typeof exports.default !== "function") throw new Error("Export default function App(input).");
    const fixture = test.input as { props?: Record<string, unknown>; actions?: { kind: string; slot?: number; value?: string; props?: Record<string, unknown>; shift?: boolean; right?: boolean }[]; paths?: string[] };
    const input=structuredClone(test.input);
    const view = await render(React.createElement(exports.default as React.ComponentType, problem.jsonFunction === "react" ? {input} : fixture.props ?? {}));
    try {
      if(problem.jsonFunction === "react"){
        if(!jsonEqual(input,test.input))throw new Error("App({input}) must preserve the caller's input.");
        const messages=view.snapshot.messages as {text:string}[]|undefined;
        if(messages?.length!==1)throw new Error("Render exactly one Message containing the JSON result.");
        return JSON.parse(messages[0].text) as Json;
      }
      for (const action of fixture.actions ?? []) {
        if (action.kind === "click") await view.clickSlot(action.slot ?? 0, { shift: !!action.shift, right: !!action.right });
        else if (action.kind === "submit") await view.submitInput(action.value ?? "");
        else if (action.kind === "cancel") await view.cancelInput();
        else if (action.kind === "close") await view.closeInventory();
        else if (action.kind === "rerender") await view.rerender(React.createElement(exports.default as React.ComponentType, action.props ?? {}));
        else throw new Error(`Unsupported React test action: ${action.kind}`);
      }
      const native=Object.fromEntries(host.trace.filter(entry=>Array.isArray(entry)&&entry[0]==="ui.render").map(entry=>[String((entry as Json[])[1]),(entry as Json[])[2]]));
      const state={...view.snapshot,native};
      const snapshot = fixture.paths ? Object.fromEntries(fixture.paths.map(path => [path, select(state, path)])) : view.snapshot;
      return clean(snapshot);
    } finally { await view.unmount();await React.act(async()=>{ownedRoots.forEach(root=>root.unmount());}); }
  }
  if (typeof exports.solve !== "function") throw new Error("Export function solve(input).");
  const input = structuredClone(test.input);
  const result = await exports.solve(input);
  if (!jsonEqual(input, test.input)) throw new Error("solve(input) must preserve the caller's input. Copy mutable arrays and objects before changing them.");
  return clean(result);
}
