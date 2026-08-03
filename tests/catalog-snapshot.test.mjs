#!/usr/bin/env node
/**
 * Guards the bundled catalog snapshot.
 *
 * The snapshot exists so introspection survives having no network. That makes it a
 * SECOND copy of the catalog — the exact class of thing the v8 proxy rewrite was
 * built to eliminate. These checks are what keep it from rotting into a lie:
 *
 *   1. it exists, is well-formed, and is non-empty
 *   2. every entry has the shape a client expects (tools need name + inputSchema)
 *   3. it MATCHES the live catalog — same tool names, same prompt names
 *
 * Check 3 is the important one and is wired into `prepublishOnly`, so publishing a
 * package whose snapshot disagrees with the deployed worker fails the release rather
 * than shipping drift. Run `npm run sync:catalog` after deploying the worker.
 *
 * Network-optional: with no egress, checks 1-2 still run and check 3 is skipped with
 * a visible notice (never silently passed).
 */
import { CATALOG_SNAPSHOT } from "../dist/catalog-snapshot.js";

const BASE = process.env.THREADLINQS_API_URL || "https://intel.threadlinqs.com";
let failures = 0;
const fail = (msg) => {
  console.error(`  FAIL  ${msg}`);
  failures++;
};
const pass = (msg) => console.log(`  ok    ${msg}`);

// ── 1. shape ──────────────────────────────────────────────────────────────
const KEYS = ["tools", "prompts", "resources", "resourceTemplates"];
for (const k of KEYS) {
  const v = CATALOG_SNAPSHOT[k];
  if (!Array.isArray(v)) fail(`snapshot.${k} is not an array`);
  else if (v.length === 0) fail(`snapshot.${k} is empty — an empty list reads as "no capability"`);
  else pass(`snapshot.${k}: ${v.length}`);
}

// ── 2. per-entry validity ─────────────────────────────────────────────────
const badTools = (CATALOG_SNAPSHOT.tools ?? []).filter(
  (t) => !t || typeof t.name !== "string" || !t.name || typeof t.inputSchema !== "object",
);
if (badTools.length) fail(`${badTools.length} tool(s) missing name or inputSchema`);
else pass("every tool has name + inputSchema");

const badPrompts = (CATALOG_SNAPSHOT.prompts ?? []).filter(
  (p) => !p || typeof p.name !== "string" || !p.name,
);
if (badPrompts.length) fail(`${badPrompts.length} prompt(s) missing name`);
else pass("every prompt has a name");

const dupes = (() => {
  const seen = new Set();
  const d = [];
  for (const t of CATALOG_SNAPSHOT.tools ?? []) {
    if (seen.has(t?.name)) d.push(t.name);
    seen.add(t?.name);
  }
  return d;
})();
if (dupes.length) fail(`duplicate tool names: ${dupes.join(", ")}`);
else pass("no duplicate tool names");

// ── 3. parity with the deployed catalog ───────────────────────────────────
let live = null;
try {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  // Cache-bust: the catalog is served `public, max-age=3600`, so within an hour of a deploy
  // an edge node will hand back the PREVIOUS catalog and this parity check would "fail" a
  // snapshot that is actually correct — or worse, pass a stale one.
  const res = await fetch(`${BASE}/mcp/catalog.json?cb=${Number(process.hrtime.bigint() % 1000000n)}`, {
    headers: { Accept: "application/json", "cache-control": "no-cache" },
    signal: ctrl.signal,
  });
  clearTimeout(timer);
  if (res.ok) live = await res.json();
  else fail(`live catalog fetch returned ${res.status}`);
} catch {
  console.log(`  SKIP  parity check — could not reach ${BASE} (offline?)`);
}

if (live) {
  for (const [key, label] of [
    ["tools", "tool"],
    ["prompts", "prompt"],
  ]) {
    const snapNames = new Set((CATALOG_SNAPSHOT[key] ?? []).map((x) => x.name));
    const liveNames = new Set((live[key] ?? []).map((x) => x.name));
    const missing = [...liveNames].filter((n) => !snapNames.has(n));
    const extra = [...snapNames].filter((n) => !liveNames.has(n));
    if (missing.length)
      fail(
        `snapshot is MISSING ${missing.length} ${label}(s) the server now serves: ` +
          `${missing.slice(0, 8).join(", ")}${missing.length > 8 ? "…" : ""}\n` +
          `        -> run: npm run sync:catalog   (after the worker is deployed)`,
      );
    if (extra.length)
      fail(
        `snapshot claims ${extra.length} ${label}(s) the server no longer has: ` +
          `${extra.slice(0, 8).join(", ")}${extra.length > 8 ? "…" : ""}\n` +
          `        -> run: npm run sync:catalog`,
      );
    if (!missing.length && !extra.length)
      pass(`${key} parity with live catalog (${liveNames.size})`);
  }
}

console.log(
  failures === 0
    ? `\nPASS — catalog snapshot is valid${live ? " and in sync with the deployed server" : " (parity unverified, offline)"}`
    : `\nFAIL — ${failures} problem(s)`,
);
process.exit(failures === 0 ? 0 : 1);
