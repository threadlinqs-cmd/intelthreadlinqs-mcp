#!/usr/bin/env node
/**
 * Guards the agent skill against the failure mode that motivated it.
 *
 * The npm README shipped for months documenting `predict_attack_path` and
 * `get_actor_profile` — tools that have never existed — and giving
 * `generate_c2_blocklist` three arguments when its schema takes none. A skill is read by
 * machines and acted on directly, so the same defect there teaches every downstream agent
 * to call into thin air. That is strictly worse than shipping no skill.
 *
 * Checks, against the live catalog:
 *   1. every tool-shaped token in every skill file is a real tool (or a known prompt name)
 *   2. no banned marketing words
 *   3. the built artifacts exist, are non-trivial, and the ZIP is a real ZIP
 *   4. SKILL.md keeps its frontmatter, and the flat build has it stripped
 *
 * Network-optional: with no egress, check 1 is skipped with a visible notice.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL = join(HERE, "..", "skill");
const DIST = join(SKILL, "dist");
const WORKER = join(HERE, "..", "..", "_worker.js");
const BASE = process.env.THREADLINQS_API_URL || "https://intel.threadlinqs.com";

let failures = 0;
const fail = (m) => { console.error(`  FAIL  ${m}`); failures++; };
const pass = (m) => console.log(`  ok    ${m}`);

// ── collect skill files ─────────────────────────────────────────────────────
const files = { "SKILL.md": readFileSync(join(SKILL, "SKILL.md"), "utf8") };
const refsDir = join(SKILL, "references");
for (const f of readdirSync(refsDir).filter((f) => f.endsWith(".md"))) {
  files[`references/${f}`] = readFileSync(join(refsDir, f), "utf8");
}

// ── 1. tool-name integrity ──────────────────────────────────────────────────
let real = null;
try {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  const r = await fetch(`${BASE}/mcp/catalog.json`, { signal: ctrl.signal });
  clearTimeout(t);
  if (r.ok) real = new Set((await r.json()).tools.map((x) => x.name));
  else fail(`catalog fetch returned ${r.status}`);
} catch {
  console.log(`  SKIP  tool-name check — could not reach ${BASE}`);
}

// Prompt names legitimately appear in prose (recipes map to them) and are not tools.
let promptNames = new Set();
try {
  const src = readFileSync(WORKER, "utf8");
  const m = src.match(/const MCP_PROMPTS = \[[\s\S]*?\n\];/);
  if (m) promptNames = new Set([...m[0].matchAll(/name:\s*'([a-z0-9_]+)'/g)].map((x) => x[1]));
} catch { /* worker not present in a published package — check still runs without it */ }

const TOOLISH = /\b(?:get|search|list|export|generate|bulk|predict|explain|resolve)_[a-z0-9_]+/g;
if (real) {
  let bad = 0;
  for (const [name, body] of Object.entries(files)) {
    body.split("\n").forEach((line, i) => {
      for (const tok of line.match(TOOLISH) ?? []) {
        if (real.has(tok) || promptNames.has(tok)) continue;
        fail(`${name}:${i + 1} references "${tok}" — not a tool and not a prompt`);
        bad++;
      }
    });
  }
  if (bad === 0) pass(`every tool reference across ${Object.keys(files).length} files resolves (${real.size} real tools)`);
}

// ── 2. banned words ─────────────────────────────────────────────────────────
let banned = 0;
for (const [name, body] of Object.entries(files)) {
  body.split("\n").forEach((line, i) => {
    // The data-caveats file names these words in order to ban them.
    if (/banned|do not use|never use/i.test(line)) return;
    if (/\b(comprehensive|powerful)\b/i.test(line)) {
      fail(`${name}:${i + 1} uses a banned marketing word`);
      banned++;
    }
  });
}
if (banned === 0) pass("no banned marketing words");

// ── 3. built artifacts ──────────────────────────────────────────────────────
const flatPath = join(DIST, "skill.md");
const zipPath = join(DIST, "intelthreadlinqs-mcp-skill.zip");
const embedPath = join(DIST, "skill-files.js");

for (const [p, min, label] of [
  [flatPath, 40_000, "dist/skill.md"],
  [zipPath, 10_000, "dist/…skill.zip"],
  [embedPath, 40_000, "dist/skill-files.js"],
]) {
  if (!existsSync(p)) { fail(`${label} missing — run: npm run build:skill`); continue; }
  const size = readFileSync(p).length;
  if (size < min) fail(`${label} is only ${size} bytes — expected > ${min}`);
  else pass(`${label} present (${(size / 1024).toFixed(1)} KB)`);
}

if (existsSync(zipPath)) {
  const z = readFileSync(zipPath);
  if (z[0] === 0x50 && z[1] === 0x4b && z[2] === 0x03 && z[3] === 0x04) pass("ZIP magic bytes valid");
  else fail("ZIP does not start with PK\\x03\\x04");
}

// ── 4. frontmatter discipline ───────────────────────────────────────────────
if (files["SKILL.md"].startsWith("---\n")) pass("SKILL.md keeps its YAML frontmatter");
else fail("SKILL.md lost its frontmatter — Claude hosts key off it");

if (existsSync(flatPath)) {
  const flat = readFileSync(flatPath, "utf8");
  if (/^\s*---\s*\nname:/.test(flat)) fail("dist/skill.md still carries frontmatter — it is pasted into arbitrary assistants");
  else pass("dist/skill.md has frontmatter stripped");
}

console.log(failures === 0 ? "\nPASS — skill integrity clean" : `\nFAIL — ${failures} problem(s)`);
process.exit(failures === 0 ? 0 : 1);
