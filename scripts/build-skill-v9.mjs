#!/usr/bin/env node
/**
 * Builds the lean v9 agent skill from packages/mcp-server/skill-v9 (served by the worker while the
 * KV flag cfg:mcp-v9 is "on"; the v8 skill from scripts/build-skill.mjs serves otherwise).
 *
 * Inputs, all local (this script never touches the network):
 *   - skill-v9/SKILL.md and skill-v9/references/*.md, hand-written, with {{placeholders}}
 *   - the v9 catalog: `npm run -s catalog -- --json` of packages/mcp-v9 (scripts/print-catalog.ts)
 *   - the v9 legacy routes and free-plan map (src/legacy/aliases.ts, src/core/free.ts) via
 *     scripts/skill-v9-facts.mjs
 *   - the platform's prices (worker/tlc/config.js economyFacts) and free-plan constants
 *     (MCP_FREE_DAILY_CALLS, UPGRADE_URL in worker/_worker.js)
 *
 * Placeholders keep counts and prices out of the hand-written text: a number the platform or the
 * catalog can supply is never typed. An unknown placeholder fails the build.
 *
 * Outputs:
 *   skill-v9/references/legacy-names.md   generated from the alias routes (committed)
 *   skill-v9/dist/skill-files.js          SKILL_FLAT, SKILL_ZIP_B64, SKILL_META (git add -f)
 *
 * The canonical origin https://intel.threadlinqs.com is hard-coded in everything emitted; the
 * catalog is printed with PUBLIC_BASE_URL set to it, and the build fails if any other host
 * (a workers.dev dev host above all) appears in the output.
 *
 * Usage:  node scripts/build-skill-v9.mjs           build and write
 *         node scripts/build-skill-v9.mjs --check   build in memory; exit 1 when the files on disk differ
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { parseSkillMeta, flatten, zip, skillModule } from "./skill-lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, "..");
const SKILL_DIR = join(PKG, "skill-v9");
const REFS_DIR = join(SKILL_DIR, "references");
const DIST = join(SKILL_DIR, "dist");
const OUT_MODULE = join(DIST, "skill-files.js");
const LEGACY_FILE = "legacy-names.md";
const V9_DIR = join(PKG, "..", "mcp-v9");
const REPO = join(PKG, "..", "..");
export const CANONICAL = "https://intel.threadlinqs.com";
/** Hosts the emitted skill may name. */
export const ALLOWED_HOSTS = new Set(["intel.threadlinqs.com", "threadlinqs.com"]);

/**
 * Free-plan claims the skill makes (setup.md), checked against the v9 package's freeExcluded() on
 * every build: [tool, args, excluded]. Every v9 tool not named here is checked with its required
 * arguments and must be allowed.
 */
export const FREE_CLAIMS = [
  ["brief", {}, true],
  ["brief", { date: "2026-11-12" }, true],
  ["brief", { history: 7 }, true],
  ["export", { kind: "stix", threat_id: "TL-2026-5315" }, true],
  ["export", { kind: "navigator", actor: "APT28" }, true],
  ["export", { kind: "detections", threat_id: "TL-2026-5315" }, true],
  ["export", { kind: "blocklist" }, false],
  ["get_threat", { id: "TL-2026-5315,TL-2026-5101" }, true],
  ["get_threat", { id: "TL-2026-5315" }, false],
  ["get_threat", { id: "TL-2026-5315", sections: ["overview", "flow", "similar"] }, false],
  ["correlate", { mode: "explain", a: "TL-2026-5315", b: "TL-2026-5101" }, true],
  ["correlate", { mode: "similar", a: "TL-2026-5315" }, false],
  ["correlate", { mode: "path", a: "TL-2026-5315", b: "TL-2026-5101" }, false],
  ["get_cve", { id: "CVE-2025-53770,CVE-2024-3400" }, true],
  ["get_cve", { id: "CVE-2025-53770", sections: ["threats"] }, true],
  ["get_cve", { id: "CVE-2025-53770", sections: ["actors"] }, true],
  ["get_cve", { id: "CVE-2025-53770", sections: ["techniques"] }, true],
  ["get_cve", { id: "CVE-2025-53770", sections: ["detections"] }, true],
  ["get_cve", { id: "CVE-2025-53770" }, false],
  ["get_cve", { id: "CVE-2025-53770", sections: ["exploitation", "products", "references"] }, false],
];

const fail = (msg) => {
  throw new Error(msg);
};

/** Runs a node script under tsx inside packages/mcp-v9 (its own node_modules); stdout only. */
function runInV9(args) {
  if (!existsSync(join(V9_DIR, "node_modules", "tsx"))) fail("packages/mcp-v9/node_modules is missing: run npm --prefix packages/mcp-v9 ci");
  return execFileSync(process.execPath, ["--import", "tsx", ...args], {
    cwd: V9_DIR,
    env: { ...process.env, PUBLIC_BASE_URL: CANONICAL, LOG_LEVEL: "silent" },
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
    encoding: "utf8",
  });
}

/** The v9 catalog, exactly what `npm run -s catalog -- --json` prints in packages/mcp-v9. */
export function readV9Catalog() {
  return JSON.parse(runInV9(["scripts/print-catalog.ts", "--json"]));
}

/** Legacy alias routes and the free-plan answers for `cases` ([tool, args] pairs). */
export function readV9Facts(cases) {
  return JSON.parse(runInV9([join(HERE, "skill-v9-facts.mjs"), JSON.stringify(cases)]));
}

/** The platform's price list and free-plan constants. */
export async function readPlatformFacts() {
  // worker/ has no package.json "type", so Node warns that it re-parses config.js as ESM; that is expected here.
  const emit = process.emitWarning;
  process.emitWarning = (w, ...rest) => {
    if ([w, ...rest].some((x) => String(x?.code ?? x).includes("MODULE_TYPELESS_PACKAGE_JSON"))) return;
    return emit.call(process, w, ...rest);
  };
  let cfg;
  try {
    cfg = await import(pathToFileURL(join(REPO, "worker", "tlc", "config.js")).href);
  } finally {
    process.emitWarning = emit;
  }
  const economy = cfg.economyFacts();
  const worker = readFileSync(join(REPO, "worker", "_worker.js"), "latin1");
  const daily = /\nconst MCP_FREE_DAILY_CALLS = (\d+);/.exec(worker);
  const upgrade = /\nconst UPGRADE_URL = '([^']+)';/.exec(worker);
  if (!daily) fail("worker/_worker.js: const MCP_FREE_DAILY_CALLS not found");
  if (!upgrade) fail("worker/_worker.js: const UPGRADE_URL not found");
  return { economy, freeDailyCalls: Number(daily[1]), upgradeUrl: upgrade[1] };
}

const code = (s) => `\`${s}\``;
const list = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/** references/legacy-names.md, from the alias routes. */
export function legacyMarkdown(catalog, legacy) {
  const v9 = new Set(catalog.tools.map((t) => t.name));
  const none = legacy.filter((l) => l.tools.length === 0).map((l) => l.name);
  const byTarget = new Map();
  for (const l of legacy.filter((x) => x.tools.length)) {
    const [first, ...rest] = l.tools;
    if (!v9.has(first) || rest.some((t) => !v9.has(t))) fail(`alias ${l.name} routes to a tool the catalog does not list: ${l.tools.join(", ")}`);
    const label = code(l.name) + (l.passthrough ? "\\*" : "") + (rest.length ? ` (or ${rest.map(code).join(", ")})` : "");
    if (!byTarget.has(first)) byTarget.set(first, []);
    byTarget.get(first).push(label);
  }
  const v8count = catalog.compatibility?.v8_tool_names;
  if (typeof v8count !== "number") fail("catalog.compatibility.v8_tool_names is missing");
  const native = v8count - legacy.length;
  let md = `# Legacy names: callable, not listed

GENERATED from packages/mcp-v9/src/legacy/aliases.ts by \`npm run build:skill-v9\`. Do not edit.

All ${v8count} tool names of the previous server still work. ${native} of them are tools of this
server under the same name. The other ${legacy.length}, below, are legacy names: still callable, not
listed in \`tools/list\`, and every result names the tool to use instead in \`meta.deprecated\`.
Call the listed tool in new work. A client that must enumerate them can list them with
\`POST ${CANONICAL}/mcp?surface=v8\`.

## No equivalent tool: legacy name, still callable, not listed

${none.map(code).join(", ")}.

These reach the original handler; the output is bounded and repaired.

## Mapped to a listed tool

`;
  for (const t of [...byTarget.keys()].sort()) md += `- ${code(t)}: ${byTarget.get(t).join(", ")}\n`;
  md += `\n\\* Some argument shapes of this name (paging offsets, filters the listed tool does not take)
go to the original handler instead.
`;
  return md;
}

/** {{placeholder}} values. */
export function placeholderValues(catalog, platform) {
  const counts = catalog.counts ?? {};
  for (const k of ["tools", "prompts", "views"]) if (typeof counts[k] !== "number") fail(`catalog.counts.${k} is missing`);
  if (catalog.tools.length !== counts.tools) fail(`catalog lists ${catalog.tools.length} tools but counts.tools is ${counts.tools}`);
  const views = new Map();
  for (const t of catalog.tools) {
    const uri = t._meta?.ui?.resourceUri;
    if (!uri) continue;
    const m = /^ui:\/\/threadlinqs\/v9\/([a-z]+)$/.exec(uri);
    if (!m) fail(`tool ${t.name} names an unexpected view ${uri}`);
    if (!views.has(m[1])) views.set(m[1], []);
    views.get(m[1]).push(t.name);
  }
  const viewResources = catalog.resources.map((r) => r.uri).filter((u) => u.startsWith("ui://"));
  if (views.size !== counts.views || viewResources.length !== counts.views) {
    fail(`views: ${views.size} named by tools, ${viewResources.length} listed as resources, counts.views ${counts.views}`);
  }
  const viewsList = list(
    [...views.keys()].sort().map((v) => `${code(`ui://threadlinqs/v9/${v}`)} (${views.get(v).map(code).join(", ")})`),
  );
  const paged = catalog.tools.filter((t) => t.inputSchema?.properties?.cursor).map((t) => code(t.name));
  const supported = catalog.supportedVersions ?? [];
  if (!supported.length || supported[0] !== catalog.protocolVersion) fail("catalog.supportedVersions must start with protocolVersion");
  return {
    "tools.count": counts.tools,
    "views.count": counts.views,
    "views.list": viewsList,
    "paged.list": list(paged),
    "server.version": catalog.server?.version ?? fail("catalog.server.version is missing"),
    "protocol.current": catalog.protocolVersion,
    "protocol.older": list(supported.slice(1)),
    "free.daily_calls": platform.freeDailyCalls,
    "platform.upgrade_url": platform.upgradeUrl,
  };
}

/** Resolves {{name}} and {{facts.<path into economyFacts>}}; anything else fails. */
export function resolvePlaceholders(text, values, economy, where) {
  return text.replace(/\{\{\s*([a-z0-9_.]+)\s*\}\}/gi, (_, key) => {
    if (key.startsWith("facts.")) {
      let v = economy;
      for (const p of key.slice(6).split(".")) v = v == null ? undefined : v[p];
      if (typeof v !== "number" && typeof v !== "string") fail(`${where}: {{${key}}} is not a platform fact`);
      return String(v);
    }
    if (!(key in values)) fail(`${where}: unknown placeholder {{${key}}}`);
    return String(values[key]);
  });
}

/** Every host named in `text` (URLs and bare domain names). */
export function hostsIn(text) {
  const hosts = new Set();
  for (const m of text.matchAll(/\bhttps?:\/\/([^/\s"'`)<>\]]+)/gi)) hosts.add(m[1].toLowerCase());
  for (const m of text.matchAll(/\b((?:[a-z0-9-]+\.)+(?:com|dev|io|net|org|ai|app|co|workers\.dev))\b/gi)) hosts.add(m[1].toLowerCase());
  return hosts;
}

/** Builds everything in memory. */
export async function buildV9Skill() {
  const catalog = readV9Catalog();
  const toolNames = catalog.tools.map((t) => t.name);
  // Free-plan claims, plus every other v9 tool with its required arguments must be allowed.
  const claimed = new Set(FREE_CLAIMS.map(([t]) => t));
  const sample = (t) => {
    const out = {};
    for (const k of t.inputSchema?.required ?? []) {
      const p = t.inputSchema.properties[k] ?? {};
      out[k] = Array.isArray(p.enum) ? p.enum[0] : p.type === "integer" || p.type === "number" ? 1 : "TL-2026-5315";
    }
    return out;
  };
  const others = catalog.tools.filter((t) => !claimed.has(t.name)).map((t) => [t.name, sample(t), false]);
  const cases = [...FREE_CLAIMS, ...others];
  const facts = readV9Facts(cases.map(([t, a]) => [t, a]));
  facts.free.forEach((r, i) => {
    if (r.excluded !== cases[i][2]) {
      fail(`free plan: the skill says ${r.tool} ${JSON.stringify(r.args)} is ${cases[i][2] ? "refused" : "allowed"}, freeExcluded() says ${r.excluded ? "refused" : "allowed"}`);
    }
  });
  if (facts.v8_names.length !== catalog.compatibility?.v8_tool_names) fail("aliases.ts V8_TOOL_NAMES disagrees with catalog.compatibility.v8_tool_names");
  const platform = await readPlatformFacts();
  const values = placeholderValues(catalog, platform);

  const legacyMd = legacyMarkdown(catalog, facts.legacy);
  const sources = { "SKILL.md": readFileSync(join(SKILL_DIR, "SKILL.md"), "utf8") };
  for (const f of readdirSync(REFS_DIR).filter((f) => f.endsWith(".md") && f !== LEGACY_FILE).sort()) {
    sources[`references/${f}`] = readFileSync(join(REFS_DIR, f), "utf8");
  }
  sources[`references/${LEGACY_FILE}`] = legacyMd;
  const order = ["SKILL.md", ...Object.keys(sources).filter((f) => f !== "SKILL.md").sort()];
  const files = {};
  for (const f of order) files[f] = resolvePlaceholders(sources[f], values, platform.economy, f);

  let meta;
  try {
    meta = parseSkillMeta(files["SKILL.md"]);
  } catch (e) {
    fail(`SKILL.md frontmatter: ${e.message}`);
  }
  const flat = flatten(
    files,
    `<!-- Threadlinqs Intelligence MCP — agent skill (single-file build)
     Server ${values["server.version"]}, ${values["tools.count"]} tools, built from the v9 catalog.
     Canonical: ${CANONICAL}/mcp -->\n\n`,
  );
  for (const h of hostsIn(flat)) if (!ALLOWED_HOSTS.has(h)) fail(`the skill names the host ${h}; only ${[...ALLOWED_HOSTS].join(", ")} may appear`);
  if (/workers\.dev/i.test(flat)) fail("the skill names a workers.dev host");

  const zipBuf = zip(files);
  const module = skillModule(
    [
      "GENERATED — do not edit. Regenerate with: npm --prefix packages/mcp-server run build:skill-v9",
      "The v9 skill: imported by _worker.js and served at /mcp/skill.md and the skill zip while cfg:mcp-v9 is \"on\".",
      `Server ${values["server.version"]}, ${values["tools.count"]} tools, ${Object.keys(files).length} files, canonical ${CANONICAL}`,
    ],
    flat,
    zipBuf,
    meta,
  );
  return { catalog, facts, platform, values, sources, files, flat, zipBuf, module, meta, legacyMd, toolNames };
}

async function main() {
  const check = process.argv.includes("--check");
  const b = await buildV9Skill();
  const legacyPath = join(REFS_DIR, LEGACY_FILE);
  if (check) {
    const stale = [];
    if (!existsSync(legacyPath) || readFileSync(legacyPath, "utf8") !== b.legacyMd) stale.push("skill-v9/references/legacy-names.md");
    if (!existsSync(OUT_MODULE) || readFileSync(OUT_MODULE, "utf8") !== b.module) stale.push("skill-v9/dist/skill-files.js");
    if (stale.length) {
      console.error(`stale: ${stale.join(", ")}. Run: npm --prefix packages/mcp-server run build:skill-v9 (then git add -f packages/mcp-server/skill-v9/dist/skill-files.js)`);
      process.exit(1);
    }
    console.log(`v9 skill up to date (${b.values["tools.count"]} tools, ${Object.keys(b.files).length} files)`);
    return;
  }
  writeFileSync(legacyPath, b.legacyMd, "utf8");
  mkdirSync(DIST, { recursive: true });
  writeFileSync(OUT_MODULE, b.module, "utf8");
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  console.log(`built the v9 skill from ${b.values["tools.count"]} tools (server ${b.values["server.version"]})`);
  for (const [n, c] of Object.entries(b.files)) console.log(`  ${n.padEnd(40)} ${kb(Buffer.byteLength(c))}`);
  console.log(`  ${"→ SKILL_FLAT".padEnd(40)} ${kb(Buffer.byteLength(b.flat))}`);
  console.log(`  ${"→ SKILL_ZIP_B64 (zip bytes)".padEnd(40)} ${kb(b.zipBuf.length)}`);
  console.log(`  ${"→ skill-v9/dist/skill-files.js".padEnd(40)} ${kb(Buffer.byteLength(b.module))}`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((e) => {
    console.error(`build-skill-v9: ${e.message}`);
    process.exit(1);
  });
}
