#!/usr/bin/env node
/**
 * Builds the distributable agent skill from the live MCP catalog.
 *
 * WHY THIS IS GENERATED
 * ---------------------
 * `references/tools.md` documents every tool in the live catalog with its real argument names. Hand-copying
 * those is how the npm README ended up documenting `predict_attack_path` and
 * `get_actor_profile` — tools that do not exist — and giving `generate_c2_blocklist` three
 * arguments when its schema takes none. A skill that teaches an agent to call a nonexistent
 * tool is worse than no skill, so the tool reference is derived, never typed.
 *
 * Hand-authored (and left alone by this script): SKILL.md and every other references/*.md.
 *
 * OUTPUTS (all under skill/dist/, all git-tracked — skill-files.js because the worker
 * imports it, the other two because they are the artifacts users actually download):
 *   skill.md                      flat single-file skill — served at /mcp/skill.md
 *   intelthreadlinqs-mcp-skill.zip  SKILL.md + references/ — for Claude Desktop / API upload
 *   skill-files.js                the same file map as an ES module, imported by _worker.js
 *
 * Usage:  node scripts/build-skill.mjs [baseUrl]
 *
 * This is the v8 skill (served while the cfg:mcp-v9 flag is not "on"). The v9 skill is built by
 * scripts/build-skill-v9.mjs from skill-v9/ and the local v9 package; both share skill-lib.mjs.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseSkillMeta, flatten, zip, skillModule } from "./skill-lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = join(HERE, "..", "skill");
const REFS_DIR = join(SKILL_DIR, "references");
const DIST = join(SKILL_DIR, "dist");
const BASE = process.argv[2] || process.env.THREADLINQS_API_URL || "https://intel.threadlinqs.com";

// ── 1. catalog → references/tools.md ────────────────────────────────────────
// Cache-bust — see the note in sync-catalog.mjs. The catalog is edge-cached for an hour,
// so a build run shortly after a deploy will silently pick up the previous tool set.
const res = await fetch(`${BASE}/mcp/catalog.json?cb=${Number(process.hrtime.bigint() % 1000000n)}`, {
  headers: { Accept: "application/json", "cache-control": "no-cache" },
});
if (!res.ok) {
  console.error(`catalog fetch failed: ${res.status} from ${BASE}`);
  process.exit(1);
}
const cat = await res.json();
// This builder documents the v8 surface only (the 81-name lane map below). Once the platform serves v9 at BASE
// (cfg:mcp-v9 = on) its catalog is the v9 one; refuse it plainly, before anything is written: skill/dist/skill-files.js
// is imported by the worker for the v8 surface. The v9 skill is scripts/build-skill-v9.mjs (local, no network); the npm
// release does not run this script (Wave 4 review 1/9).
const served = String((cat.server && cat.server.version) || cat.version || "");
if (/^\d+/.test(served) && parseInt(served, 10) >= 9) {
  console.error(`refusing to build the v8 skill: ${BASE}/mcp/catalog.json is server ${served} (the v9 surface). ` +
    "The v8 skill is rebuilt only against a v8 catalog (a host with cfg:mcp-v9 off); the v9 skill is `npm run build:skill-v9`.");
  process.exit(1);
}
const tools = cat.tools ?? [];
if (tools.length === 0) {
  console.error("refusing to build: catalog returned zero tools");
  process.exit(1);
}

/** Lane assignment. Every tool must land in exactly one lane — asserted below. */
const LANES = [
  ["L0 · Orient", "Cheap situational calls. Do not open every session with all of these.", ["get_started", "health", "get_platform_stats", "get_engine_status", "get_enrichment_overview", "get_changelog", "get_roadmap"]],
  ["L1 · Find", "Four different search modes. They are NOT interchangeable — boolean-exact, vector-rerank, SIEM-aggregate, alias-canonicalise.", ["search_threats", "search_corpus_semantic", "hunt", "hunt_schema", "resolve_entity", "get_entity_aliases", "list_threat_categories", "get_recent_threats"]],
  ["L2 · Threat dossier", "Prefer a bundle over a chain.", ["get_threat", "get_threat_enrichment", "get_threat_bundle", "get_threat_hunting_bundle", "bulk_get_threats", "get_threat_transcripts"]],
  ["L3 · Actor & attribution", "Always check evidence state before repeating an attribution.", ["get_actor", "search_actors", "get_actor_intelligence", "get_actor_relationships", "get_attribution_evidence", "get_attribution_coverage"]],
  ["L4 · IOC & infrastructure", "Exact value → intelligence; substring → search.", ["search_iocs", "get_ioc_intelligence", "get_ioc_dns", "get_ioc_blast_radius", "get_infrastructure_pivots", "get_c2", "get_c2_dns_intel", "generate_c2_blocklist"]],
  ["L5 · Vulnerability", "Rank by exploitation, not CVSS.", ["search_vulnerabilities", "get_cve", "get_cve_intelligence", "bulk_get_cves", "get_cwe"]],
  ["L6 · Detection & purple team", "Only some of these return actual rule text.", ["get_detections", "search_detections", "get_detection_detail", "export_detection", "get_threat_simulations", "list_simulations", "get_mitre_gap_analysis"]],
  ["L7 · MITRE ATT&CK", "predict_mitre_transitions is sequence; get_technique_rules is co-occurrence.", ["get_mitre_coverage", "get_mitre_technique", "predict_mitre_transitions", "get_technique_rules"]],
  ["L8 · Correlation graph", "Start shallow. Depth multiplies node count.", ["get_similar_threats", "explain_correlation", "get_correlation_path", "get_entity_profile", "get_correlation_subgraph", "get_pivotal_entities", "get_graph_campaigns", "get_correlations"]],
  ["L9 · Attack flow, D3FEND & ATLAS", "Authored causal DAGs and their defensive twin. Flow similarity is ordered-sequence, NOT the blended correlation score — the channel is still gated off.", ["get_attack_flow", "get_flow_similar_threats", "get_flow_coverage", "get_d3fend_posture", "get_atlas_intelligence"]],
  ["L10 · Malware / tool / campaign", "Route by entity kind; resolve_entity when unsure.", ["get_malware_intelligence", "get_tool_intelligence", "get_campaign_intelligence", "list_campaigns"]],
  ["L11 · Community OSINT", "Corroborating, never authoritative.", ["get_osint", "search_xscan_indicators", "get_osint_trends", "get_community_campaigns"]],
  ["L12 · Reporting & landscape", "One bundle usually beats four calls.", ["get_daily_intel_bundle", "get_latest_debrief", "get_debrief", "list_debriefs", "get_landscape_briefing", "get_daily_theme", "get_threat_level"]],
  ["L13 · Standards export", "For handing data to another system.", ["export_stix", "export_attack_navigator"]],
];

const byName = new Map(tools.map((t) => [t.name, t]));
const assigned = LANES.flatMap(([, , names]) => names);
const missing = tools.map((t) => t.name).filter((n) => !assigned.includes(n));
const phantom = assigned.filter((n) => !byName.has(n));
const dupes = assigned.filter((n, i) => assigned.indexOf(n) !== i);

if (phantom.length) {
  console.error(`lane map references tools that do not exist: ${phantom.join(", ")}`);
  process.exit(1);
}
if (dupes.length) {
  console.error(`tool assigned to more than one lane: ${dupes.join(", ")}`);
  process.exit(1);
}
if (missing.length) {
  console.error(
    `catalog has ${missing.length} tool(s) with no lane — add them to LANES so the skill stays complete:\n  ${missing.join(", ")}`,
  );
  process.exit(1);
}

const argLine = (t) => {
  const p = t.inputSchema?.properties ?? {};
  const req = new Set(t.inputSchema?.required ?? []);
  const names = Object.keys(p);
  if (names.length === 0) return "_takes no arguments_";
  return names
    .map((k) => {
      const s = p[k] ?? {};
      const bits = [`\`${k}\`${req.has(k) ? "**\\***" : ""}`];
      if (Array.isArray(s.enum)) bits.push(`= ${s.enum.map((v) => `\`${v}\``).join(" \\| ")}`);
      else if (s.type) bits.push(`_${s.type}_`);
      if (s.description) bits.push(`— ${s.description.replace(/\s+/g, " ").trim()}`);
      return bits.join(" ");
    })
    .join("<br>");
};

let md = `# Tool reference — all ${tools.length} tools

GENERATED FILE — do not edit by hand. Regenerate with \`npm run build:skill\`.
Source: \`${BASE}/mcp/catalog.json\`.

Arguments marked **\\*** are required. Purple and Gold have full access to every tool; a free account
gets 2 tool calls a day with the fan-out tools excluded (see SKILL.md, Access). Your host may
prefix these names — match by suffix.

`;

for (const [lane, note, names] of LANES) {
  md += `\n## ${lane}\n\n${note}\n\n`;
  for (const n of names) {
    const t = byName.get(n);
    const desc = (t.description || "").replace(/\s+/g, " ").trim();
    md += `### \`${t.name}\`\n\n${desc}\n\n**Arguments:** ${argLine(t)}\n\n`;
  }
}

mkdirSync(REFS_DIR, { recursive: true });
writeFileSync(join(REFS_DIR, "tools.md"), md, "utf8");

// ── 2. collect the skill file map ───────────────────────────────────────────
const files = {};
files["SKILL.md"] = readFileSync(join(SKILL_DIR, "SKILL.md"), "utf8");

// ── 2a. validate the SKILL.md frontmatter → SKILL_META (rules in skill-lib.mjs) ──
let SKILL_META;
try {
  SKILL_META = parseSkillMeta(files["SKILL.md"]);
} catch (e) {
  console.error(`SKILL.md frontmatter: ${e.message}`);
  process.exit(1);
}
for (const f of readdirSync(REFS_DIR).filter((f) => f.endsWith(".md")).sort()) {
  files[`references/${f}`] = readFileSync(join(REFS_DIR, f), "utf8");
}
const agentsPath = join(SKILL_DIR, "AGENTS.md");
if (existsSync(agentsPath)) files["AGENTS.md"] = readFileSync(agentsPath, "utf8");

// ── 3. flat single-file skill (frontmatter stripped, see skill-lib.mjs) ─────
const flat = flatten(
  files,
  `<!-- Threadlinqs Intelligence MCP — agent skill (single-file build)
     Generated from ${BASE}/mcp/catalog.json — ${tools.length} tools.
     Canonical: https://intel.threadlinqs.com/mcp -->\n\n`,
);

// ── 4. stored/deflated ZIP (no external deps, skill-lib.mjs) ────────────────
const zipBuf = zip(files);

// ── 5. emit ─────────────────────────────────────────────────────────────────
mkdirSync(DIST, { recursive: true });
writeFileSync(join(DIST, "skill.md"), flat, "utf8");
writeFileSync(join(DIST, "intelthreadlinqs-mcp-skill.zip"), zipBuf);
// The ZIP is built HERE and shipped as bytes, not rebuilt per-request in the worker.
// Workers have no node:zlib, and hand-rolling an archive writer inside a public
// unauthenticated request path is a liability for something that is identical on every
// request. Base64 costs ~33% over the raw bytes and buys a two-line worker handler.
writeFileSync(
  join(DIST, "skill-files.js"),
  skillModule(
    [
      "GENERATED — do not edit. Regenerate with: npm run build:skill",
      "Imported by _worker.js to serve /mcp/skill.md and /skills/intelthreadlinqs-mcp-skill.zip.",
      `${tools.length} tools, ${Object.keys(files).length} files, built from ${BASE}`,
    ],
    flat,
    zipBuf,
    SKILL_META,
  ),
  "utf8",
);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`built skill from ${tools.length} tools`);
for (const [n, c] of Object.entries(files)) console.log(`  ${n.padEnd(34)} ${kb(c.length)}`);
console.log(`  ${"→ dist/skill.md".padEnd(34)} ${kb(flat.length)}`);
console.log(`  ${"→ dist/…-skill.zip".padEnd(34)} ${kb(zipBuf.length)}`);
console.log(`  ${"→ dist/skill-files.js".padEnd(34)} ${kb(JSON.stringify(files).length)}`);
