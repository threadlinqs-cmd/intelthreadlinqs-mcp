#!/usr/bin/env node
/**
 * Regenerates src/catalog-snapshot.ts from a live /mcp/catalog.json.
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
 * bundled catalog instead of silence.
 *
 * ORDERING — READ THIS BEFORE A RELEASE
 * -------------------------------------
 * The snapshot is generated FROM the deployed worker. So the release order is:
 *   1. deploy the worker (it owns MCP_TOOLS / MCP_PROMPTS)
 *   2. npm run sync:catalog          <- picks up what the worker now serves
 *   3. npm run build && npm publish
 * Running this before the deploy bakes in the OLD catalog and reintroduces exactly
 * the drift this package was rewritten to eliminate. `npm run test:catalog` fails
 * loudly when the snapshot and the live catalog disagree.
 *
 * Usage:
 *   node scripts/sync-catalog.mjs [baseUrl]
 *   THREADLINQS_API_URL=https://... node scripts/sync-catalog.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE =
  process.argv[2] || process.env.THREADLINQS_API_URL || "https://intel.threadlinqs.com";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "catalog-snapshot.ts");

// Cache-bust. /mcp/catalog.json is served `public, max-age=3600`, so a sync run within an
// hour of a deploy can otherwise pull the PREVIOUS catalog off a Cloudflare edge node and
// bake a stale snapshot — which is exactly the 7-prompt mistake that shipped in 8.1.0.
const res = await fetch(`${BASE}/mcp/catalog.json?cb=${Number(process.hrtime.bigint() % 1000000n)}`, {
  headers: { Accept: "application/json", "cache-control": "no-cache" },
});
if (!res.ok) {
  console.error(`catalog fetch failed: ${res.status} ${res.statusText} from ${BASE}`);
  process.exit(1);
}
const catalog = await res.json();

// Keep only what the list handlers actually serve. `server`/`protocolVersion` are
// deliberately excluded: those must come from the live handshake, never from a
// snapshot that could be months old and would misreport the server's identity.
const picked = {
  tools: catalog.tools ?? [],
  prompts: catalog.prompts ?? [],
  resources: catalog.resources ?? [],
  resourceTemplates: catalog.resourceTemplates ?? [],
};

for (const [k, v] of Object.entries(picked)) {
  if (!Array.isArray(v) || v.length === 0) {
    console.error(`refusing to write snapshot: "${k}" is empty — the source catalog looks wrong`);
    process.exit(1);
  }
}

const banner = `// GENERATED FILE — DO NOT EDIT BY HAND.
// Regenerate with: npm run sync:catalog
//
// Offline fallback for introspection. See scripts/sync-catalog.mjs for why this
// exists and for the release ordering that keeps it honest.
//
// Source : ${BASE}/mcp/catalog.json
// Counts : ${picked.tools.length} tools, ${picked.prompts.length} prompts, ${picked.resources.length} resources, ${picked.resourceTemplates.length} resource templates
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

writeFileSync(OUT, body, "utf8");
console.log(
  `wrote ${OUT}\n  ${picked.tools.length} tools, ${picked.prompts.length} prompts, ` +
    `${picked.resources.length} resources, ${picked.resourceTemplates.length} templates ` +
    `(${(body.length / 1024).toFixed(1)} KB)`,
);
