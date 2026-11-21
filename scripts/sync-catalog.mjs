#!/usr/bin/env node
/**
 * Regenerates src/catalog-snapshot.ts (and every count the package's copy states) from a catalog.
 *
 * WHY THIS EXISTS
 * ---------------
 * The stdio server is a thin proxy: it carries no tool definitions of its own.
 * `listFromRemoteOrCatalog` tries the authenticated `tools/list`, then the public
 * `/mcp/catalog.json`. Both need network. A registry scanner that runs this package
 * in a sandbox WITHOUT egress to intel.threadlinqs.com therefore saw an empty list —
 * and, worse, an empty list rather than an error, which is indistinguishable from a
 * server that genuinely has no tools. That is exactly why Glama indexed 0 tools.
 *
 * This snapshot is the third and final fallback: introspection now degrades to a
 * bundled catalog instead of silence. It is only the OFFLINE fallback: the live
 * `tools/list` (v8 lists 81 tools, v9 lists 25) always wins at run time.
 *
 * TWO SOURCES
 * -----------
 *   --local            build from the v9 package in this repo (packages/mcp-v9: the same
 *                      object `npm run -s catalog -- --json` prints). Needs no network and no
 *                      deploy; this is how 9.0.0 was prepared.
 *   --url [baseUrl]    fetch the DEPLOYED catalog (`<base>/mcp/catalog.json`). The release step.
 *                      A bare `node scripts/sync-catalog.mjs [baseUrl]` is the same thing.
 *
 * BOTH refuse to write unless the catalog says it is this package's server version
 * (`server.version` === package.json `version`) and its own `counts` match the arrays it
 * carries. A v8 catalog (server.version 8.x) therefore cannot be baked into a 9.x package.
 *
 * COUNTS IN COPY
 * --------------
 * The same run rewrites the numbers the package's descriptions and README state ("N tools",
 * "M prompts"), so none of them is typed by hand. `--check` writes nothing and fails when the
 * snapshot or any stated count differs from the source (tests/catalog-snapshot.test.mjs runs
 * the count half of that without needing a source).
 *
 * ORDERING — READ THIS BEFORE A RELEASE (the live path)
 * -----------------------------------------------------
 *   1. deploy the platform worker with the flag the release needs (it serves the catalog)
 *   2. npm run sync:catalog -- --url        <- picks up what the platform now serves
 *   3. npm run build && npm run test:catalog
 *   4. npm publish, then rebuild the .mcpb
 * Running this before the deploy bakes in the OLD catalog; the version assertion above stops
 * that for the 8.x -> 9.0.0 jump, and `npm run test:catalog` (live parity) catches the rest.
 *
 * Usage:
 *   node scripts/sync-catalog.mjs --local [--check]
 *   node scripts/sync-catalog.mjs --url [baseUrl] [--check]
 *   node scripts/sync-catalog.mjs [baseUrl]
 *   THREADLINQS_API_URL=https://... node scripts/sync-catalog.mjs --url
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, "..");
const OUT = join(PKG, "src", "catalog-snapshot.ts");
const V9_DIR = join(PKG, "..", "mcp-v9");

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const positional = args.filter((a) => !a.startsWith("--"));
const CHECK = flag("--check");
const LOCAL = flag("--local");
const BASE = (positional[0] || process.env.THREADLINQS_API_URL || "https://intel.threadlinqs.com").replace(/\/$/, "");
const PKG_VERSION = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8")).version;

const fail = (msg) => {
  console.error(`sync-catalog: ${msg}`);
  process.exit(1);
};

// ── source ──────────────────────────────────────────────────────────────────
async function loadCatalog() {
  if (LOCAL) {
    if (!existsSync(join(V9_DIR, "scripts", "print-catalog.ts"))) fail(`--local needs packages/mcp-v9 (looked in ${V9_DIR})`);
    let out;
    try {
      out = execFileSync("npm", ["run", "-s", "catalog", "--", "--json"], {
        cwd: V9_DIR,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      fail(`could not print the local v9 catalog (run npm install in packages/mcp-v9 first): ${e.message.split("\n")[0]}`);
    }
    try {
      return { catalog: JSON.parse(out), source: "packages/mcp-v9 (npm run -s catalog -- --json)" };
    } catch {
      fail("the local v9 catalog printed something that is not JSON");
    }
  }
  // Cache-bust. /mcp/catalog.json is served `public, max-age=3600` (v9: 300 with stale-while-revalidate),
  // so a sync run soon after a deploy can otherwise pull the PREVIOUS catalog off an edge node and
  // bake a stale snapshot — exactly the 7-prompt mistake that shipped in 8.1.0.
  const url = `${BASE}/mcp/catalog.json?cb=${Number(process.hrtime.bigint() % 1000000n)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "cache-control": "no-cache", "User-Agent": `intelthreadlinqs-mcp-sync/${PKG_VERSION}` },
  });
  if (!res.ok) fail(`catalog fetch failed: ${res.status} ${res.statusText} from ${BASE}`);
  return { catalog: await res.json(), source: `${BASE}/mcp/catalog.json` };
}

const { catalog, source } = await loadCatalog();

// ── assertions ──────────────────────────────────────────────────────────────
// Keep only what the list handlers actually serve. `server`/`protocolVersion` are deliberately
// excluded from the snapshot: those must come from the live handshake, never from a snapshot
// that could be months old and would misreport the server's identity.
const picked = {
  tools: catalog.tools ?? [],
  prompts: catalog.prompts ?? [],
  resources: catalog.resources ?? [],
  resourceTemplates: catalog.resourceTemplates ?? [],
};

for (const [k, v] of Object.entries(picked)) {
  if (!Array.isArray(v) || v.length === 0) fail(`refusing to write snapshot: "${k}" is empty — the source catalog looks wrong`);
}
const serverVersion = catalog.server?.version ?? catalog.serverInfo?.version;
if (serverVersion !== PKG_VERSION) {
  fail(
    `refusing to write snapshot: the catalog is for server version ${JSON.stringify(serverVersion)}, this package is ${PKG_VERSION}. ` +
      `${LOCAL ? "" : "Deploy the platform with the matching surface first. "}A catalog of another version must not be baked in.`,
  );
}
const stated = catalog.counts;
if (!stated || typeof stated !== "object") fail("refusing to write snapshot: the catalog carries no `counts` to check its arrays against");
for (const k of ["tools", "prompts", "resources"]) {
  if (stated[k] !== picked[k].length) fail(`refusing to write snapshot: counts.${k} is ${stated[k]} but the catalog carries ${picked[k].length}`);
}
const names = picked.tools.map((t) => t?.name);
if (new Set(names).size !== names.length) fail("refusing to write snapshot: duplicate tool names in the catalog");

const counts = {
  tools: picked.tools.length,
  prompts: picked.prompts.length,
  resources: picked.resources.length,
  resourceTemplates: picked.resourceTemplates.length,
};

// ── snapshot ────────────────────────────────────────────────────────────────
const banner = `// GENERATED FILE — DO NOT EDIT BY HAND.
// Regenerate with: npm run sync:catalog -- --local   (or --url at release time)
//
// Offline fallback for introspection. See scripts/sync-catalog.mjs for why this
// exists and for the release ordering that keeps it honest. The live tools/list
// is always authoritative; this is used only when the platform cannot be reached.
//
// Source : ${source}
// Server : ${serverVersion}
// Counts : ${counts.tools} tools, ${counts.prompts} prompts, ${counts.resources} resources, ${counts.resourceTemplates} resource templates
`;

const body = `${banner}
export interface CatalogSnapshot {
  tools: unknown[];
  prompts: unknown[];
  resources: unknown[];
  resourceTemplates: unknown[];
}

export const CATALOG_SNAPSHOT: CatalogSnapshot = ${JSON.stringify(picked, null, 2)};

export default CATALOG_SNAPSHOT;
`;

// ── counts stated in copy ───────────────────────────────────────────────────
// [file, [[regexp, key of `counts`]]]. Group 1 is the text before the number (kept), group 2 the number
// (replaced). The wording around the number is hand-written; the number never is.
const STAMPS = [
  ["package.json", [[/()(\d+)(?= tools, \d+ prompts and \d+ resources)/, "tools"], [/(\b\d+ tools, )(\d+)(?= prompts and \d+ resources)/, "prompts"], [/(\b\d+ tools, \d+ prompts and )(\d+)(?= resources)/, "resources"]]],
  ["mcpb-build/manifest.json", [[/("description": ")(\d+)(?= cyber-threat-intelligence tools)/, "tools"], [/(It exposes )(\d+)(?= tools, each covering)/, "tools"]]],
  ["plugin/.claude-plugin/plugin.json", [[/(\b)(\d+)(?= read-only tools)/, "tools"]]],
  ["plugin/README.md", [[/(\b)(\d+)(?= read-only cyber-threat-intelligence tools)/, "tools"], [/(The same )(\d+)(?= tools)/, "tools"]]],
];
// README tables are generated from the snapshot too: `<!--tools:begin-->` ... `<!--tools:end-->` and the same for prompts.
const cell = (t) => String(t ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
// The first sentence of a description (two when the first is a stub), without cutting at "i.e." / "e.g.".
const lead = (d) => {
  const t = cell(d);
  const sentences = [];
  const re = /.+?(?<!\bi\.e|\be\.g)[.!?](?=\s|$)/g;
  let m;
  while ((m = re.exec(t)) && sentences.join(" ").length < 30) sentences.push(m[0].trim());
  const out = sentences.join(" ") || t;
  return out.length > 220 ? out.slice(0, 217).replace(/\s+\S*$/, "") + "..." : out;
};
const table = (items, label) =>
  `| ${label} | what it does |\n|---|---|\n` + items.map((x) => `| \`${x.name}\` | ${lead(x.description)} |`).join("\n");
function fillBlock(text, key, body) {
  const re = new RegExp(`(<!--${key}:begin-->)[\\s\\S]*?(<!--${key}:end-->)`);
  if (!re.test(text)) fail(`README.md: no <!--${key}:begin--> ... <!--${key}:end--> block to fill`);
  return text.replace(re, (_m, a, b) => `${a}\n${body}\n${b}`);
}
const MD_MARK = /(<!--count:(tools|prompts|resources)-->)\d+(<!--\/count-->)/g;

function stamped(file) {
  const path = join(PKG, file);
  let text = readFileSync(path, "utf8");
  if (file === "README.md") {
    text = text.replace(MD_MARK, (_m, open, key, close) => `${open}${counts[key]}${close}`);
    text = fillBlock(text, "tools", table(picked.tools, "tool"));
    text = fillBlock(text, "prompts", table(picked.prompts, "prompt"));
  } else {
    for (const [re, key] of STAMPS.find(([f]) => f === file)[1]) {
      if (!re.test(text)) fail(`${file}: no "${re}" to stamp — the wording this script rewrites changed`);
      text = text.replace(re, (_m, pre) => pre + counts[key]);
    }
  }
  return { path, text };
}

const targets = [...STAMPS.map(([f]) => f), "README.md"].map(stamped);
const current = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");

if (CHECK) {
  const stale = [];
  if (current(OUT) !== body) stale.push("src/catalog-snapshot.ts");
  for (const t of targets) if (current(t.path) !== t.text) stale.push(t.path.replace(PKG + "/", ""));
  if (stale.length) fail(`out of date against ${source}: ${stale.join(", ")} — run: npm run sync:catalog -- ${LOCAL ? "--local" : "--url"}`);
  console.log(`up to date with ${source} (${counts.tools} tools, ${counts.prompts} prompts, ${counts.resources} resources)`);
  process.exit(0);
}

writeFileSync(OUT, body, "utf8");
for (const t of targets) writeFileSync(t.path, t.text, "utf8");
console.log(
  `wrote ${OUT}\n  from ${source} (server ${serverVersion})\n  ${counts.tools} tools, ${counts.prompts} prompts, ` +
    `${counts.resources} resources, ${counts.resourceTemplates} templates (${(body.length / 1024).toFixed(1)} KB)\n` +
    `  counts re-stamped in: ${targets.map((t) => t.path.replace(PKG + "/", "")).join(", ")}`,
);
