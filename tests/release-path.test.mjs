#!/usr/bin/env node
/**
 * The npm release path runs against the catalog it will meet (Wave 4 review 1/9).
 *
 * npm 9.0.0 is published after the platform serves v9 (cfg:mcp-v9 = on), when
 * `<base>/mcp/catalog.json` is the 25-tool v9 catalog. `prepublishOnly` and `mcpb:build` once
 * started with the v8 skill builder (scripts/build-skill.mjs), which needs the 81 v8 names, so no
 * flag state let a publish pass. This test:
 *   1. expands `prepublishOnly` and `mcpb:build` (npm run X, recursively) and fails if either reaches
 *      the v8 skill build or its live check (the v8 skill is a worker artefact, not in the tarball);
 *   2. serves the v9 catalog the worker imports (packages/mcp-v9/dist/catalog-v9.js) on 127.0.0.1 and
 *      runs every step of `prepublishOnly` with THREADLINQS_API_URL pointing at it: all must pass;
 *   3. runs the v8 skill builder against that catalog: it must refuse with a clear message and write
 *      nothing (skill/dist/skill-files.js is imported by the worker for the v8 surface).
 *
 * Needs the monorepo (packages/mcp-v9/dist). No network beyond 127.0.0.1.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, "..");
const V9_SNAPSHOT = join(PKG, "..", "mcp-v9", "dist", "catalog-v9.js");

let failures = 0;
let passes = 0;
const fail = (m) => { console.error(`  FAIL  ${m}`); failures++; };
const pass = (m) => { console.log(`  ok    ${m}`); passes++; };

const scripts = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")).scripts;

// ── 1. what the release scripts reach ───────────────────────────────────────
function expand(name, seen = new Set()) {
  if (seen.has(name)) return [];
  seen.add(name);
  const body = scripts[name];
  if (body === undefined) return [`<missing script ${name}>`];
  const steps = body.split(/\s*&&\s*/);
  const out = [];
  for (const step of steps) {
    const m = /^(?:[A-Z_]+=\S+\s+)*npm run (?:-s )?([\w:-]+)/.exec(step.trim());
    if (m) out.push(...expand(m[1], seen), `npm run ${m[1]}`);
    else out.push(step.trim());
  }
  return out;
}
const V8_SKILL = /npm run (build:skill|test:skill|build:skills)$|scripts\/build-skill\.mjs|tests\/skill-integrity\.test\.mjs/;
for (const top of ["prepublishOnly", "mcpb:build"]) {
  const reached = expand(top);
  const bad = reached.filter((s) => V8_SKILL.test(s));
  if (bad.length) fail(`${top} reaches the v8 skill build/check: ${bad.join(", ")}`);
  else pass(`${top} does not run the v8 skill build or its live check (${reached.length} steps)`);
}
for (const need of ["npm run test:catalog", "npm run check:skill-v9", "npm run test:skill-v9"]) {
  if (expand("prepublishOnly").includes(need)) pass(`prepublishOnly runs ${need.slice(8)}`);
  else fail(`prepublishOnly lost ${need.slice(8)}`);
}

// ── 2/3. against a v9 catalog ───────────────────────────────────────────────
if (!existsSync(V9_SNAPSHOT)) {
  console.log(`  SKIP  v9 catalog checks — ${V9_SNAPSHOT} not present (outside the monorepo)`);
} else {
  const { V9_CATALOG } = await import(pathToFileURL(V9_SNAPSHOT).href);
  const { card: _card, legacy_no_equivalent: _none, ...catalog } = V9_CATALOG;
  const body = JSON.stringify(catalog);
  // spawnSync blocks this process, so the catalog is served from a child process of its own.
  const serverSrc = `
    const { createServer } = await import("node:http");
    const body = ${JSON.stringify(body)};
    const s = createServer((q, r) => { if ((q.url || "").split("?")[0] === "/mcp/catalog.json") { r.writeHead(200, { "content-type": "application/json" }); r.end(body); } else { r.writeHead(404); r.end("{}"); } });
    s.listen(0, "127.0.0.1", () => process.stdout.write(String(s.address().port) + "\\n"));
  `;
  const srv = spawn(process.execPath, ["--input-type=module", "-e", serverSrc], { stdio: ["ignore", "pipe", "inherit"] });
  const port = await new Promise((resolve, reject) => {
    let buf = "";
    srv.stdout.on("data", (d) => { buf += d; const m = /^(\d+)\n/.exec(buf); if (m) resolve(m[1]); });
    srv.on("exit", (c) => reject(new Error(`catalog server exited ${c}`)));
  });
  const env = { ...process.env, THREADLINQS_API_URL: `http://127.0.0.1:${port}` };
  delete env.THREADLINQS_SKIP_LIVE;
  const run = (args) => {
    const r = spawnSync(process.execPath, args, { cwd: PKG, env, encoding: "utf8", timeout: 240000 });
    return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
  };

  try {
    // 3. the v8 builder refuses and writes nothing
    const distDir = join(PKG, "skill", "dist");
    const digest = () => readdirSync(distDir).sort().map((f) => f + ":" + createHash("sha256").update(readFileSync(join(distDir, f))).digest("hex")).join(",");
    const before = digest();
    const b = run([join("scripts", "build-skill.mjs")]);
    if (b.code === 1 && /refusing to build the v8 skill: .* is server 9\.\d+\.\d+ \(the v9 surface\)/.test(b.out)) pass("build-skill.mjs refuses a v9 catalog with a clear message");
    else fail(`build-skill.mjs against a v9 catalog: exit ${b.code}: ${b.out.slice(0, 300)}`);
    if (digest() === before) pass("skill/dist (imported by the worker) is untouched");
    else fail("build-skill.mjs wrote skill/dist while refusing");

    // the v8 skill check still runs, from the worker's registry, whatever the live catalog is
    const k = run([join("tests", "skill-integrity.test.mjs")]);
    if (k.code === 0 && /tool names from the worker's MCP_TOOLS/.test(k.out)) pass("test:skill checks the v8 skill against MCP_TOOLS, not the v9 catalog");
    else fail(`test:skill against a v9 catalog: exit ${k.code}: ${k.out.split("\n").filter((l) => /FAIL|SKIP/.test(l)).slice(0, 3).join(" | ")}`);

    // 2. every prepublishOnly step (build already ran in test:offline; tsc again is cheap)
    for (const step of scripts.prepublishOnly.split(/\s*&&\s*/)) {
      const m = /^npm run ([\w:-]+)$/.exec(step.trim());
      if (!m) { fail(`prepublishOnly step is not "npm run X": ${step}`); continue; }
      const r = spawnSync("npm", ["run", "-s", m[1]], { cwd: PKG, env, encoding: "utf8", timeout: 300000 });
      const out = (r.stdout || "") + (r.stderr || "");
      if (r.status === 0) pass(`prepublishOnly · ${m[1]} passes against the v9 catalog`);
      else fail(`prepublishOnly · ${m[1]} exit ${r.status}: ${out.split("\n").filter((l) => /FAIL|rror|refus/.test(l)).slice(0, 3).join(" | ") || out.slice(-300)}`);
    }
  } finally {
    srv.kill();
  }
}

console.log(failures === 0 ? `\nPASS — ${passes} checks` : `\nFAIL — ${failures} problem(s)`);
process.exit(failures === 0 ? 0 : 1);
