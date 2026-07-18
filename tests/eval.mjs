#!/usr/bin/env node
/**
 * MCP v7 efficiency + correctness eval harness (the /loop engine).
 *
 * Measures the REAL response size (bytes + est. tokens ≈ bytes/4) of each tool's
 * underlying REST endpoint against a per-tool token BUDGET, and runs GOLDEN agent
 * scenarios that must resolve deterministically. Tier-0 endpoints return live data;
 * Purple-gated endpoints return the gate envelope and are marked GATED (set
 * THREADLINQS_API_KEY=tl_... to exercise them with real data).
 *
 *   node tests/eval.mjs                 # measure-only
 *   node tests/eval.mjs --strict        # exit 1 if any reachable tool busts budget
 *
 * The /goal: every reachable tool ≤ its budget, and all golden scenarios pass.
 */
const BASE = process.env.THREADLINQS_API_URL?.replace(/\/$/, "") || "https://intel.threadlinqs.com";
const KEY = process.env.THREADLINQS_API_KEY || "";
const STRICT = process.argv.includes("--strict");
const TOK = (b) => Math.round(b / 4);
const KB = (b) => (b / 1024).toFixed(1) + "KB";

async function get(path) {
  const headers = { "Accept": "application/json" };
  if (KEY) headers.Authorization = `Bearer ${KEY}`;
  const t0 = Date.now();
  const r = await fetch(`${BASE}/api/v1/${path}`, { headers });
  const text = await r.text();
  let gated = false;
  try { const j = JSON.parse(text); if (j && (j.error && (j.required || j.upgrade_url))) gated = true; } catch {}
  return { status: r.status, bytes: text.length, ms: Date.now() - t0, text, gated };
}

// path → token budget. List/search ≤ ~6k tok (~24KB). Detail ≤ ~4k (~16KB).
// Lean actor profile ≤ ~4k. Aggregates ≤ ~3k. (Bytes budget = tok*4.)
const TOOLS = [
  { name: "search_threats(lean)", path: "threats?lean=1&limit=20", budgetTok: 6000 },
  { name: "search_threats(filtered)", path: "threats?lean=1&actor=TeamPCP&category=SUPPLY_CHAIN&limit=20", budgetTok: 4000 },
  { name: "get_recent_threats(lean)", path: "threats?lean=1&limit=15", budgetTok: 5000 },
  { name: "get_threat(detail)", path: "threats/TL-2026-0263", budgetTok: 8000 },
  { name: "threats/categories", path: "threats/categories", budgetTok: 2000 },
  { name: "get_mitre_coverage", path: "mitre?lean=1", budgetTok: 12000 },
  { name: "get_platform_stats", path: "stats", budgetTok: 2000 },
  { name: "list_debriefs", path: "debriefs?lean=1&limit=30", budgetTok: 6000 },
  { name: "get_changelog", path: "changelog?limit=20", budgetTok: 6000 },
  // Purple-gated (GATED without key; validated live via connector):
  { name: "get_actor(lean)", path: "actors/TeamPCP?lean=1", budgetTok: 6000, purple: true },
  { name: "search_detections", path: "detections?q=powershell&limit=25", budgetTok: 8000, purple: true },
  { name: "search_iocs", path: "iocs?q=.com&limit=25", budgetTok: 6000, purple: true },
  { name: "get_c2(configs,capped)", path: "c2/configs/full?limit=25", budgetTok: 8000, purple: true },
  { name: "get_correlations(overview)", path: "correlations/overview", budgetTok: 8000, purple: true },
];

// Golden agent scenarios — must resolve deterministically (≤ N calls) + correct.
const GOLDEN = [
  {
    name: "TeamPCP supply-chain affected products (≤1 call)",
    async run() {
      const r = await get("threats?lean=1&actor=TeamPCP&category=SUPPLY_CHAIN&limit=20");
      if (r.gated) return { skip: "gated" };
      const d = JSON.parse(r.text);
      const rows = d.data || [];
      const allMatch = rows.length > 0 && rows.every(t => t.category === "SUPPLY_CHAIN" && /TeamPCP/i.test(t.threat_actor || ""));
      const haveProducts = rows.filter(t => (t.affected_products || []).length).length;
      const ok = allMatch && haveProducts >= rows.length * 0.5 && r.bytes < 24000;
      return { ok, detail: `rows=${rows.length} allMatch=${allMatch} withProducts=${haveProducts} bytes=${r.bytes}` };
    },
  },
  {
    name: "Filters AND-combine with query (no category bleed)",
    async run() {
      const r = await get("threats?lean=1&q=supply%20chain&category=SUPPLY_CHAIN&limit=20");
      if (r.gated) return { skip: "gated" };
      const d = JSON.parse(r.text);
      const rows = d.data || [];
      const ok = rows.length > 0 && rows.every(t => t.category === "SUPPLY_CHAIN");
      return { ok, detail: `rows=${rows.length} categories=${[...new Set(rows.map(t => t.category))].join(",")}` };
    },
  },
  {
    name: "Date-range filter narrows server-side",
    async run() {
      const r = await get("threats?lean=1&created_after=2026-06-01&limit=20");
      if (r.gated) return { skip: "gated" };
      const d = JSON.parse(r.text);
      const rows = d.data || [];
      const ok = rows.every(t => (t.created || "") >= "2026-06-01");
      return { ok, detail: `rows=${rows.length} oldest=${rows.map(t => t.created).sort()[0] || "n/a"}` };
    },
  },
  {
    name: "Lean rows carry no fat fields (tags/detections/iocs/description)",
    async run() {
      const r = await get("threats?lean=1&limit=10");
      if (r.gated) return { skip: "gated" };
      const d = JSON.parse(r.text);
      const t = (d.data || [])[0] || {};
      const fat = ["tags", "detections", "iocs", "description", "timeline", "mitre_attack"].filter(k => k in t);
      return { ok: fat.length === 0, detail: fat.length ? `LEAK: ${fat.join(",")}` : "clean lean row" };
    },
  },
];

(async () => {
  console.log(`\nMCP v7 eval — ${BASE} ${KEY ? "(authenticated)" : "(no key → Purple tools GATED)"}\n`);
  console.log("TOOL                                STATUS   SIZE        TOKENS   BUDGET   VERDICT");
  console.log("─".repeat(92));
  let busts = 0, measured = 0;
  for (const t of TOOLS) {
    const r = await get(t.path);
    const tok = TOK(r.bytes);
    let verdict;
    if (r.gated) verdict = "GATED";
    else if (r.status >= 400) verdict = `HTTP ${r.status}`;
    else { measured++; const ok = tok <= t.budgetTok; if (!ok) busts++; verdict = ok ? "✓ PASS" : "✗ OVER"; }
    console.log(
      `${t.name.padEnd(35)} ${(r.gated ? "gated" : r.status).toString().padEnd(8)} ${KB(r.bytes).padEnd(11)} ${String(tok).padEnd(8)} ${String(t.budgetTok).padEnd(8)} ${verdict}`
    );
  }
  console.log("\nGOLDEN SCENARIOS:");
  let gFail = 0, gRun = 0;
  for (const g of GOLDEN) {
    const res = await g.run();
    if (res.skip) { console.log(`  ⊘ ${g.name} — skipped (${res.skip})`); continue; }
    gRun++;
    if (!res.ok) gFail++;
    console.log(`  ${res.ok ? "✓" : "✗"} ${g.name}\n      ${res.detail}`);
  }
  console.log(`\nSUMMARY: ${measured} tools measured, ${busts} over budget; ${gRun} golden run, ${gFail} failed.`);
  console.log("(Purple tools show GATED without THREADLINQS_API_KEY — validated separately via the live connector.)\n");
  if (STRICT && (busts > 0 || gFail > 0)) process.exit(1);
})().catch((e) => { console.error("eval error:", e.message); process.exit(2); });
