export type CFunction = { kind: "property" | "method" | "constructor" | "constant"; name: string; signature: string };
export type CTypeReference = { handle: string; functions: CFunction[] };
type CBucket = {
  parameters: string[];
  types: Record<string, { handle: string; prefix: string; functions: [number, string, number][] }>;
};

const buckets = new Map<string, Promise<CBucket>>();

export async function loadCReference(name: string, packets: boolean): Promise<CTypeReference> {
  // Relative paths also work at /Graaly/ on GitHub Pages. Cache a small alphabet bucket.
  const url = `./contracts/c-reference/${packets ? "packets" : "bukkit"}/${name[0].toUpperCase()}.json`;
  let pending = buckets.get(url);
  if (!pending) {
    pending = fetch(url).then(response => {
      if (!response.ok) throw new Error(`Could not load C reference (${response.status}).`);
      return response.json() as Promise<CBucket>;
    }).catch(error => { buckets.delete(url); throw error; });
    buckets.set(url, pending);
  }
  const bucket = await pending;
  const entry = bucket.types[name];
  if (!entry) throw new Error(`No C reference for ${name}.`);
  const kinds = ["property", "method", "constructor", "constant"] as const;
  return {
    handle: entry.handle,
    functions: entry.functions.map(([kind, suffix, params]) => ({
      kind: kinds[kind],
      name: kind === 3 ? suffix : `${entry.prefix}${suffix}`,
      signature: kind === 3 ? `#define ${suffix} ${bucket.parameters[params]}`
        : `graaly_status_t ${entry.prefix}${suffix}(${bucket.parameters[params].replaceAll("$self", entry.handle)});`,
    })),
  };
}

export function cPacketExample(path: string): string {
  const direction = path.includes(".Server.") ? "send" : "receive";
  return [
    "#include <graaly/packets.h>", "", "static graaly_packet_binding_t binding = {0};", "",
    "static void on_packet(graaly_packet_event_t event) {",
    "    bool cancelled = false;",
    "    if (graaly_packet_event_cancelled(event, &cancelled) != GRAALY_OK) return;",
    "    /* Synchronous network callback: inspect or cancel the event here. */",
    "    /* Schedule world/player mutations on the server thread. */",
    "    if (!cancelled) graaly_log(GRAALY_LOG_INFO, \"Observed packet\");", "}", "",
    "void graaly_on_enable(void) {", "    graaly_packet_type_t type = {0};",
    `    if (graaly_packet_type_find("${path}", &type) != GRAALY_OK) return;`,
    `    graaly_status_t status = graaly_packet_on_${direction}(`,
    "        type, GRAALY_PRIORITY_NORMAL, on_packet, &binding);",
    "    graaly_release(&type);",
    "    if (status != GRAALY_OK) graaly_log(GRAALY_LOG_WARNING, \"Listener registration failed\");", "}", "",
    "void graaly_on_disable(void) {", "    graaly_release(&binding);", "}",
  ].join("\n");
}

export function cTypeExample(reference: CTypeReference): string {
  const reader = reference.functions.find(fn => fn.kind === "property" && !fn.name.endsWith("_write"));
  const packet = reference.handle.startsWith("graaly_pe_");
  const lines = [`#include <graaly/${packet ? "packets" : "graaly"}.h>`, ""];
  if (!reader) return [...lines, `${reference.handle} value = {0};`,
    "/* Obtain a valid handle through the typed module functions or a callback. */",
    "/* Release owned handles with graaly_release(&value). */"].join("\n");
  const params = reader.signature.slice(reader.signature.indexOf("(") + 1, -2).split(", ").slice(1);
  lines.push(`graaly_status_t inspect_value(${reference.handle} value) {`);
  const args = ["value"];
  let ownsResult = false;
  for (const param of params) {
    if (param === "char *buffer") {
      lines.push("    char buffer[256] = {0};"); args.push("buffer");
    } else if (param === "size_t capacity") args.push("sizeof buffer");
    else if (param === "size_t *required") {
      lines.push("    size_t required = 0u;"); args.push("&required");
    } else {
      const type = param.replace(/ \*out$/, "");
      ownsResult = type.startsWith("graaly_");
      lines.push(`    ${type} result = ${ownsResult ? "{0}" : type === "bool" ? "false" : "0"};`);
      args.push("&result");
    }
  }
  lines.push(`    graaly_status_t status = ${reader.name}(${args.join(", ")});`);
  if (ownsResult) lines.push("    if (status == GRAALY_OK) graaly_release(&result);");
  lines.push("    return status;", "}", "/* value is borrowed; this function releases only newly returned handles. */");
  return lines.join("\n");
}
