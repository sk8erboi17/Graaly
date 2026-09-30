import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { cPacketExample, cTypeExample, loadCReference } from "../app/c-api.ts";
import { cLabExamples, cPacketExamples } from "../app/generated-c-learning.ts";
import { packetTopics, cGuideCode } from "../app/guide-topics.ts";

const sdkInclude = resolve("runtime/sdk/c/include");
function compile(source, object) {
  execFileSync("zig", ["cc", "-target", "wasm32-wasi", "-std=c11", "-O0", "-Wall", "-Wextra",
    "-Wpedantic", "-Werror", "-Wno-unused-function", "-Wno-unused-variable", "-I", sdkInclude,
    "-c", source, "-o", object], { stdio: "pipe" });
}

test("compiles every C memory lab and every authored PacketEvents C guide", async () => {
  const directory = await mkdtemp(join(tmpdir(), "graaly-c-docs-"));
  try {
    assert.equal(Object.keys(cLabExamples).length, 7);
    for (const topic of packetTopics) {
      assert.equal(cGuideCode(topic), cPacketExamples[topic.id], `missing real C example: ${topic.id}`);
    }
    for (const [id, code] of Object.entries({ ...cLabExamples, ...cPacketExamples })) {
      const source = join(directory, `${id}.c`);
      await writeFile(source, code);
      try { compile(source, join(directory, `${id}.o`)); }
      catch (error) { throw new Error(`${id} did not compile:\n${error.stderr?.toString() ?? error.message}`); }
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("C catalog examples compile for all 2243 real SDK handle types", async () => {
  const directory = await mkdtemp(join(tmpdir(), "graaly-c-catalog-"));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => new Response(await readFile(resolve("public", String(url)), "utf8"));
  try {
    const examples = [];
    let count = 0;
    for (const namespace of ["bukkit", "packets"]) {
      for (const filename of await readdir(`public/contracts/c-reference/${namespace}`)) {
        const bucket = JSON.parse(await readFile(`public/contracts/c-reference/${namespace}/${filename}`, "utf8"));
        for (const name of Object.keys(bucket.types)) {
          const reference = await loadCReference(name, namespace === "packets");
          assert.ok(reference.handle.startsWith("graaly_"));
          assert.ok(reference.functions.every(fn => !/graaly_(?:get|set|call)\(/.test(fn.signature)));
          examples.push(cTypeExample(reference).replace(/\binspect_value\b/g, `inspect_${namespace}_${name}`)
            .replace(/\bvalue\b/g, `value_${namespace}_${name}`));
          count++;
        }
      }
    }
    assert.equal(count, 2243);
    for (const [index, path] of ["Play.Client.CHAT_MESSAGE", "Play.Server.UPDATE_HEALTH", "Login.Client.LOGIN_START"].entries()) {
      examples.push(cPacketExample(path).replace(/\bon_packet\b/g, `on_packet_${index}`)
        .replace(/\bbinding\b/g, `binding_${index}`).replace(/\bgraaly_on_enable\b/g, `example_enable_${index}`)
        .replace(/\bgraaly_on_disable\b/g, `example_disable_${index}`));
    }
    const source = join(directory, "catalog.c");
    await writeFile(source, examples.join("\n\n"));
    try { compile(source, join(directory, "catalog.o")); }
    catch (error) { throw new Error(`C catalog example did not compile:\n${error.stderr?.toString() ?? error.message}`); }
  } finally {
    globalThis.fetch = originalFetch;
    await rm(directory, { recursive: true, force: true });
  }
});
