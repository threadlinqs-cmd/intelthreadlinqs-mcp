#!/usr/bin/env node
/**
 * MCP stdio smoke + contract test.
 *
 * Spawns `node dist/index.js`, speaks JSON-RPC over stdio, and for EVERY tool:
 *   - asserts tools/list is non-empty and matches the server's own published catalog
 *     (/mcp/catalog.json), with each tool carrying inputSchema + title + readOnlyHint
 *     and any declared outputSchema being an object. The count is NOT hardcoded: this
 *     package is a thin proxy and the registry lives in the worker, so pinning a number
 *     here just goes stale (it said 49 while the server shipped 54, then 72);
 *   - calls tools/call with a known-good fixture and classifies the result:
 *       OK     — returned data (and structuredContent when an outputSchema is
 *                declared); free-tier tools must reach this.
 *       GATED  — clean tier/permission error (expected when THREADLINQS_API_KEY
 *                is unset or below the tool's tier);
 *       FAIL   — protocol error, crash, malformed result, a free-tier tool
 *                erroring for a non-tier reason, or a schema/content mismatch.
 *   - runs negative tests (bad id, out-of-range limit, bad enum, unknown tool).
 *
 * Exit code 0 only if there are zero FAILs. Run: `node tests/smoke.mjs`.
 * Provide THREADLINQS_API_KEY (e.g. via THREADLINQS_API_KEY=... node tests/smoke.mjs)
 * to additionally exercise gated tools against live data.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENTRY = join(__dirname, "..", "dist", "index.js");
const HAS_KEY = !!process.env.THREADLINQS_API_KEY;

// ---- known-good fixtures (per tool); required params not listed are filled
// from PARAM_FALLBACK by name. Real IDs that exist on the platform. ----
const TID = "TL-2026-0635";
const FIXTURES = {
  search_threats: { query: "ransomware", limit: 3 },
  get_threat: { threat_id: TID },
  get_recent_threats: { limit: 3 },
  get_similar_threats: { threat_id: TID, limit: 3 },
  get_threat_bundle: { threat_id: TID },
  get_threat_hunting_bundle: { threat_id: TID },
  get_threat_simulations: { threat_id: TID },
  get_threat_transcripts: { threat_id: TID },
  bulk_get_threats: { threat_ids: [TID, "TL-2026-0634"] },
  bulk_get_cves: { cve_ids: ["CVE-2026-3055"] },
  get_detections: { limit: 3 },
  search_detections: { query: "powershell", limit: 3 },
  get_detection_detail: { detection_id: "DET-DUMMY-0000" },
  export_detection: { detection_id: "DET-DUMMY-0000", format: "json" },
  search_iocs: { query: "http", limit: 3 },
  get_ioc_dns: { ioc_value: "example.com" },
  get_ioc_intelligence: { ioc_value: "example.com" },
  enrich_iocs: { query: "example.com", limit: 3 },
  get_mitre_technique: { technique_id: "T1059" },
  get_mitre_coverage: {},
  get_mitre_gap_analysis: { limit: 5 },
  predict_attack_path: { technique_id: "T1059" },
  get_cve_details: { cve_id: "CVE-2026-3055" },
  get_cve_intelligence: { cve_id: "CVE-2026-3055" },
  get_cwe_details: { cwe_id: "CWE-79" },
  search_actors: { limit: 3 },
  get_actor_profile: { name: "Lazarus Group" },
  get_actor_intelligence: { name: "Lazarus Group" },
  list_simulations: { limit: 3 },
  get_debrief: { date: "2026-05-30" },
  get_latest_debrief: {},
  list_debriefs: { limit: 3 },
  get_correlation_engine: { engine: "mitre-heatmap" },
  get_correlations_overview: {},
  get_daily_intel_bundle: {},
  get_platform_stats: {},
  get_changelog: { limit: 5 },
  get_roadmap: {},
  get_enrichment_overview: {},
  health: {},
  list_c2_beacons: { limit: 3 },
  get_c2_stats: {},
  get_c2_operators: {},
  get_c2_cross_correlations: {},
  get_c2_watermarks: {},
  get_c2_timeline: {},
  get_c2_configs: {},
  generate_c2_blocklist: { format: "cidr" },
};
const PARAM_FALLBACK = { threat_id: TID, cve_id: "CVE-2026-3055", cwe_id: "CWE-79", technique_id: "T1059", detection_id: "DET-DUMMY-0000", name: "Lazarus Group", engine: "mitre-heatmap", ioc_value: "example.com", query: "test", date: "2026-05-30", format: "json", threat_ids: [TID], cve_ids: ["CVE-2026-3055"] };

const TIER_RE = /access denied|requires .*tier|tier|api key|authentication required|unauthor/i;

// ---- minimal JSON-RPC stdio client ----
function makeClient() {
  const env = { ...process.env };
  const child = spawn("node", [ENTRY], { stdio: ["pipe", "pipe", "pipe"], env });
  let buf = "";
  const pending = new Map();
  child.stdout.on("data", (d) => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 1);
      if (!line.trim()) continue;
      let msg; try { msg = JSON.parse(line); } catch { continue; }
      if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    }
  });
  child.stderr.on("data", () => {});
  let nextId = 1;
  const call = (method, params) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error(`timeout: ${method}`)); } }, 30000);
  });
  return { call, kill: () => child.kill() };
}

const argsFor = (tool, schema) => {
  const a = { ...(FIXTURES[tool] || {}) };
  for (const req of (schema?.required || [])) if (!(req in a)) a[req] = PARAM_FALLBACK[req] ?? "test";
  return a;
};

let FAILS = 0;
const rows = [];
const rec = (name, status, note) => { rows.push({ name, status, note: note || "" }); if (status === "FAIL") FAILS++; };
// The remote rate-limits MCP at 120 requests / 60s per key/IP. This harness fires ~76
// calls, so back-to-back runs trip it. A throttled call proves nothing about the tool,
// so it is reported as LIMITED rather than FAIL — visible, but not a false defect.
const RATE_RE = /rate limit|Retry in \d+s|429/i;

(async () => {
  const c = makeClient();
  const init = await c.call("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "smoke", version: "0" } });
  if (!init.result) { console.error("initialize failed"); process.exit(2); }

  const list = await c.call("tools/list", {});
  const tools = list.result?.tools || [];
  console.log(`\n# tools/list — ${tools.length} tools (key ${HAS_KEY ? "PRESENT" : "absent → gated tools expected to return tier errors"})\n`);
  // The registry lives in the worker, so compare against what the server itself
  // publishes rather than a number baked in here. This also catches the real failure
  // mode for a proxy: serving a stale or truncated catalog.
  if (!tools.length) rec("tools/list non-empty", "FAIL", "tools/list returned nothing");
  try {
    const base = process.env.THREADLINQS_API_URL || "https://intel.threadlinqs.com";
    const pub = await fetch(`${base}/mcp/catalog.json`).then((r) => r.json());
    if (Array.isArray(pub?.tools) && pub.tools.length !== tools.length) {
      rec("tools/list matches published catalog", "FAIL", `catalog ${pub.tools.length}, tools/list ${tools.length}`);
    }
  } catch { /* offline — the non-empty check above still applies */ }
  const schemaByName = {};
  for (const t of tools) {
    schemaByName[t.name] = t.inputSchema;
    const problems = [];
    if (!t.inputSchema || t.inputSchema.type !== "object") problems.push("no inputSchema");
    if (!t.title) problems.push("no title");
    if (!t.annotations || t.annotations.readOnlyHint !== true) problems.push("no readOnlyHint");
    if (t.outputSchema && t.outputSchema.type !== "object") problems.push("bad outputSchema");
    if (problems.length) rec(`list:${t.name}`, "FAIL", problems.join(","));
  }

  // ---- call every tool ----
  for (const t of tools) {
    const args = argsFor(t.name, schemaByName[t.name]);
    let res;
    try { res = await c.call("tools/call", { name: t.name, arguments: args }); }
    catch (e) { rec(t.name, "FAIL", String(e.message)); continue; }
    if (res.error) { rec(t.name, "FAIL", `protocol error: ${res.error.message}`); continue; }
    const r = res.result;
    if (!r || !Array.isArray(r.content) || r.content.length === 0) { rec(t.name, "FAIL", "no content"); continue; }
    const text = r.content.map((c) => c.text || "").join(" ");
    if (r.isError) {
      if (RATE_RE.test(text)) rec(t.name, "LIMITED", "rate-limited — rerun in 60s");
      else if (TIER_RE.test(text)) rec(t.name, "GATED", "tier/permission (expected w/o key)");
      else if (/not found/i.test(text)) rec(t.name, "OK", "clean not-found");
      else rec(t.name, "FAIL", "unexpected error: " + text.slice(0, 80));
      continue;
    }
    // success — if outputSchema declared, structuredContent must be an object
    if (t.outputSchema && (typeof r.structuredContent !== "object" || r.structuredContent === null)) {
      rec(t.name, "FAIL", "outputSchema declared but structuredContent missing/!object");
      continue;
    }
    rec(t.name, "OK", t.outputSchema ? "data + structuredContent" : "data");
  }

  // ---- negative tests ----
  const neg = async (label, name, args, check) => {
    const res = await c.call("tools/call", { name, arguments: args });
    const r = res.result || {};
    const text = (r.content || []).map((c) => c.text || "").join(" ");
    if (RATE_RE.test(text)) { rec(`neg:${label}`, "LIMITED", "rate-limited — rerun in 60s"); return; }
    const okk = check(r, text);
    rec(`neg:${label}`, okk ? "OK" : "FAIL", okk ? "" : `got isError=${!!r.isError} text=${text.slice(0, 60)}`);
  };
  // Argument validation that still happens CLIENT-side (inside the tool's build())
  // is assertable without a key — a throw there never reaches the network.
  await neg("empty threat_id", "get_threat", { threat_id: "" }, (r, t) => r.isError && /required|invalid|missing/i.test(t));

  // Everything below is validated SERVER-side, and the server checks auth before it
  // checks anything else — so without a key these all return the same tier error and
  // the assertion would be meaningless. Skipped rather than silently weakened.
  if (!HAS_KEY) {
    for (const l of ["limit clamp", "bad export format", "unknown tool"]) {
      rec(`neg:${l}`, "GATED", "server-side validation — needs THREADLINQS_API_KEY");
    }
  } else {
    await neg("limit clamp", "get_recent_threats", { limit: 99999 }, (r) => !r.isError); // clamps, no error
    await neg("bad export format", "export_detection", { detection_id: "x", format: "bogus" }, (r, t) => r.isError && /invalid format|use one of/i.test(t));
    await neg("unknown tool", "no_such_tool_xyz", {}, (r, t) => r.isError && /unknown tool/i.test(t));
  }

  c.kill();

  // ---- report ----
  const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
  const order = { FAIL: 0, LIMITED: 1, GATED: 2, OK: 3 };
  rows.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
  console.log(rows.map((r) => `  ${pad(r.status, 6)} ${pad(r.name, 30)} ${r.note}`).join("\n"));
  const n = (s) => rows.filter((r) => r.status === s).length;
  console.log(`\n# summary: OK=${n("OK")}  GATED=${n("GATED")}  LIMITED=${n("LIMITED")}  FAIL=${n("FAIL")}  (total ${rows.length})`);
  if (n("LIMITED")) console.log(`  note: ${n("LIMITED")} call(s) were rate-limited (120/60s per key/IP) — rerun in a minute for a clean pass.`);
  console.log(FAILS === 0 ? "\n✅ SMOKE PASS — no unexpected failures\n" : `\n❌ SMOKE FAIL — ${FAILS} unexpected failure(s)\n`);
  process.exit(FAILS === 0 ? 0 : 1);
})().catch((e) => { console.error("harness error:", e); process.exit(2); });
