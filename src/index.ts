#!/usr/bin/env node
/**
 * Threadlinqs Intelligence MCP Server — stdio transport.
 *
 * ARCHITECTURE (v8): this package is a THIN PROXY. It speaks MCP over stdio to the
 * local host (Claude Desktop, Cursor, VS Code, Claude Code) and forwards every request
 * as JSON-RPC to the remote Streamable-HTTP MCP server at `${API_BASE}/mcp`, which
 * lives in the platform worker and owns the single tool registry (`MCP_TOOLS`).
 *
 * Why it was rewritten. Until v7.1.4 this file carried its own hand-maintained catalog
 * of 54 tool definitions plus ~790 lines of dispatch, duplicating the worker's registry
 * of 57. The two drifted by 31 tools: the worker had already consolidated seven C2
 * tools into `get_c2(view)` and two correlation tools into `get_correlations(engine)`,
 * and this package never received it. Same capability shipped under different names
 * (`get_actor` vs `get_actor_profile`, `get_cve` vs `get_cve_details`), and even
 * same-named tools took different parameters (`search_iocs` wants `value` remotely,
 * `query` here). Adding a tool meant two edits and a publish; forgetting one was silent.
 *
 * Now there is one registry. `tools/list` is whatever the worker says it is, including
 * outputSchema, annotations and `_meta` — so MCP Apps UI metadata reaches stdio hosts
 * for free — and this package gains the 7 prompts and completion support it never had.
 *
 * Compatibility: every retired v7 tool name is kept as a DISPATCH-ONLY alias (below).
 * They are absent from `tools/list` but still callable, with their arguments rewritten
 * to the canonical shape, so existing configs and saved prompts keep working.
 *
 * Auth: `THREADLINQS_API_KEY` (a Purple/Gold `tl_` key) is forwarded as a Bearer token.
 * Without it the server still starts and serves the catalog — registries introspect
 * before auth is configured (Glama's Docker probe) — but every tool CALL is refused by
 * the remote. Threadlinqs MCP data access remains Purple-tier only.
 *
 * @author Threadlinqs Team
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  CompleteRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { CATALOG_SNAPSHOT, type CatalogSnapshot } from "./catalog-snapshot.js";

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
const API_BASE = process.env.THREADLINQS_API_URL || "https://intel.threadlinqs.com";
const API_KEY = process.env.THREADLINQS_API_KEY || "";

if (API_BASE && !API_BASE.startsWith("https://") && !API_BASE.startsWith("http://localhost")) {
  console.error("THREADLINQS_API_URL must use https:// or http://localhost");
  process.exit(1);
}

const SERVER_VERSION = "8.1.0";
const MCP_ENDPOINT = `${API_BASE}/mcp`;
const CATALOG_ENDPOINT = `${API_BASE}/mcp/catalog.json`;

/**
 * The revision this proxy speaks to the remote. Kept in lockstep with the worker's
 * MCP_PROTOCOL_VERSION. The remote validates this header and answers 400 for anything
 * it does not support, so bumping it here without bumping the worker is a hard failure
 * rather than a silent downgrade — which is the intent.
 */
const WIRE_PROTOCOL_VERSION = "2025-11-25";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Hard ceiling on any single retry sleep. The remote answers 429 with
 * `Retry-After: 60`; sleeping that long inside a tool call outlives every MCP host's
 * timeout, so the caller gets an opaque hang instead of an error it can act on. Past
 * this cap we fail fast and report the wait instead.
 */
const RETRY_SLEEP_CAP_MS = 4000;

// ---------------------------------------------------------------------------
// LEGACY TOOL ALIASES (v7 → v8)
//
// Dispatch-only: absent from tools/list, still callable. `args` rewrites the
// v7 argument shape onto the canonical tool's schema. Remove in the next major.
// ---------------------------------------------------------------------------
type AliasFn = (a: Record<string, unknown>) => Record<string, unknown>;
interface Alias { to: string; args?: AliasFn }

const LEGACY_ALIASES: Record<string, Alias> = {
  // The worker collapsed seven C2 tools into get_c2(view).
  list_c2_beacons:          { to: "get_c2", args: (a) => ({ view: "beacons", limit: a.limit }) },
  get_c2_configs:           { to: "get_c2", args: (a) => ({ view: "configs", limit: a.limit }) },
  get_c2_operators:         { to: "get_c2", args: () => ({ view: "operators" }) },
  get_c2_watermarks:        { to: "get_c2", args: () => ({ view: "watermarks" }) },
  get_c2_cross_correlations:{ to: "get_c2", args: () => ({ view: "correlations" }) },
  get_c2_timeline:          { to: "get_c2", args: () => ({ view: "timeline" }) },
  get_c2_stats:             { to: "get_c2", args: () => ({ view: "stats" }) },

  // ...and two correlation tools into get_correlations(engine).
  get_correlations_overview:{ to: "get_correlations", args: () => ({ engine: "overview" }) },
  get_correlation_engine:   { to: "get_correlations", args: (a) => ({ engine: a.engine }) },

  // Straight renames.
  get_actor_profile:        { to: "get_actor",   args: (a) => ({ name: a.name }) },
  get_cve_details:          { to: "get_cve",     args: (a) => ({ cve_id: a.cve_id }) },
  get_cwe_details:          { to: "get_cwe",     args: (a) => ({ cwe_id: a.cwe_id }) },
  predict_attack_path:      { to: "predict_mitre_transitions",
                              args: (a) => ({ technique_id: a.technique_id, direction: a.direction, top_n: a.top_n }) },

  // enrich_iocs was byte-identical to search_iocs (same URL, same params).
  enrich_iocs:              { to: "search_iocs", args: (a) => ({ value: a.query ?? a.value, type: a.type, limit: a.limit }) },

  // NOT aliased: get_enrichment_overview. It duplicates get_correlations(engine:
  // 'enrichment') in effect, but it is a LIVE entry in the worker's MCP_TOOLS — so
  // aliasing it here would shadow a real tool and rewrite its arguments. Collapsing
  // the duplicate is a decision for the worker registry, not for this proxy.
  // (scripts/test/mcp-proxy-parity.test.cjs enforces exactly this.)
};

/**
 * Same-named tools whose PARAMETERS differ between v7 and the canonical registry.
 * Applied to canonical calls too, so a client written against v7 keeps working.
 */
const LEGACY_PARAM_FIXUPS: Record<string, AliasFn> = {
  // v7 search_iocs took `query`; the registry takes `value`.
  search_iocs: (a) => (a.query !== undefined && a.value === undefined ? { ...a, value: a.query, query: undefined } : a),
  // v7 get_detections took `search`; the registry takes `q`/`query`.
  get_detections: (a) => (a.search !== undefined && a.query === undefined ? { ...a, query: a.search, search: undefined } : a),
};

function stripUndefined(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return out;
}

/** Resolve a possibly-legacy tool call to { name, args } on the canonical registry. */
function resolveToolCall(name: string, args: Record<string, unknown>) {
  const alias = LEGACY_ALIASES[name];
  if (alias) return { name: alias.to, args: stripUndefined(alias.args ? alias.args(args) : args), aliased: name };
  const fix = LEGACY_PARAM_FIXUPS[name];
  return { name, args: stripUndefined(fix ? fix(args) : args), aliased: null as string | null };
}

// ---------------------------------------------------------------------------
// REMOTE TRANSPORT — JSON-RPC over HTTPS to the worker's /mcp
// ---------------------------------------------------------------------------
function sanitize(s: string): string {
  return API_KEY ? s.split(API_KEY).join("tl_***") : s;
}

class RemoteError extends Error {
  constructor(message: string, readonly code?: number, readonly data?: unknown) {
    super(message);
  }
}

let rpcId = 0;

async function mcpRpc<T = any>(method: string, params: unknown = {}, retries = 2): Promise<T> {
  const maxAttempts = retries + 1;
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "MCP-Protocol-Version": WIRE_PROTOCOL_VERSION,
    };
    if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(MCP_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      // Transport-level failures. 429/5xx are retried; everything else is terminal.
      if (!res.ok && res.status !== 401) {
        const body = await res.text().catch(() => "");
        const ra = parseInt(res.headers.get("retry-after") || "", 10);

        // Never sleep longer than a client will wait. The remote rate-limits MCP at
        // 120 requests / 60s and answers 429 with `Retry-After: 60`; honouring that
        // literally parks the call for a full minute, which every MCP host times out
        // long before — the caller sees an opaque hang instead of a usable error.
        // Beyond the cap, fail fast and SAY how long to wait.
        if (res.status === 429 && Number.isFinite(ra) && ra * 1000 > RETRY_SLEEP_CAP_MS) {
          throw new RemoteError(
            `Rate limited by the Threadlinqs MCP endpoint. Retry in ${ra}s. ` +
            `(The limit is per API key / IP; batching many tool calls at once will trip it.)`,
          );
        }
        if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts - 1) {
          const backoff = Number.isFinite(ra) ? ra * 1000 : 200 * 2 ** attempt + Math.random() * 100;
          await sleep(Math.min(backoff, RETRY_SLEEP_CAP_MS));
          continue;
        }
        throw new RemoteError(sanitize(`MCP ${res.status} ${res.statusText} — ${body.slice(0, 400)}`));
      }

      const payload = (await res.json().catch(() => null)) as
        | { result?: T; error?: { code: number; message: string; data?: unknown } }
        | null;
      if (!payload) throw new RemoteError("Malformed response from the Threadlinqs MCP endpoint (not JSON).");
      if (payload.error) throw new RemoteError(sanitize(payload.error.message), payload.error.code, payload.error.data);
      return payload.result as T;
    } catch (error) {
      clearTimeout(timer);
      lastErr = error;
      if (error instanceof RemoteError) throw error;
      const e = error instanceof Error ? error : new Error(String(error));
      const transient = e.name === "AbortError" || /fetch failed|network|ECONN|ETIMEDOUT|EAI_AGAIN/i.test(e.message);
      if (transient && attempt < maxAttempts - 1) {
        await sleep(200 * 2 ** attempt + Math.random() * 100);
        continue;
      }
      throw new RemoteError(sanitize(e.message));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Turn a remote failure into an actionable, surface-correct tool error. The remote
 * uses -32001 for "Purple tier required"; its own message names the upgrade path, but
 * it is written for a connector host, so the stdio remedy is spelled out here.
 */
function toolError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  const code = e instanceof RemoteError ? e.code : undefined;
  let text = msg;
  if (code === -32001 || /Authentication required|Purple/i.test(msg)) {
    text = API_KEY
      ? `${msg}\n\nThe configured THREADLINQS_API_KEY was rejected or is below Purple tier. Check it at https://intel.threadlinqs.com/profile`
      : `${msg}\n\nSet THREADLINQS_API_KEY to a Purple or Gold key (get one at https://intel.threadlinqs.com/profile) and restart the MCP server.`;
  }
  return { content: [{ type: "text" as const, text }], isError: true };
}

// ---------------------------------------------------------------------------
// CATALOG — live when authenticated, public snapshot otherwise
//
// tools/list is Purple-gated on the remote, but registries probe the catalog with no
// key at all. /mcp/catalog.json serves the identical projection unauthenticated (the
// same information /mcp.md has always published), so introspection works either way
// without this package carrying a second hand-maintained copy.
// ---------------------------------------------------------------------------
interface CatalogShape {
  tools?: unknown[];
  prompts?: unknown[];
  resources?: unknown[];
  resourceTemplates?: unknown[];
}

let catalogCache: { at: number; value: CatalogShape } | null = null;
const CATALOG_TTL_MS = 300_000;

async function publicCatalog(): Promise<CatalogShape> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) return catalogCache.value;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(CATALOG_ENDPOINT, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (!res.ok) throw new Error(`catalog ${res.status}`);
    const value = (await res.json()) as CatalogShape;
    catalogCache = { at: Date.now(), value };
    return value;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Three tiers, most authoritative first:
 *
 *   1. authenticated `tools/list` — live, and the only view that can ever carry
 *      per-user variation
 *   2. public `/mcp/catalog.json` — identical projection, no key required
 *   3. CATALOG_SNAPSHOT — bundled in this package, needs no network at all
 *
 * Tier 3 exists because tiers 1 and 2 both require egress to the platform. A
 * registry scanner that runs this package in a network-isolated sandbox used to
 * get an empty array — not an error, an EMPTY LIST, which is indistinguishable
 * from a server that genuinely exposes no tools. That is why Glama indexed this
 * server with zero tools. Returning a stale-but-real catalog is strictly better
 * than silently claiming to have nothing.
 *
 * The snapshot is regenerated from the deployed worker (`npm run sync:catalog`),
 * so it can lag a deploy but can never invent a tool that never existed.
 */
async function listFromRemoteOrCatalog<K extends keyof CatalogShape>(
  method: string,
  resultKey: string,
  catalogKey: K,
): Promise<unknown[]> {
  if (API_KEY) {
    try {
      const r = await mcpRpc<Record<string, unknown[]>>(method, {});
      if (Array.isArray(r?.[resultKey])) return r[resultKey];
    } catch {
      /* fall through to the public catalog */
    }
  }
  try {
    const c = await publicCatalog();
    const live = c[catalogKey] as unknown[] | undefined;
    if (Array.isArray(live) && live.length > 0) return live;
  } catch {
    /* fall through to the bundled snapshot */
  }
  const snap = CATALOG_SNAPSHOT[catalogKey as keyof CatalogSnapshot];
  return Array.isArray(snap) ? snap : [];
}

// ---------------------------------------------------------------------------
// SERVER
// ---------------------------------------------------------------------------
const server = new Server(
  { name: "threadlinqs-intelligence", version: SERVER_VERSION },
  { capabilities: { tools: {}, resources: {}, prompts: {}, completions: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: await listFromRemoteOrCatalog("tools/list", "tools", "tools"),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;
  const call = resolveToolCall(name, (rawArgs || {}) as Record<string, unknown>);
  try {
    // Pass the remote's CallToolResult straight through — content, structuredContent
    // and isError are already in MCP shape. Re-wrapping would drop structuredContent.
    return await mcpRpc("tools/call", { name: call.name, arguments: call.args });
  } catch (e) {
    if (e instanceof RemoteError && e.code === -32602 && call.aliased) {
      return {
        content: [{
          type: "text" as const,
          text: `"${call.aliased}" was retired in v8 and is now an alias for "${call.name}", which rejected the arguments: ${e.message}\n\nCall "${call.name}" directly — see tools/list for its schema.`,
        }],
        isError: true,
      };
    }
    return toolError(e);
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: await listFromRemoteOrCatalog("resources/list", "resources", "resources"),
}));

server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
  resourceTemplates: await listFromRemoteOrCatalog(
    "resources/templates/list", "resourceTemplates", "resourceTemplates",
  ),
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) =>
  mcpRpc("resources/read", { uri: request.params.uri }));

// Prompts and completion are NEW on stdio in v8 — the worker has served 7 prompts and
// prompt-argument completion all along; the hand-written server never exposed them.
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: await listFromRemoteOrCatalog("prompts/list", "prompts", "prompts"),
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) =>
  mcpRpc("prompts/get", { name: request.params.name, arguments: request.params.arguments || {} }));

server.setRequestHandler(CompleteRequestSchema, async (request) =>
  mcpRpc("completion/complete", request.params));

// ---------------------------------------------------------------------------
// STARTUP
// ---------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();

  if (!API_KEY) {
    // Boot without a key so introspection works for registries and clients that probe
    // the catalog before configuring auth (Glama's Docker check). Tool CALLS stay
    // gated — the remote refuses them. Purple tier (>= 3) is still required for data.
    console.error(
      "WARNING: THREADLINQS_API_KEY is not set — the server will start and expose its tool catalog, but every tool CALL will fail until a Purple/Gold key is configured.",
    );
    console.error("Get a Purple/Gold API key (or start a trial) at https://intel.threadlinqs.com/profile");
    await server.connect(transport);
    console.error(`Threadlinqs Intelligence MCP server v${SERVER_VERSION} on stdio (no API key — introspection only)`);
    return;
  }

  // Startup verification NEVER exits: registries build the image and may inject a
  // placeholder key to satisfy a "required" env var, then send tools/list. The real
  // gate is remote and per-call, so a bad key here only warns.
  try {
    const info = await mcpRpc<{ serverInfo?: { version?: string }; protocolVersion?: string }>(
      "initialize",
      {
        protocolVersion: WIRE_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "intelthreadlinqs-mcp-stdio", version: SERVER_VERSION },
      },
      0,
    );
    const tools = await listFromRemoteOrCatalog("tools/list", "tools", "tools");
    console.error(
      `Connected to ${MCP_ENDPOINT} (remote v${info?.serverInfo?.version ?? "?"}, protocol ${info?.protocolVersion ?? "?"}) — ${tools.length} tools available.`,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (e instanceof RemoteError && (e.code === -32001 || /Authentication required|Purple/i.test(msg))) {
      console.error(
        "WARNING: THREADLINQS_API_KEY was rejected or is below Purple tier — the catalog stays browsable but tool calls will fail. Fix it at https://intel.threadlinqs.com/profile",
      );
    } else {
      console.error(`WARNING: could not reach ${MCP_ENDPOINT} (${msg}); continuing — the catalog falls back to ${CATALOG_ENDPOINT}.`);
    }
  }

  await server.connect(transport);
  console.error(`Threadlinqs Intelligence MCP server v${SERVER_VERSION} running on stdio`);
  console.error(`Upstream: ${MCP_ENDPOINT} (Purple/Gold tier >= 3 required for tool calls)`);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
