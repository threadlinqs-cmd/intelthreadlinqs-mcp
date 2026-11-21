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
 *   3. the counts the package copy states (package.json, README, manifest, plugin) equal the snapshot's
 *   4. it MATCHES the live catalog — same names and descriptions, and the same server version
 *
 * Check 3 is the important one and is wired into `prepublishOnly`, so publishing a
 * package whose snapshot disagrees with the deployed worker fails the release rather
 * than shipping drift. Run `npm run sync:catalog` after deploying the worker.
 *
 * Network-optional: with no egress (or THREADLINQS_SKIP_LIVE=1), checks 1-3 still run and check 4 is skipped
 * with a visible notice (never silently passed). Before the platform serves the catalog this package was built
 * from (the release order in scripts/sync-catalog.mjs), check 4 FAILS on purpose.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG_SNAPSHOT } from "../dist/catalog-snapshot.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PKG = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const SKIP_LIVE = process.env.THREADLINQS_SKIP_LIVE === "1";
// A hash of name + description, so a reworded tool is caught as well as an added or removed one.
const digest = (items) =>
  new Map((items ?? []).map((x) => [x.name, createHash("sha256").update(`${x.name}\n${x.description ?? ""}`).digest("hex").slice(0, 12)]));

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

// ── 3. counts stated in copy come from the snapshot ───────────────────────
const N = {
  tools: CATALOG_SNAPSHOT.tools.length,
  prompts: CATALOG_SNAPSHOT.prompts.length,
  resources: CATALOG_SNAPSHOT.resources.length,
};
const rd = (f) => readFileSync(join(ROOT, f), "utf8");
{
  const wrong = [];
  const pk = rd("package.json").match(/(\d+) tools, (\d+) prompts and (\d+) resources/);
  if (!pk || +pk[1] !== N.tools || +pk[2] !== N.prompts || +pk[3] !== N.resources) wrong.push("package.json description");
  for (const [file, re] of [
    ["mcpb-build/manifest.json", /(\d+) cyber-threat-intelligence tools/],
    ["mcpb-build/manifest.json", /It exposes (\d+) tools/],
    ["plugin/.claude-plugin/plugin.json", /(\d+) read-only tools/],
    ["plugin/README.md", /(\d+) read-only cyber-threat-intelligence tools/],
    ["plugin/README.md", /The same (\d+) tools/],
  ]) {
    const m = rd(file).match(re);
    if (!m || +m[1] !== N.tools) wrong.push(`${file} (${re.source})`);
  }
  const readme = rd("README.md");
  const marks = [...readme.matchAll(/<!--count:(tools|prompts|resources)-->(\d+)<!--\/count-->/g)];
  if (marks.length === 0) wrong.push("README.md has no count markers");
  for (const [, key, n] of marks) if (+n !== N[key]) wrong.push(`README.md ${key} ${n}`);
  const rows = (key) => (readme.match(new RegExp(`<!--${key}:begin-->([\\s\\S]*?)<!--${key}:end-->`)) || [, ""])[1].split("\n").filter((l) => /^\| `/.test(l)).length;
  if (rows("tools") !== N.tools) wrong.push(`README.md tool table has ${rows("tools")} rows`);
  if (rows("prompts") !== N.prompts) wrong.push(`README.md prompt table has ${rows("prompts")} rows`);
  if (wrong.length) fail(`copy states counts that differ from the snapshot (${N.tools} tools, ${N.prompts} prompts, ${N.resources} resources): ${wrong.join("; ")}\n        -> run: npm run sync:catalog -- --local`);
  else pass(`package.json, README, manifest and plugin state the snapshot's counts (${N.tools} tools, ${N.prompts} prompts, ${N.resources} resources)`);
}

// every package artefact carries the package version (SERVER_VERSION in src is the one the handshake reports)
{
  const wrong = [];
  const want = PKG.version;
  const jsonVersion = (f, get) => {
    try { return get(JSON.parse(rd(f))); } catch { return undefined; }
  };
  if (jsonVersion("server.json", (j) => j.version) !== want) wrong.push("server.json version");
  if (jsonVersion("server.json", (j) => j.packages?.[0]?.version) !== want) wrong.push("server.json packages[0].version");
  if (jsonVersion("mcpb-build/manifest.json", (j) => j.version) !== want) wrong.push("mcpb-build/manifest.json");
  if (jsonVersion("plugin/.claude-plugin/plugin.json", (j) => j.version) !== want) wrong.push("plugin.json");
  if (jsonVersion("package-lock.json", (j) => j.version) !== want) wrong.push("package-lock.json version");
  if (jsonVersion("package-lock.json", (j) => j.packages?.[""]?.version) !== want) wrong.push("package-lock.json packages[''].version");
  if (!rd("src/index.ts").includes(`const SERVER_VERSION = "${want}";`)) wrong.push("src/index.ts SERVER_VERSION");
  if (!rd("dist/index.js").includes(`const SERVER_VERSION = "${want}";`)) wrong.push("dist/index.js SERVER_VERSION (run npm run build)");
  if (wrong.length) fail(`version drift from package.json ${want}: ${wrong.join(", ")}`);
  else pass(`every artefact is at ${want}`);
}

// the snapshot is exactly what the local v9 package prints (skipped without packages/mcp-v9 and its dependencies)
if (!existsSync(join(ROOT, "..", "mcp-v9", "node_modules"))) {
  console.log("  SKIP  snapshot equals the local v9 catalog — packages/mcp-v9 has no node_modules here");
} else {
  try {
    execFileSync(process.execPath, [join(ROOT, "scripts", "sync-catalog.mjs"), "--local", "--check"], { stdio: "pipe" });
    pass("snapshot, counts and README tables equal the local v9 catalog (sync-catalog --local --check)");
  } catch (e) {
    fail(`sync-catalog --local --check: ${String(e.stderr || e.message).trim()}`);
  }
}

// ── 4. parity with the deployed catalog ───────────────────────────────────
let live = null;
if (SKIP_LIVE) {
  console.log("  SKIP  parity check — THREADLINQS_SKIP_LIVE=1");
} else {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    // Cache-bust: the catalog is served `public, max-age=3600` (v9: 300), so within an hour of a deploy an
    // edge node can hand back the PREVIOUS catalog and this parity check would "fail" a snapshot that is
    // actually correct — or worse, pass a stale one.
    const res = await fetch(`${BASE}/mcp/catalog.json?cb=${Number(process.hrtime.bigint() % 1000000n)}`, {
      headers: { Accept: "application/json", "cache-control": "no-cache", "User-Agent": `intelthreadlinqs-mcp-test/${PKG.version}` },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) live = await res.json();
    else fail(`live catalog fetch returned ${res.status}`);
  } catch {
    console.log(`  SKIP  parity check — could not reach ${BASE} (offline?)`);
  }
}

if (live) {
  const liveVersion = live.server?.version;
  if (liveVersion !== PKG.version)
    fail(
      `the platform serves server version ${JSON.stringify(liveVersion)}, this package is ${PKG.version}\n` +
        `        -> release order: deploy the platform with the v9 surface on, then npm run sync:catalog -- --url, then publish`,
    );
  else pass(`live server version ${liveVersion} equals the package version`);
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
    if (!missing.length && !extra.length) {
      pass(`${key} names match the live catalog (${liveNames.size})`);
      const a = digest(CATALOG_SNAPSHOT[key]);
      const b = digest(live[key]);
      const changed = [...b].filter(([n, h]) => a.get(n) !== h).map(([n]) => n);
      if (changed.length)
        fail(`${changed.length} ${label}(s) were reworded on the server since the snapshot: ${changed.slice(0, 8).join(", ")}\n        -> run: npm run sync:catalog -- --url`);
      else pass(`${key} descriptions match the live catalog`);
    }
  }
}

console.log(
  failures === 0
    ? `\nPASS — catalog snapshot is valid${live ? " and in sync with the deployed server" : " (parity unverified, offline)"}`
    : `\nFAIL — ${failures} problem(s)`,
);
process.exit(failures === 0 ? 0 : 1);
