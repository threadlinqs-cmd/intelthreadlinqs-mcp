#!/usr/bin/env node
/**
 * The proxy's v7 legacy-name table (LEGACY_ALIASES / LEGACY_PARAM_FIXUPS in src/index.ts) against what
 * the server now serves, so the table can neither shadow a name the server answers itself nor point
 * at a name the server stopped answering.
 *
 * Two references, both read from this repository:
 *   - the bundled snapshot (the v9 tool list the proxy ships with);
 *   - packages/mcp-v9/docs/TOOL-SURFACE.md, whose "v8 name -> v9 call" table lists all 81 names v9 keeps
 *     callable. Skipped (visibly) when the file is not there, e.g. in a checkout of the package alone.
 *
 *   node tests/aliases.test.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG_SNAPSHOT } from "../dist/catalog-snapshot.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = readFileSync(join(ROOT, "src", "index.ts"), "utf8");
const SURFACE = join(ROOT, "..", "mcp-v9", "docs", "TOOL-SURFACE.md");

let pass = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok    ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${e.message}`);
  }
}
const skip = (name, why) => console.log(`  SKIP  ${name} — ${why}`);

const slice = (start, end) => {
  const i = SRC.indexOf(start);
  assert.ok(i >= 0, `cannot find ${start} in src/index.ts`);
  return SRC.slice(i, SRC.indexOf(end, i));
};
const aliases = [...slice("const LEGACY_ALIASES", "\n};").matchAll(/^\s{2}([a-z0-9_]+):\s*\{\s*to:\s*"([a-z0-9_]+)"/gm)].map(([, from, to]) => ({ from, to }));
const fixups = [...slice("const LEGACY_PARAM_FIXUPS", "\n};").matchAll(/^\s{2}([a-z0-9_]+):/gm)].map((m) => m[1]);
const listed = new Set(CATALOG_SNAPSHOT.tools.map((t) => t.name));

console.log("legacy-name table");
check(`the table parsed (${aliases.length} aliases, ${fixups.length} fixups)`, () => {
  assert.ok(aliases.length > 10);
  assert.ok(fixups.length >= 2);
});
check("no alias source is a tool the server lists today", () => {
  const clash = aliases.filter((a) => listed.has(a.from)).map((a) => a.from);
  assert.deepEqual(clash, [], `these names are listed tools now and must not be rewritten: ${clash.join(", ")}`);
});

if (!existsSync(SURFACE)) {
  skip("alias sources / targets against the v9 alias table", `${SURFACE} not found`);
} else {
  const md = readFileSync(SURFACE, "utf8");
  const from = md.indexOf("## v8 name");
  const rows = md.slice(from, md.indexOf("\n## ", from + 5) < 0 ? undefined : md.indexOf("\n## ", from + 5));
  const callable = new Set([...rows.matchAll(/^\| `([a-z0-9_]+)` \|/gm)].map((m) => m[1]));
  for (const n of listed) callable.add(n);
  check(`v9 keeps ${callable.size} names callable (table parsed)`, () => assert.ok(callable.size >= 81 && callable.size < 100));
  check("no alias source is a name v9 serves itself (it would shadow v9's own routing)", () => {
    const clash = aliases.filter((a) => callable.has(a.from)).map((a) => a.from);
    assert.deepEqual(clash, [], `v9 already answers: ${clash.join(", ")} — drop them from LEGACY_ALIASES`);
  });
  check("every alias target is callable on v9", () => {
    const gone = aliases.filter((a) => !callable.has(a.to)).map((a) => `${a.from} -> ${a.to}`);
    assert.deepEqual(gone, [], `targets v9 does not answer: ${gone.join(", ")}`);
  });
  check("every fixup names a tool v9 answers", () => {
    assert.deepEqual(fixups.filter((n) => !callable.has(n)), []);
  });
}

console.log(failed === 0 ? `\nPASS — ${pass} checks` : `\nFAIL — ${failed} of ${pass + failed} checks`);
process.exit(failed === 0 ? 0 : 1);
