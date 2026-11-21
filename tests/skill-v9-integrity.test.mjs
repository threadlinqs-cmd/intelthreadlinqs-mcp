#!/usr/bin/env node
/**
 * Integrity of the v9 agent skill (packages/mcp-server/skill-v9), against the LOCAL v9 catalog
 * (packages/mcp-v9 `npm run -s catalog -- --json`) and the platform's own price list. No network.
 *
 * A skill is read by machines and acted on directly, and v9 rejects unknown arguments and enum
 * values, so a wrong name in the skill is a failed call in every agent that reads it.
 *
 *   1. every tool-shaped token is a v9 tool, a documented legacy name, a prompt, or a section /
 *      include / view value of the catalog
 *   2. every `tool {args}` call written in the skill names real arguments and valid enum values,
 *      and gives the required ones
 *   3. every v9 tool is mentioned; only the 7 v9 view URIs appear; no graph or C2 view
 *   4. no price or count typed by hand: no digit next to "cred" in the sources, and every number
 *      next to "cred" in the build is a value of the platform's economyFacts()
 *   5. size ceilings: SKILL.md < 6 KB, each reference < 4 KB, the flat skill < 40 KB
 *   6. hosts: only intel.threadlinqs.com and threadlinqs.com; never workers.dev
 *   7. frontmatter shape and SKILL_META, flat build without frontmatter, zip contents
 *   8. legacy-names.md lists exactly the legacy names of aliases.ts
 *   9. the committed bundle and legacy-names.md are what the build produces now (not stale)
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { inflateRawSync } from "node:zlib";
import { buildV9Skill, hostsIn, ALLOWED_HOSTS } from "../scripts/build-skill-v9.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL = join(HERE, "..", "skill-v9");
const EMBED = join(SKILL, "dist", "skill-files.js");

let failures = 0;
const fail = (m) => { console.error(`  FAIL  ${m}`); failures++; };
const pass = (m) => console.log(`  ok    ${m}`);

const b = await buildV9Skill();
const { catalog, files, sources, flat, facts, platform } = b;
const tools = new Map(catalog.tools.map((t) => [t.name, t]));
const legacy = new Set(facts.legacy.map((l) => l.name));
const prompts = new Set(catalog.prompts.map((p) => p.name));
// Section, include and view values of the catalog (none has an underscore today; kept for safety).
const values = new Set();
for (const t of catalog.tools) {
  for (const p of Object.values(t.inputSchema?.properties ?? {})) {
    for (const v of [...(p.enum ?? []), ...(p.items?.enum ?? [])]) values.add(String(v));
  }
}

// ── 1. tool-shaped tokens ──────────────────────────────────────────────────
const TOOLISH = /\b(?:get|search|list|export|generate|bulk|predict|explain|resolve|hunt|attack|health)_[a-z0-9_]+\b/g;
{
  let bad = 0;
  for (const [name, body] of Object.entries(files)) {
    body.split("\n").forEach((line, i) => {
      for (const tok of line.match(TOOLISH) ?? []) {
        if (tools.has(tok) || legacy.has(tok) || prompts.has(tok) || values.has(tok)) continue;
        fail(`${name}:${i + 1} names "${tok}": not a v9 tool, legacy name, prompt or catalog value`);
        bad++;
      }
    });
  }
  if (!bad) pass(`every tool-shaped token resolves (${tools.size} tools, ${legacy.size} legacy names, ${prompts.size} prompts)`);
}

// ── 2. written calls: `tool {key:value, key}` ──────────────────────────────
{
  const STR = /"((?:[^"\\]|\\.)*)"/g;
  let calls = 0;
  let bad = 0;
  for (const [name, body] of Object.entries(files)) {
    for (const m of body.matchAll(/\b([a-z][a-z0-9_]*) \{([^{}\n]*)\}/g)) {
      const t = tools.get(m[1]);
      if (!t) continue;
      calls++;
      const where = `${name}: ${m[0]}`;
      const props = t.inputSchema?.properties ?? {};
      const inner = m[2];
      const keys = new Set();
      // key:value pairs (value = a string, an array or a bare token)
      const pairs = /([a-z_][a-z0-9_]*)\s*:\s*("(?:[^"\\]|\\.)*"|\[[^\]]*\]|[^,]+)/g;
      let rest = inner;
      for (const p of inner.matchAll(pairs)) {
        keys.add(p[1]);
        rest = rest.replace(p[0], "");
        const schema = props[p[1]];
        if (!schema) continue;
        const allowed = schema.enum ?? schema.items?.enum;
        if (!allowed) continue;
        const given = [...p[2].matchAll(STR)].map((s) => s[1]);
        for (const v of given) if (!allowed.includes(v)) { fail(`${where}: ${p[1]} "${v}" is not one of ${allowed.join(", ")}`); bad++; }
      }
      // bare keys: {id}, {kind, name}
      for (const k of rest.split(",").map((s) => s.trim()).filter(Boolean)) {
        if (/^[a-z_][a-z0-9_]*$/.test(k)) keys.add(k);
        else if (k !== "…" && k !== "...") { fail(`${where}: cannot read "${k}"`); bad++; }
      }
      for (const k of keys) if (!(k in props)) { fail(`${where}: ${t.name} has no argument "${k}"`); bad++; }
      if (keys.size) for (const r of t.inputSchema?.required ?? []) if (!keys.has(r)) { fail(`${where}: missing required "${r}"`); bad++; }
    }
  }
  if (calls < 20) fail(`only ${calls} written calls found; the parser or the skill changed shape`);
  else if (!bad) pass(`${calls} written calls use real arguments, valid values and the required ones`);
}

// ── 3. coverage and views ──────────────────────────────────────────────────
{
  const unnamed = [...tools.keys()].filter((n) => !new RegExp(`\`${n}[\` ]`).test(flat));
  if (unnamed.length) fail(`tools never named in the skill: ${unnamed.join(", ")}`);
  else pass(`all ${tools.size} tools are named`);
  const views = new Set(catalog.resources.map((r) => r.uri).filter((u) => u.startsWith("ui://")));
  const named = new Set(flat.match(/ui:\/\/[a-z0-9/_-]+/g) ?? []);
  const foreign = [...named].filter((u) => !views.has(u));
  const missingViews = [...views].filter((u) => !named.has(u));
  if (foreign.length || missingViews.length) fail(`views: unknown ${foreign.join(", ") || "-"}; not described ${missingViews.join(", ") || "-"}`);
  else pass(`exactly the ${views.size} v9 views are described`);
  if (/\b(graph|c2)\s+view\b|ui:\/\/threadlinqs\/(?:v9\/)?(?:graph|c2)\b/i.test(flat)) fail("the skill describes a graph or C2 view, which v9 does not have");
  else pass("no graph or C2 view");
}

// ── 4. prices and counts come from the platform ────────────────────────────
{
  const factNumbers = new Set();
  const walk = (v) => {
    if (typeof v === "number") factNumbers.add(String(v));
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(platform.economy);
  const NEAR_CRED = /(\d+(?:\.\d+)?)\s*(?:TL\s+)?creds?\b/gi;
  let bad = 0;
  for (const [name, body] of Object.entries(sources)) {
    for (const m of body.matchAll(NEAR_CRED)) { fail(`${name}: typed price "${m[0]}" (use a {{facts.…}} placeholder)`); bad++; }
  }
  for (const m of flat.matchAll(NEAR_CRED)) {
    if (!factNumbers.has(m[1])) { fail(`built skill: "${m[0]}" is not a platform fact`); bad++; }
  }
  // Counts the catalog or the platform supplies are never typed in the hand-written sources.
  const typedCount = /\b(\d+)\s+(?:tools|prompts|views|MCP tool calls|tool calls|calls a day)\b/gi;
  for (const [name, body] of Object.entries(sources)) {
    if (name.endsWith("legacy-names.md")) continue; // generated from aliases.ts
    for (const m of body.matchAll(typedCount)) { fail(`${name}: typed count "${m[0]}" (use a placeholder)`); bad++; }
  }
  if (!bad) pass("no hand-typed price or count; every price in the build is a platform fact");
  if (/\$\s?\d/.test(flat)) fail("the skill types a money amount");
}

// ── 5. size ceilings ───────────────────────────────────────────────────────
{
  const size = (s) => Buffer.byteLength(s);
  let bad = 0;
  if (size(files["SKILL.md"]) >= 6 * 1024) { fail(`SKILL.md is ${size(files["SKILL.md"])} bytes (ceiling 6 KB)`); bad++; }
  for (const [n, c] of Object.entries(files)) if (n.startsWith("references/") && size(c) >= 4 * 1024) { fail(`${n} is ${size(c)} bytes (ceiling 4 KB)`); bad++; }
  if (size(flat) >= 40 * 1024) { fail(`the flat skill is ${size(flat)} bytes (ceiling 40 KB)`); bad++; }
  if (!bad) pass(`sizes: SKILL.md ${size(files["SKILL.md"])} B, largest reference ${Math.max(...Object.entries(files).filter(([n]) => n.startsWith("references/")).map(([, c]) => size(c)))} B, flat ${size(flat)} B`);
}

// ── 6. hosts ───────────────────────────────────────────────────────────────
{
  const all = [flat, ...Object.values(files)].join("\n");
  const foreign = [...hostsIn(all)].filter((h) => !ALLOWED_HOSTS.has(h));
  if (foreign.length || /workers\.dev/i.test(all)) fail(`foreign hosts: ${foreign.join(", ") || "workers.dev"}`);
  else pass(`hosts named: ${[...hostsIn(all)].sort().join(", ")}`);
}

// ── 7. frontmatter, SKILL_META, flat file, zip ─────────────────────────────
{
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(files["SKILL.md"]);
  const lines = fm ? fm[1].split("\n") : [];
  const nm = /^name: (\S+)$/.exec(lines[0] || "");
  const body = lines.slice(2);
  const shapeOk = !!nm && lines[1] === "description: >-" && body.length > 0 && body.every((l) => /^  [^ \t]/.test(l) && !/\t/.test(l));
  if (!shapeOk) fail("SKILL.md frontmatter is not `name:` + a folded `description: >-` block");
  else {
    const description = body.map((l) => l.trim()).join(" ");
    if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(nm[1]) && nm[1].length <= 64 && !/anthropic|claude/.test(nm[1])) pass(`frontmatter name "${nm[1]}"`);
    else fail(`frontmatter name "${nm[1]}" breaks the spec`);
    if (description.length >= 1 && description.length <= 1024 && !/[<>]/.test(description)) pass(`frontmatter description ${description.length} chars`);
    else fail(`frontmatter description is ${description.length} chars or contains < >`);
    if (/\{\{/.test(description)) fail("frontmatter keeps an unresolved placeholder");
    if (b.meta.name !== nm[1] || b.meta.description !== description) fail("SKILL_META differs from the parsed frontmatter");
  }
  if (/^\s*<!--[\s\S]*?-->\s*---\s*\nname:/.test(flat) || /\nname: intelthreadlinqs/.test(flat)) fail("the flat skill still carries frontmatter");
  else pass("flat skill has the frontmatter stripped");
  if (/\{\{|\}\}/.test(flat)) fail("an unresolved placeholder reached the build");

  // Read the zip back: every file present with the built text.
  const z = b.zipBuf;
  const got = {};
  let off = 0;
  while (z.readUInt32LE(off) === 0x04034b50) {
    const method = z.readUInt16LE(off + 8);
    const csize = z.readUInt32LE(off + 18);
    const nlen = z.readUInt16LE(off + 26);
    const xlen = z.readUInt16LE(off + 28);
    const name = z.subarray(off + 30, off + 30 + nlen).toString("utf8");
    const data = z.subarray(off + 30 + nlen + xlen, off + 30 + nlen + xlen + csize);
    got[name] = (method === 8 ? inflateRawSync(data) : data).toString("utf8");
    off += 30 + nlen + xlen + csize;
  }
  const same = Object.keys(files).length === Object.keys(got).length && Object.entries(files).every(([n, c]) => got[n] === c);
  if (same) pass(`zip holds the ${Object.keys(files).length} built files`);
  else fail(`zip contents differ from the built files (${Object.keys(got).join(", ")})`);
}

// ── 8. legacy names ────────────────────────────────────────────────────────
{
  const doc = files["references/legacy-names.md"];
  const listed = new Set((doc.match(/`([a-z][a-z0-9_]+)`/g) ?? []).map((s) => s.slice(1, -1)).filter((n) => !tools.has(n)));
  const extra = [...listed].filter((n) => !legacy.has(n));
  const absent = [...legacy].filter((n) => !listed.has(n));
  if (extra.length || absent.length) fail(`legacy-names.md: unknown ${extra.join(", ") || "-"}; missing ${absent.join(", ") || "-"}`);
  else pass(`legacy-names.md lists all ${legacy.size} legacy names`);
  const passthrough = facts.legacy.filter((l) => !l.tools.length).map((l) => l.name);
  const section = doc.split("## Mapped")[0];
  const missing = passthrough.filter((n) => !section.includes(`\`${n}\``));
  if (missing.length) fail(`names with no v9 equivalent not in the "No equivalent" section: ${missing.join(", ")}`);
  else pass(`${passthrough.length} names with no v9 equivalent are documented once as callable, not listed`);
}

// ── 9. committed outputs are current ───────────────────────────────────────
{
  const legacyPath = join(SKILL, "references", "legacy-names.md");
  if (!existsSync(legacyPath) || readFileSync(legacyPath, "utf8") !== b.legacyMd) fail("skill-v9/references/legacy-names.md is stale: run npm run build:skill-v9");
  else pass("legacy-names.md is current");
  if (!existsSync(EMBED)) fail("skill-v9/dist/skill-files.js missing: run npm run build:skill-v9");
  else {
    if (readFileSync(EMBED, "utf8") !== b.module) fail("skill-v9/dist/skill-files.js is stale: run npm run build:skill-v9");
    else pass("skill-v9/dist/skill-files.js is current");
    const mod = await import(pathToFileURL(EMBED).href);
    if (typeof mod.SKILL_FLAT === "string" && typeof mod.SKILL_ZIP_B64 === "string" && mod.SKILL_META && typeof mod.SKILL_META.name === "string" && mod.SKILL_META.placeholder === undefined) {
      const zipMagic = Buffer.from(mod.SKILL_ZIP_B64, "base64").subarray(0, 4).toString("hex");
      if (zipMagic === "504b0304") pass("bundle exports SKILL_FLAT, SKILL_ZIP_B64 (a zip) and SKILL_META, no placeholder flag");
      else fail("SKILL_ZIP_B64 is not a zip");
    } else fail("bundle does not export SKILL_FLAT, SKILL_ZIP_B64 and SKILL_META as the v8 bundle does (or is still the placeholder)");
  }
}

console.log(failures === 0 ? "\nPASS — v9 skill integrity clean" : `\nFAIL — ${failures} problem(s)`);
process.exit(failures === 0 ? 0 : 1);
