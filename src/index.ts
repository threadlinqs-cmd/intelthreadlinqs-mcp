#!/usr/bin/env node
/**
 * Threadlinqs Intelligence MCP Server — stdio transport.
 *
 * ARCHITECTURE (v8, unchanged in v9): this package is a THIN PROXY. It speaks MCP over stdio to the
 * local host (Claude Desktop, Cursor, VS Code, Claude Code) and forwards every request
 * as JSON-RPC to the remote Streamable-HTTP MCP server at `${API_BASE}/mcp`, which
 * lives in the platform worker and owns the tool registry.
 *
 * v9 (this package's 9.0.0): the remote now has two surfaces on the one URL, picked by a
 * server-side flag. v8 lists 81 tools and answers plain JSON; v9 lists 25 tools, keeps every
 * v8 name callable as an unlisted alias, and answers Server-Sent Events to a client that
 * accepts them. The proxy speaks to both: it sends the dual Accept, branches on the response
 * content type (src/wire.ts), and treats the LIVE tools/list as the only authority on what is
 * listed. The bundled snapshot is the offline fallback and describes v9.
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
 * Auth: `THREADLINQS_API_KEY` (a `tl_` key; a free account gets a few tool calls a day, Purple and Gold have full access) is forwarded as a Bearer token.
 * Without it the server still starts and serves the catalog — registries introspect
 * before auth is configured (Glama's Docker probe) — but every tool CALL is refused by
 * the remote. Purple and Gold have full access; a free account gets a small daily allowance.
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
import { RemoteError, WIRE_LIMITS, explainFailure, failureMeta, parseFailure, readRpcResponse, readTextCapped, retryAfterOf, PROFILE_URL } from "./wire.js";

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
const API_BASE = process.env.THREADLINQS_API_URL || "https://intel.threadlinqs.com";
const API_KEY = process.env.THREADLINQS_API_KEY || "";

if (API_BASE && !API_BASE.startsWith("https://") && !API_BASE.startsWith("http://localhost")) {
  console.error("THREADLINQS_API_URL must use https:// or http://localhost");
  process.exit(1);
}

// Keep in lockstep with package.json / server.json / plugin.json / mcpb-build/manifest.json.
// This one is the version the client actually SEES in the initialize handshake, and it has been
// missed on a release before (see "fix: SERVER_VERSION 8.1.1") — npm version does not touch it.
const SERVER_VERSION = "9.0.0";
const MCP_ENDPOINT = `${API_BASE}/mcp`;
const CATALOG_ENDPOINT = `${API_BASE}/mcp/catalog.json`;
// Identifies this client to the platform's logs. Package name and version only: nothing about the
// user or the machine.
const USER_AGENT = `intelthreadlinqs-mcp/${SERVER_VERSION}`;

/**
 * The revision this proxy speaks to the remote. Kept in lockstep with the worker's
 * MCP_PROTOCOL_VERSION (v9 serves it too, next to 2026-07-28). The remote validates this header and answers 400 for anything
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

/**
 * One request, end to end (headers and body). v9 can legitimately spend most of a minute inside
 * a call (exports, semantic search), and its answer is a stream whose headers arrive first, so
 * the clock runs until the answer has been read.
 */
const REQUEST_TIMEOUT_MS = 55_000;

// ---------------------------------------------------------------------------
// LEGACY TOOL ALIASES (v7 → canonical v8 name)
//
// Dispatch-only: absent from tools/list, still callable. `args` rewrites the
// v7 argument shape onto the canonical tool's schema. The targets are v8 names, which both
// surfaces answer (v9 keeps all 81 as unlisted aliases of its own). Reviewed for 9.0.0 against
// packages/mcp-v9/src/legacy/aliases.ts: v9 aliases the v8 registry, not these v7-era names,
// so none became redundant and none was removed (tests/aliases.test.mjs enforces that).
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
  // (tools/test/mcp-proxy-parity.test.cjs enforces exactly this.)
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

const oneLine = (s: string) => s.replace(/\s*\n+\s*/g, " ");

let rpcId = 0;

async function mcpRpc<T = any>(method: string, params: unknown = {}, retries = 2): Promise<T> {
  const maxAttempts = retries + 1;
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      // v9's transport insists on hearing both; v8 ignores the header and answers JSON.
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": WIRE_PROTOCOL_VERSION,
      "User-Agent": USER_AGENT,
    };
    if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const id = ++rpcId;
    try {
      const res = await fetch(MCP_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
        signal: controller.signal,
      });

      // Anything but 2xx. 429/5xx are retried; everything else is terminal. The body is parsed
      // for a JSON-RPC error first, so the server's own code, data and retry hint survive.
      if (!res.ok) {
        const { text: body } = await readTextCapped(res, WIRE_LIMITS.maxErrorBytes);
        const header = parseInt(res.headers.get("retry-after") || "", 10);
        const f = parseFailure(res.status, res.statusText, body, res.headers.get("content-type"), Number.isFinite(header) ? header : undefined);
        const ra = f.retryAfterS;

        // Never sleep longer than a client will wait. The remote rate-limits MCP at
        // 120 requests / 60s and answers 429 with `Retry-After: 60`; honouring that
        // literally parks the call for a full minute, which every MCP host times out
        // long before — the caller sees an opaque hang instead of a usable error.
        // Beyond the cap, fail fast and SAY how long to wait.
        if (res.status === 429 && ra !== undefined && ra * 1000 > RETRY_SLEEP_CAP_MS) {
          throw new RemoteError(
            sanitize(
              `Rate limited by the Threadlinqs MCP endpoint. Retry in ${Math.ceil(ra)}s. ` +
                `(The limit is per API key / IP; batching many tool calls at once will trip it.)`,
            ),
            f.code,
            f.data,
            { status: res.status, retryAfterS: ra },
          );
        }
        if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts - 1) {
          const backoff = ra !== undefined ? ra * 1000 : 200 * 2 ** attempt + Math.random() * 100;
          await sleep(Math.min(backoff, RETRY_SLEEP_CAP_MS));
          continue;
        }
        throw new RemoteError(sanitize(f.message), f.code, f.data, { status: res.status, retryAfterS: ra });
      }

      const payload = await readRpcResponse(res, id);
      if (payload.error) {
        throw new RemoteError(sanitize(payload.error.message), payload.error.code, payload.error.data, {
          retryAfterS: retryAfterOf(payload),
        });
      }
      return payload.result as T;
    } catch (error) {
      lastErr = error;
      if (error instanceof RemoteError) throw error;
      const e = error instanceof Error ? error : new Error(String(error));
      const transient = e.name === "AbortError" || /fetch failed|network|ECONN|ETIMEDOUT|EAI_AGAIN|terminated/i.test(e.message);
      if (transient && attempt < maxAttempts - 1) {
        await sleep(200 * 2 ** attempt + Math.random() * 100);
        continue;
      }
      throw new RemoteError(sanitize(e.message));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Turn a remote failure into an actionable, surface-correct tool error. The platform uses -32001
 * for a missing or rejected credential and -32002 for "this plan or account state cannot call MCP"
 * (an unclaimed agent key, an unverified email, the free plan switched off, below the free tier);
 * its message is written for a connector host, so the stdio remedy is added by explainFailure.
 *
 * Tool-level refusals (v9's structured tool errors with a code, retryable and retry_after_s; the
 * free plan's free_mcp_limit_reached and free_mcp_tool_excluded) are NOT failures here: the remote
 * returns them as an ordinary tool result with isError, and that result is passed through
 * untouched. The machine-readable fields of a protocol-level failure ride in `_meta` (never in
 * structuredContent, which hosts validate against the tool's outputSchema).
 */
function toolError(e: unknown) {
  const err = e instanceof RemoteError ? e : new RemoteError(e instanceof Error ? e.message : String(e));
  // A failure with no code and no status can still be the missing-credential case.
  const needsKey = err.code === undefined && err.meta.status === undefined && /Authentication required/i.test(err.message);
  const shaped = needsKey ? new RemoteError(err.message, -32001, err.data, err.meta) : err;
  return {
    content: [{ type: "text" as const, text: explainFailure(shaped, !!API_KEY) }],
    isError: true,
    _meta: { "threadlinqs/error": failureMeta(shaped) },
  };
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
    const res = await fetch(CATALOG_ENDPOINT, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
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
 * The snapshot is regenerated from the v9 catalog (`npm run sync:catalog`; from the live
 * endpoint at release time), so it can lag a deploy but can never invent a tool that never
 * existed. It is the OFFLINE fallback only: whichever surface the remote serves right now (v8
 * lists 81 tools, v9 lists 25) is what the live tools/list returns, and that always wins.
 */
/**
 * Which tier of the fallback actually answered, for the most recent list call.
 *
 * This exists because silent degradation cost a real integrator a week: on a stale build
 * the two `catch {}` blocks below swallowed the failure and served the bundled snapshot,
 * so `tools/list` returned a plausible-but-frozen catalog with no signal anywhere that it
 * was not the live one. They concluded five tools "did not exist", filed tickets, built an
 * offline fixture to work around a tool we already shipped, and permanently deferred a
 * feature. A degraded catalog must be VISIBLE.
 */
export type CatalogSource = "live" | "public_catalog" | "bundled_snapshot";
let lastCatalogSource: CatalogSource = "bundled_snapshot";
export function getLastCatalogSource(): CatalogSource {
  return lastCatalogSource;
}

/** Follow `nextCursor` (bounded) so a paged list is never silently cut to its first page. */
async function listAllPages(method: string, resultKey: string): Promise<unknown[] | null> {
  const all: unknown[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const r = await mcpRpc<Record<string, unknown>>(method, cursor ? { cursor } : {});
    const items = r?.[resultKey];
    if (!Array.isArray(items)) return page === 0 ? null : all;
    all.push(...items);
    cursor = typeof r.nextCursor === "string" && r.nextCursor ? r.nextCursor : undefined;
    if (!cursor) break;
  }
  return all;
}

async function listFromRemoteOrCatalog<K extends keyof CatalogShape>(
  method: string,
  resultKey: string,
  catalogKey: K,
): Promise<unknown[]> {
  if (API_KEY) {
    try {
      const items = await listAllPages(method, resultKey);
      if (items) {
        lastCatalogSource = "live";
        return items;
      }
      console.error(
        `[threadlinqs] ${method}: authenticated call returned no "${resultKey}" array; falling back to the public catalog. ` +
          `Tool list may be incomplete.`,
      );
    } catch (e) {
      const msg = e instanceof RemoteError ? oneLine(explainFailure(e, true)) : e instanceof Error ? e.message : String(e);
      console.error(
        `[threadlinqs] ${method}: authenticated call FAILED (${msg}). Falling back to the public catalog. ` +
          `If this is a 401/403 your THREADLINQS_API_KEY is missing, rejected, unclaimed (an agent key) or its account is not verified — ` +
          `the tool list you get will be the public one, not yours.`,
      );
    }
  }
  try {
    const c = await publicCatalog();
    const live = c[catalogKey] as unknown[] | undefined;
    if (Array.isArray(live) && live.length > 0) {
      lastCatalogSource = "public_catalog";
      return live;
    }
    console.error(
      `[threadlinqs] public catalog carried no "${String(catalogKey)}"; falling back to the catalog bundled with this package.`,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(
      `[threadlinqs] public catalog unreachable (${msg}); falling back to the catalog bundled with this package. ` +
        `It is a SNAPSHOT and can lag the server — run \`npm i intelthreadlinqs-mcp@latest\` if tools look missing.`,
    );
  }
  lastCatalogSource = "bundled_snapshot";
  const snap = CATALOG_SNAPSHOT[catalogKey as keyof CatalogSnapshot];
  return Array.isArray(snap) ? snap : [];
}

/**
 * Stamp the catalog provenance onto each tool's `_meta`, so a client can see that its
 * tool list is degraded without reading stderr. `_meta` is the MCP-sanctioned place for
 * out-of-band annotation and is ignored by clients that do not look at it.
 */
function stampCatalogSource(items: unknown[], source: CatalogSource): unknown[] {
  if (source === "live") return items;
  return items.map((it) => {
    if (!it || typeof it !== "object") return it;
    const rec = it as Record<string, unknown>;
    const meta = (rec._meta && typeof rec._meta === "object" ? rec._meta : {}) as Record<string, unknown>;
    return {
      ...rec,
      _meta: {
        ...meta,
        "threadlinqs/catalog_source": source,
        "threadlinqs/catalog_note":
          source === "bundled_snapshot"
            ? "Served from the catalog bundled with this npm package — it can lag the server. Run `npm i intelthreadlinqs-mcp@latest`."
            : "Served from the public catalog, not your authenticated tool list. Check THREADLINQS_API_KEY.",
      },
    };
  });
}

// ---------------------------------------------------------------------------
// SERVER
// ---------------------------------------------------------------------------
const server = new Server(
  { name: "threadlinqs-intelligence", version: SERVER_VERSION },
  { capabilities: { tools: {}, resources: {}, prompts: {}, completions: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = await listFromRemoteOrCatalog("tools/list", "tools", "tools");
  return { tools: stampCatalogSource(tools, lastCatalogSource) };
});

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
          text: `"${call.aliased}" is a legacy name, kept callable as an alias for "${call.name}", which rejected the arguments: ${e.message}\n\nCall "${call.name}" directly — see tools/list for its schema.`,
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
    // gated — the remote refuses them until a key is set. A free key gets a small daily allowance; Purple and Gold have full access.
    console.error(
      "WARNING: THREADLINQS_API_KEY is not set — the server will start and expose its tool catalog, but every tool CALL will fail until a key is configured (a free account's key gets a small daily allowance; Purple and Gold have full access).",
    );
    console.error(`Get a key at ${PROFILE_URL} — a free account's key has a daily allowance of calls; Purple and Gold have full access.`);
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
    if (e instanceof RemoteError && (e.code === -32001 || e.code === -32002 || e.meta.status === 401 || e.meta.status === 403)) {
      console.error(
        `WARNING: ${oneLine(explainFailure(e, true))} — the catalog stays browsable but tool calls will fail.`,
      );
    } else {
      console.error(`WARNING: could not reach ${MCP_ENDPOINT} (${msg}); continuing — the catalog falls back to ${CATALOG_ENDPOINT}.`);
    }
  }

  await server.connect(transport);
  console.error(`Threadlinqs Intelligence MCP server v${SERVER_VERSION} running on stdio`);
  console.error(`Upstream: ${MCP_ENDPOINT} (Purple and Gold have full access; a free account has a daily allowance of calls)`);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
