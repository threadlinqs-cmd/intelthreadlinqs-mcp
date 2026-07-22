#!/usr/bin/env node
/**
 * Threadlinqs Intelligence MCP Server v5.0.0
 *
 * Complete MCP integration for the Threadlinqs Intelligence Platform.
 * Provides access to ALL platform data via 54 tools and 8 resources.
 * v5.0.0: structured output (outputSchema + structuredContent), honest tool
 * annotations + titles, retry/backoff, input validation, precise tier errors,
 * direct (non-N+1) detection lookups, and pagination hints.
 *
 * Tool groups:
 *
 * THREATS:      search, get detail, recent, categories, timeline
 * DETECTIONS:   list, search, detail, export
 * SIMULATIONS:  list, threat detail
 * DEBRIEFS:     list, get by date
 * MITRE:        coverage, technique detail
 * C2:           beacons, stats, operators, watermarks, cross-correlations,
 *               timeline, configs
 * CORRELATIONS: overview, engine detail (7 engines)
 * TRANSCRIPTS:  agent analysis transcripts
 * CVE/CWE:     lookup individual CVE/CWE details
 * PLATFORM:    stats, changelog, roadmap
 *
 * Data source: Cloudflare D1 via /api/v1/ endpoints
 * Transport: stdio (for Claude Desktop, Claude Code, Cursor, VS Code)
 *
 * @author Threadlinqs Intelligence
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
const API_BASE = process.env.THREADLINQS_API_URL || "https://intel.threadlinqs.com";
const API_KEY = process.env.THREADLINQS_API_KEY || "";

if (API_BASE && !API_BASE.startsWith('https://') && !API_BASE.startsWith('http://localhost')) {
  console.error('THREADLINQS_API_URL must use https:// or http://localhost');
  process.exit(1);
}

const SERVER_VERSION = "7.1.4";
const SERVER_START = Date.now();

// ---------------------------------------------------------------------------
// FETCH HELPER — retry/backoff on transient 429/5xx + network errors, honors
// Retry-After, parses tier-403s into actionable messages, never leaks the key.
// ---------------------------------------------------------------------------
interface ApiOpts { accept?: string; retries?: number; }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiFetch<T>(path: string, opts: ApiOpts = {}): Promise<T> {
  const url = `${API_BASE}/api/v1/${path}`;
  const accept = opts.accept || "application/json";
  const maxAttempts = (opts.retries ?? 2) + 1; // default: 3 attempts total
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const headers: Record<string, string> = { Accept: accept };
    if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        if (response.status === 403) {
          // Precise, single-tool insufficient-permission message (never the full catalog).
          try {
            const parsed = JSON.parse(body);
            throw new Error(`Access denied: requires ${parsed.required || "a higher"} tier (your current tier: ${parsed.current ?? "unknown"}). Set THREADLINQS_API_KEY with a key that has the required tier. Upgrade at ${parsed.upgrade_url || "https://threadlinqs.com/landing.html#pricing"}`);
          } catch (e) {
            if (e instanceof Error && e.message.startsWith("Access denied")) throw e;
          }
        }
        // Retry transient throttling / server errors.
        if ((response.status === 429 || response.status >= 500) && attempt < maxAttempts - 1) {
          const ra = parseInt(response.headers.get("retry-after") || "", 10);
          const delay = Number.isFinite(ra) ? ra * 1000 : 200 * Math.pow(2, attempt) + Math.random() * 100;
          await sleep(delay);
          continue;
        }
        throw new Error(`API ${response.status} ${response.statusText} — ${url}\n${body.slice(0, 500)}`);
      }
      return (accept.includes("json") ? await response.json() : await response.text()) as T;
    } catch (error) {
      clearTimeout(timeout);
      lastErr = error;
      const e = error instanceof Error ? error : new Error(String(error));
      // Do not retry the parsed tier-403 / 4xx errors — only transient network/abort.
      const transient = (e.name === "AbortError" || /fetch failed|network|ECONN|ETIMEDOUT|EAI_AGAIN/i.test(e.message))
        && !e.message.startsWith("Access denied") && !e.message.startsWith("API 4");
      if (transient && attempt < maxAttempts - 1) {
        await sleep(200 * Math.pow(2, attempt) + Math.random() * 100);
        continue;
      }
      throw error;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// ---------------------------------------------------------------------------
// RESPONSE HELPERS
// ---------------------------------------------------------------------------
function ok(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

// Returns the human-readable JSON text block AND a machine-readable
// structuredContent payload (per MCP 2025-11-25) whenever the value is a
// plain object — so any agent can consume the result without re-parsing text.
function json(data: unknown) {
  // Minified — pretty-printing inflates agent-facing JSON ~30-40% for no model benefit.
  const text = JSON.stringify(data);
  const isObject = typeof data === "object" && data !== null && !Array.isArray(data);
  return isObject
    ? { content: [{ type: "text" as const, text }], structuredContent: data as Record<string, unknown> }
    : { content: [{ type: "text" as const, text }] };
}

function err(msg: string, opts?: { hint?: string }) {
  const text = opts?.hint ? `Error: ${msg}\nHint: ${opts.hint}` : `Error: ${msg}`;
  return { content: [{ type: "text" as const, text }], isError: true };
}

// Strip any bearer token / API key from an error string before it reaches a
// content block or stderr.
function sanitizeError(e: unknown): string {
  let m = e instanceof Error ? e.message : String(e);
  if (API_KEY) m = m.split(API_KEY).join("[redacted]");
  return m.replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [redacted]");
}

// ---------------------------------------------------------------------------
// INPUT VALIDATION — validation failures surface as isError results (caught by
// the CallTool dispatcher), never as protocol-level exceptions (SEP-1303).
// ---------------------------------------------------------------------------
class ToolInputError extends Error {}

function clampInt(v: unknown, def: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function reqStr(v: unknown, label: string, o: { max?: number; pattern?: RegExp; patternHint?: string } = {}): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new ToolInputError(`Missing required parameter "${label}".`);
  if (o.max && s.length > o.max) throw new ToolInputError(`"${label}" is too long (max ${o.max} characters).`);
  if (o.pattern && !o.pattern.test(s)) throw new ToolInputError(`Invalid ${label}: "${s.slice(0, 48)}".${o.patternHint ? " " + o.patternHint : ""}`);
  return s;
}

// Common identifier patterns.
const RE_THREAT_ID = /^TL-\d{4}-\d{3,5}$/i;
const RE_CVE = /^CVE-\d{4}-\d{4,7}$/i;
const RE_CWE = /^CWE-\d{1,5}$/i;
const RE_TECHNIQUE = /^T\d{4}(\.\d{3})?$/i;

// ---------------------------------------------------------------------------
// MITRE FLAT ARRAY HELPER — extracts mitre_technique_ids, mitre_tactic_ids,
// primary_technique_id from a mitre_attack array of objects
// ---------------------------------------------------------------------------
function extractMitreFlat(mitreAttack: unknown): {
  mitre_technique_ids: string[];
  mitre_tactic_ids: string[];
  primary_technique_id: string | null;
} {
  if (!Array.isArray(mitreAttack)) return { mitre_technique_ids: [], mitre_tactic_ids: [], primary_technique_id: null };
  const techIds = [...new Set(mitreAttack.map((m: Record<string, unknown>) => String(m.technique_id || "")).filter(Boolean))];
  const tacticIds = [...new Set(mitreAttack.map((m: Record<string, unknown>) => String(m.tactic_id || "")).filter(Boolean))];
  return {
    mitre_technique_ids: techIds,
    mitre_tactic_ids: tacticIds,
    primary_technique_id: techIds[0] || null,
  };
}

// ---------------------------------------------------------------------------
// __meta HELPER — adds observability metadata to every response
// ---------------------------------------------------------------------------
function addMeta(data: unknown, toolName: string): unknown {
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    return { ...(data as Record<string, unknown>), __meta: { tool: toolName, version: SERVER_VERSION, fetched_at: new Date().toISOString() } };
  }
  return { result: data, __meta: { tool: toolName, version: SERVER_VERSION, fetched_at: new Date().toISOString() } };
}

// ---------------------------------------------------------------------------
// THREAT MITRE ENRICHER — adds flat MITRE arrays to a threat object
// ---------------------------------------------------------------------------
function enrichThreatMitre(threat: Record<string, unknown>): Record<string, unknown> {
  const mitre = extractMitreFlat(threat.mitre_attack);
  return { ...threat, ...mitre };
}

// ---------------------------------------------------------------------------
// SERVER INIT
// ---------------------------------------------------------------------------
const server = new Server(
  { name: "threadlinqs-intelligence", version: SERVER_VERSION },
  { capabilities: { resources: {}, tools: {} } },
);

// ---------------------------------------------------------------------------
// RESOURCES (8)
// ---------------------------------------------------------------------------
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "threadlinqs://threats",
      name: "All Threats",
      description: "Complete threat intelligence feed — all threats with metadata, severity, attribution, CVEs",
      mimeType: "application/json",
    },
    {
      uri: "threadlinqs://detections",
      name: "Detection Library",
      description: "All SPL, KQL, and Sigma detection rules across all threats",
      mimeType: "application/json",
    },
    {
      uri: "threadlinqs://iocs",
      name: "Indicators of Compromise",
      description: "All IOCs — IPs, domains, hashes, URLs, behavioral indicators",
      mimeType: "application/json",
    },
    {
      uri: "threadlinqs://stats",
      name: "Platform Statistics",
      description: "Current platform statistics — threat counts, detection counts, coverage metrics",
      mimeType: "application/json",
    },
    {
      uri: "threadlinqs://mitre",
      name: "MITRE ATT&CK Coverage",
      description: "Full MITRE ATT&CK technique and tactic coverage across all threats",
      mimeType: "application/json",
    },
    {
      uri: "threadlinqs://changelog",
      name: "Platform Changelog",
      description: "Recent platform updates, new features, and changes",
      mimeType: "application/json",
    },
    {
      uri: "threadlinqs://simulations",
      name: "Attack Simulations",
      description: "All attack simulation scenarios with platform coverage and threat mapping",
      mimeType: "application/json",
    },
    {
      uri: "threadlinqs://debriefs",
      name: "Daily Debriefs",
      description: "Daily threat intelligence briefings with aggregated analysis",
      mimeType: "application/json",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const resourceMap: Record<string, string> = {
    "threadlinqs://threats": "threats?limit=500",
    "threadlinqs://detections": "detections?limit=500",
    "threadlinqs://iocs": "iocs?limit=500",
    "threadlinqs://stats": "stats",
    "threadlinqs://mitre": "mitre",
    "threadlinqs://changelog": "changelog",
    "threadlinqs://simulations": "simulations",
    "threadlinqs://debriefs": "debriefs",
  };

  const path = resourceMap[uri];
  if (!path) throw new Error(`Unknown resource: ${uri}`);

  const result = await apiFetch<unknown>(path);
  // Extract data array if present, otherwise return raw
  const data = (result as Record<string, unknown>)?.data ?? result;
  return {
    contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data, null, 2) }],
  };
});

// ---------------------------------------------------------------------------
// TOOL ENRICHMENT — attaches honest annotations, a human-readable title, and
// (for the core data tools) an outputSchema to every tool in ONE place, so the
// 49 tool definitions below stay terse. Every tool is READ-ONLY (no mutations
// in the dispatch switch): readOnlyHint/idempotentHint true, destructiveHint
// false. openWorldHint is true only for tools that reach live/external data.
// ---------------------------------------------------------------------------
interface RawTool { name: string; description: string; inputSchema: Record<string, unknown>; }

const OPEN_WORLD = new Set<string>(["enrich_iocs", "get_ioc_dns", "get_ioc_intelligence"]);

const TOOL_TITLES: Record<string, string> = {
  search_threats: "Search Threats", get_threat: "Get Threat Detail", get_recent_threats: "Recent Threats",
  get_similar_threats: "Similar Threats", bulk_get_threats: "Bulk Get Threats", get_threat_bundle: "Threat Bundle",
  get_threat_hunting_bundle: "Threat Hunting Bundle (Purple)", list_threat_categories: "Threat Categories",
  get_detections: "List Detections", get_detection_detail: "Detection Detail", search_detections: "Search Detections",
  export_detection: "Export Detection (SPL/KQL/Sigma)", search_iocs: "Search IOCs", get_ioc_intelligence: "IOC Intelligence",
  get_ioc_dns: "Passive DNS Enrichment", enrich_iocs: "Enrich IOCs (live)", get_mitre_technique: "MITRE Technique",
  get_mitre_coverage: "MITRE Coverage", get_mitre_gap_analysis: "MITRE Gap Analysis", predict_attack_path: "Predict Attack Path",
  get_cve_details: "CVE Details", get_cve_intelligence: "CVE Intelligence", get_cwe_details: "CWE Details", bulk_get_cves: "Bulk Get CVEs",
  search_actors: "Search Threat Actors", get_actor_profile: "Threat Actor Profile", get_actor_intelligence: "Threat Actor Intelligence",
  list_simulations: "List Simulations", get_threat_simulations: "Threat Simulations", get_debrief: "Get Daily Debrief",
  get_latest_debrief: "Latest Daily Debrief", list_debriefs: "List Daily Debriefs", get_correlation_engine: "Correlation Engine",
  get_correlations_overview: "Correlations Overview", get_threat_transcripts: "Threat Analysis Transcripts",
  get_daily_intel_bundle: "Daily Intel Bundle", get_platform_stats: "Platform Stats", get_changelog: "Changelog",
  get_roadmap: "Roadmap", get_enrichment_overview: "Enrichment Overview", health: "Health Check",
};

function titleFor(name: string): string {
  return TOOL_TITLES[name] || name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// A "loose" object schema documents the headline keys for agents while letting
// any conforming JSON object validate. Per MCP 2025-11-25 structuredContent
// MUST be an object — which all our object-returning handlers satisfy.
const looseObj = (props: Record<string, unknown> = {}) => ({ type: "object" as const, properties: props, additionalProperties: true });

// outputSchema is declared ONLY for tools whose handler returns a JSON object
// (never raw text). export_detection / generate_c2_blocklist return text in
// some formats, so they are intentionally omitted (text-only is spec-valid).
const OUTPUT_SCHEMAS: Record<string, Record<string, unknown>> = {
  search_threats: looseObj({ count: { type: "number" }, items: { type: "array" } }),
  get_recent_threats: looseObj({ count: { type: "number" }, items: { type: "array" } }),
  get_detections: looseObj({ count: { type: "number" }, has_more: { type: "boolean" }, next_offset: { type: ["number", "null"] }, data: { type: "array" } }),
  search_detections: looseObj({ count: { type: "number" }, has_more: { type: "boolean" }, next_offset: { type: ["number", "null"] }, data: { type: "array" } }),
  list_threat_categories: looseObj({ total_categories: { type: "number" }, categories: { type: "array" } }),
  get_threat: looseObj({ id: { type: "string" }, title: { type: "string" } }),
  get_detection_detail: looseObj({ id: {}, name: {} }),
  get_platform_stats: looseObj(),
  health: looseObj({ status: { type: "string" }, version: { type: "string" } }),
  get_cve_details: looseObj(), get_cve_intelligence: looseObj(), get_cwe_details: looseObj(),
  get_actor_profile: looseObj(), get_actor_intelligence: looseObj(),
  get_mitre_coverage: looseObj(), get_mitre_gap_analysis: looseObj(), get_mitre_technique: looseObj(),
  get_correlations_overview: looseObj(), get_correlation_engine: looseObj(),
  get_enrichment_overview: looseObj(), get_daily_intel_bundle: looseObj(),
  get_debrief: looseObj(), get_latest_debrief: looseObj(), get_ioc_intelligence: looseObj(),
};

function enrichTool(t: RawTool) {
  const title = titleFor(t.name);
  const out: Record<string, unknown> = {
    ...t,
    title,
    annotations: { title, readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: OPEN_WORLD.has(t.name) },
  };
  if (OUTPUT_SCHEMAS[t.name]) out.outputSchema = OUTPUT_SCHEMAS[t.name];
  return out;
}

// ---------------------------------------------------------------------------
// TOOLS (49)
// ---------------------------------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ([
    // ---- THREATS ----
    {
      name: "search_threats",
      description: "Deterministic threat-catalog search. Returns LEAN rows {id, title, severity, category, status, threat_actor, nation_state, affected_products, cves, cvss_score, summary, created} — call get_threat for full detail. Combine free-text `query` with any structured filters; ALL filters AND-combine (e.g. query=\"supply chain\" + threat_actor=\"TeamPCP\" + category=\"SUPPLY_CHAIN\"). Paginated via limit + offset; result carries total/has_more.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text term (optional; AND-combined with filters)" },
          severity: { type: "string", enum: ["critical", "high", "medium", "low"], description: "Filter by severity level" },
          category: { type: "string", enum: ["MALWARE", "RANSOMWARE", "VULNERABILITY", "APT", "PHISHING", "ZERO_DAY", "SUPPLY_CHAIN", "DATA_BREACH", "ICS_SCADA", "AI_SECURITY", "CAMPAIGN", "THREAT_ACTOR", "ADVISORY", "FRAUD", "MISCONFIGURATION", "POLICY", "CLOUD", "EXTORTION", "THREAT_INTEL"], description: "Filter by category" },
          status: { type: "string", description: "Filter by status (e.g. active)" },
          threat_actor: { type: "string", description: "Filter by attributed actor name/alias (e.g. TeamPCP, APT29)" },
          nation_state: { type: "string", description: "Filter by nation-state (e.g. Russia, China)" },
          motivation: { type: "string", description: "Filter by motivation (e.g. financial, espionage)" },
          target_sector: { type: "string", description: "Filter by targeted sector (e.g. Healthcare)" },
          target_region: { type: "string", description: "Filter by targeted region (e.g. APAC)" },
          affected_product: { type: "string", description: "Filter by affected product/vendor (e.g. npm, Microsoft)" },
          tag: { type: "string", description: "Filter by exact tag (e.g. supply-chain-compromise)" },
          mitre_technique: { type: "string", description: "Filter by MITRE technique id (e.g. T1059)" },
          cve: { type: "string", description: "Filter by CVE id (e.g. CVE-2026-45321)" },
          malware: { type: "string", description: "Filter to threats deploying a malware family (e.g. LockBit, Vidar)" },
          tool: { type: "string", description: "Filter to threats using a tool (e.g. Cobalt Strike, Mimikatz)" },
          campaign: { type: "string", description: "Filter to threats in a named campaign/operation (e.g. Snowflake campaign)" },
          os: { type: "string", description: "Filter to threats affecting an operating system (e.g. Windows, Linux, VMware ESXi)" },
          sector: { type: "string", description: "Filter by grounded industry sector (e.g. Healthcare, Government)" },
          created_after: { type: "string", description: "ISO date — threats created on/after" },
          created_before: { type: "string", description: "ISO date — threats created on/before" },
          limit: { type: "number", description: "Max results (default 20, max 100)" },
          offset: { type: "number", description: "Pagination offset (default 0)" },
        },
      },
    },
    {
      name: "get_threat",
      description: "Get full details for a specific threat by ID. Returns complete threat intelligence: summary, description, severity, CVSS scores, attribution, CVEs/CWEs, MITRE mappings, timeline, IOCs, detections, tags, and references.",
      inputSchema: {
        type: "object",
        properties: {
          threat_id: { type: "string", description: "Threat ID (e.g., TL-2026-0042)" },
        },
        required: ["threat_id"],
      },
    },
    {
      name: "get_recent_threats",
      description: "Get the most recently published threats on the platform, ordered by creation date descending.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of threats to return (default 10, max 50)" },
        },
      },
    },
    {
      name: "list_threat_categories",
      description: "List all threat categories with counts. Returns category names and how many threats belong to each.",
      inputSchema: { type: "object", properties: {} },
    },
    // ---- DETECTIONS ----
    {
      name: "get_detections",
      description: "Get detection rules with filtering. Filter by threat ID, detection type (spl/kql/sigma), severity, or keyword search. Returns detection name, query/rule content, severity, confidence, data sources, and MITRE mappings.",
      inputSchema: {
        type: "object",
        properties: {
          threat_id: { type: "string", description: "Filter detections for a specific threat ID" },
          type: { type: "string", enum: ["spl", "kql", "sigma", "all"], description: "Detection language filter" },
          severity: { type: "string", enum: ["critical", "high", "medium", "low"], description: "Severity level filter" },
          search: { type: "string", description: "Keyword search (matches detection name and description)" },
          limit: { type: "number", description: "Max results (default 50, max 200)" },
          offset: { type: "number", description: "Pagination offset (default 0)" },
        },
      },
    },
    {
      name: "search_detections",
      description: "Search detection rules by keyword — matches against detection names and descriptions. Filter by type and severity. WHEN TO USE: for finding detections by topic (e.g. 'ransomware', 'lateral movement', 'credential dumping'). To list every detection for a specific threat, use get_detections(threat_id=...) instead. Returns has_more/next_offset for paging.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term (matches detection name and description)" },
          type: { type: "string", enum: ["spl", "kql", "sigma", "all"], description: "Detection language filter" },
          severity: { type: "string", enum: ["critical", "high", "medium", "low"], description: "Severity level filter" },
          limit: { type: "number", description: "Max results per page (default 25, max 200)." },
          offset: { type: "number", description: "Pagination offset (0-based). Pass next_offset from the previous response to page through results." },
        },
        required: ["query"],
      },
    },
    {
      name: "get_detection_detail",
      description: "Get full details for a specific detection rule by ID — includes query content (SPL/KQL/Sigma), MITRE ATT&CK mapping, data sources, false positive guidance, confidence level, and associated threat.",
      inputSchema: {
        type: "object",
        properties: {
          detection_id: { type: "string", description: "Detection ID (e.g. 'det-001' or the detection name)" },
        },
        required: ["detection_id"],
      },
    },
    {
      name: "export_detection",
      description: "Export a specific detection rule in a chosen format — returns the raw SPL query, KQL query, Sigma YAML, or full JSON with all metadata.",
      inputSchema: {
        type: "object",
        properties: {
          detection_id: { type: "string", description: "Detection ID to export" },
          format: { type: "string", enum: ["spl", "kql", "sigma", "json"], description: "Export format" },
        },
        required: ["detection_id", "format"],
      },
    },
    // ---- IOCs ----
    {
      name: "search_iocs",
      description: "Search indicators of compromise — IPs, domains, hashes, URLs, behavioral indicators. Filter by IOC type category.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "IOC value to search (IP, domain, hash, URL, or keyword)" },
          type: { type: "string", enum: ["ip", "domain", "hash", "url", "network", "file", "behavioral", "all"], description: "IOC type filter" },
          limit: { type: "number", description: "Max results (default 50)" },
        },
        required: ["query"],
      },
    },
    // ---- MITRE ATT&CK ----
    {
      name: "get_mitre_coverage",
      description: "Get MITRE ATT&CK framework coverage — all techniques and tactics mapped across the threat intelligence database with detection coverage statistics.",
      inputSchema: {
        type: "object",
        properties: {
          tactic: { type: "string", description: "Filter by specific tactic (e.g., 'Initial Access', 'Execution', 'Persistence')" },
        },
      },
    },
    {
      name: "get_mitre_technique",
      description: "Get detailed information about a specific MITRE ATT&CK technique — its mitigations, detection data sources, parent technique, and the threats that map to it.",
      inputSchema: {
        type: "object",
        properties: {
          technique_id: { type: "string", description: "MITRE technique ID (e.g., T1566, T1059.001)" },
        },
        required: ["technique_id"],
      },
    },
    // ---- GROUNDED ENRICHMENT & ENTITY PIVOTS ----
    {
      name: "get_threat_enrichment",
      description: "Reference-grounded enrichment for one threat by ID: the malware families and tools used, targeted sectors/regions, affected operating systems, named campaigns, AI/ML (ATLAS) techniques, and per-technique mitigations + detection data sources. Complements get_threat (overview/MITRE/IOCs/detections) — call this for the 'what malware/tools were used and who was targeted' view.",
      inputSchema: {
        type: "object",
        properties: { threat_id: { type: "string", description: "Threat ID (e.g. TL-2026-0042)" } },
        required: ["threat_id"],
      },
    },
    {
      name: "get_malware_intelligence",
      description: "Pivot on a malware FAMILY by name (e.g. LockBit, Vidar, Emotet). Returns the canonical family + type, prevalence (threat/actor counts, first/last seen), the threats deploying it, the actors using it, and its most-common ATT&CK techniques. For an offensive TOOL (Cobalt Strike, Mimikatz) use get_tool_intelligence. Use resolve_entity first if unsure of the canonical name.",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string", description: "Malware family name (e.g. LockBit, Vidar)" } },
        required: ["name"],
      },
    },
    {
      name: "get_tool_intelligence",
      description: "Pivot on an offensive tool / utility / RMM / LOLBin by name (e.g. Cobalt Strike, Mimikatz, AnyDesk, PsExec). Returns the canonical tool + class, prevalence, the threats and actors using it, and its most-common ATT&CK techniques.",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string", description: "Tool name (e.g. Cobalt Strike, Mimikatz)" } },
        required: ["name"],
      },
    },
    {
      name: "get_campaign_intelligence",
      description: "Pivot on a named campaign / operation by name (e.g. Snowflake campaign, ClickFix). Returns the threats in the campaign, the actors involved, prevalence, and common ATT&CK techniques.",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string", description: "Campaign / operation name" } },
        required: ["name"],
      },
    },
    {
      name: "resolve_entity",
      description: "Normalize an actor / malware / tool / sector / region / technique name or alias to its canonical reference form + stable UUID (e.g. 'fancy bear' → 'APT28'). Call this BEFORE pivoting (get_actor / get_malware_intelligence / get_tool_intelligence / search_threats) when unsure of the canonical name. Optional type narrows the lookup.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name or alias to resolve" },
          type: { type: "string", description: "Optional: actor|malware|tool|sector|region|technique|campaign" },
        },
        required: ["name"],
      },
    },
    // ---- SIMULATIONS ----
    {
      name: "list_simulations",
      description: "List all attack simulation scenarios available on the platform. Returns threats with simulation counts, platforms (windows/linux/python), severity, and threat actor attribution.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max threats to return (default 50)" },
        },
      },
    },
    {
      name: "get_threat_simulations",
      description: "Get all simulation commands for a specific threat. Returns detailed simulation steps with platform-specific commands (PowerShell, Bash, Python), MITRE mappings, caution levels, and requirements.",
      inputSchema: {
        type: "object",
        properties: {
          threat_id: { type: "string", description: "Threat ID to get simulations for (e.g., TL-2026-0042)" },
        },
        required: ["threat_id"],
      },
    },
    // ---- DEBRIEFS ----
    {
      name: "list_debriefs",
      description: "List all daily intelligence debriefs. Returns dates, threat counts, and summary information for each briefing.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max debriefs to return (default 30)" },
        },
      },
    },
    {
      name: "get_debrief",
      description: "Get a specific daily debrief by date. Returns full briefing with threat summaries, MITRE techniques covered, IOC breakdown, detection coverage, and threat actor activity. Use fallback='latest' if the requested date may not have a published debrief yet.",
      inputSchema: {
        type: "object",
        properties: {
          date: { type: "string", description: "Debrief date in YYYY-MM-DD format" },
          fallback: { type: "string", enum: ["strict", "latest"], description: "Behavior when date has no debrief: 'strict' (default, error), 'latest' (return most recent)" },
        },
        required: ["date"],
      },
    },
    {
      name: "get_latest_debrief",
      description: "Get the most recent published daily debrief regardless of date. Use this when you don't know the exact date or want today's/yesterday's briefing without guessing. Returns the full debrief with its actual_date field.",
      inputSchema: { type: "object", properties: {} },
    },
    // ---- BUNDLE TOOLS ----
    {
      name: "get_threat_bundle",
      description: "One-shot threat intelligence bundle — combines threat detail + simulations + IOCs + transcripts + flat MITRE arrays in a single response. Replaces 4 separate tool calls. Use instead of calling get_threat + get_threat_simulations + search_iocs + get_threat_transcripts individually.",
      inputSchema: {
        type: "object",
        properties: {
          threat_id: { type: "string", description: "Threat ID (e.g., TL-2026-0356)" },
          include: { type: "string", enum: ["full", "summary"], description: "Response detail level: 'full' (default) or 'summary' (id, title, severity, MITRE only)" },
        },
        required: ["threat_id"],
      },
    },
    {
      name: "get_daily_intel_bundle",
      description: "One-shot daily intelligence bundle — combines latest debrief + platform stats + top threats with detail + correlations overview in a single response. Replaces 7+ workflow nodes. This is the ideal starting point for any 'what happened today' analysis.",
      inputSchema: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date in YYYY-MM-DD format (defaults to latest available)" },
          top_n: { type: "number", description: "Number of top threats to include with full detail (default 5)" },
        },
      },
    },
    // ---- BULK TOOLS ----
    {
      name: "bulk_get_threats",
      description: "Fetch multiple threats by ID in a single call. Returns full threat objects with flat MITRE arrays. Max 20 IDs per call. Use this instead of calling get_threat N times in parallel.",
      inputSchema: {
        type: "object",
        properties: {
          threat_ids: { type: "array", items: { type: "string" }, description: "Array of threat IDs (max 20)" },
        },
        required: ["threat_ids"],
      },
    },
    {
      name: "bulk_get_cves",
      description: "Fetch multiple CVE details in a single call. Returns enriched CVE data with CVSS, EPSS, KEV status, and linked threats. Max 20 IDs per call.",
      inputSchema: {
        type: "object",
        properties: {
          cve_ids: { type: "array", items: { type: "string" }, description: "Array of CVE IDs (max 20)" },
        },
        required: ["cve_ids"],
      },
    },
    // ---- IOC ENRICHMENT ----
    {
      name: "get_ioc_dns",
      description: "Get passive DNS enrichment data for a specific IOC value (IP, domain, or URL). Returns DNS resolution history, reverse lookups, and infrastructure mapping. If the IOC has no DNS data, returns {known: false} instead of an error.",
      inputSchema: {
        type: "object",
        properties: {
          ioc_value: { type: "string", description: "IOC value to look up (IP address, domain, or URL)" },
        },
        required: ["ioc_value"],
      },
    },
    {
      name: "enrich_iocs",
      description: "Get enrichment metadata for IOCs — cross-references with ThreatFox, MalwareBazaar, AbuseIPDB/IPsum, and DNS data. Returns enrichment status and any matching threat intelligence from external feeds.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "IOC value or search query to enrich" },
          type: { type: "string", enum: ["ip", "domain", "hash", "url", "all"], description: "IOC type filter (default: all)" },
          limit: { type: "number", description: "Max results (default 20)" },
        },
        required: ["query"],
      },
    },
    {
      name: "get_enrichment_overview",
      description: "Get enrichment source health overview — hit rates, coverage percentages, and data freshness across all enrichment sources (NVD, EPSS, CISA KEV, MITRE CWE, ThreatFox, MalwareBazaar, IPsum, DNS, GitHub GHSA). Use this to assess data quality and identify enrichment gaps.",
      inputSchema: { type: "object", properties: {} },
    },
    // ---- HEALTH ----
    {
      name: "health",
      description: "Lightweight health check — returns server status, version, uptime, key stats, and API key validity. Sub-second response, no heavy queries. Use this instead of get_platform_stats for liveness probes.",
      inputSchema: { type: "object", properties: {} },
    },
    // ---- C2 INTELLIGENCE ----
    {
      name: "list_c2_beacons",
      description: "List Wild C2 beacons — command-and-control infrastructure intelligence including framework identification, watermark analysis, and geolocation.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max beacons to return (default 50)" },
        },
      },
    },
    {
      name: "get_c2_stats",
      description: "Get C2 intelligence statistics — framework distribution, geographic spread, watermark clusters, and operator activity summary.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_c2_operators",
      description: "Get C2 operator cluster analysis — behavioral fingerprints, shared infrastructure, and attributed operator groups.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_c2_cross_correlations",
      description: "Get C2 cross-intelligence correlations — IP matches, tag matches, MITRE technique overlaps, domain fronting detection, behavioral fingerprints, and watermark clusters across beacons.",
      inputSchema: { type: "object", properties: {} },
    },
    // ---- CORRELATIONS ----
    {
      name: "get_correlations_overview",
      description: "Get advanced correlations overview — aggregated intelligence from 7 correlation engines: MITRE heatmap, adversary infrastructure, IOC consensus, CVE velocity, attribution network, detection debt, and enrichment overview.",
      inputSchema: { type: "object", properties: {} },
    },
    // ---- CVE / CWE LOOKUPS ----
    {
      name: "get_cve_details",
      description: "Look up details for a specific CVE identifier. Returns description, severity, CVSS score, affected products, references, and linked threats.",
      inputSchema: {
        type: "object",
        properties: {
          cve_id: { type: "string", description: "CVE identifier (e.g., CVE-2024-3400)" },
        },
        required: ["cve_id"],
      },
    },
    {
      name: "get_cwe_details",
      description: "Look up details for a specific CWE identifier. Returns weakness name, description, severity, related CVEs, and mitigation guidance.",
      inputSchema: {
        type: "object",
        properties: {
          cwe_id: { type: "string", description: "CWE identifier (e.g., CWE-79)" },
        },
        required: ["cwe_id"],
      },
    },
    // ---- C2 EXTRAS ----
    {
      name: "get_c2_watermarks",
      description: "Get C2 watermark clusters — groupings of beacons sharing the same Cobalt Strike watermark, indicating shared operator or license.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_c2_timeline",
      description: "Get C2 beacon timeline — monthly version distribution showing C2 framework evolution over time.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_c2_configs",
      description: "Get full C2 beacon configurations — sleep times, jitter, user agents, spawnto paths, kill dates, crypto schemes, domain fronting details, and aggregate statistics.",
      inputSchema: { type: "object", properties: {} },
    },
    // ---- CORRELATION DETAILS ----
    {
      name: "get_correlation_engine",
      description: "Get detailed data from a specific correlation engine. Engines: mitre-heatmap (technique risk scores), adversary-infra (threat actor infrastructure), ioc-consensus (cross-source IOC validation), cve-velocity (exploit timeline analysis), attribution (cross-actor shared entities), detection-debt (uncovered technique gaps), enrichment (data source health).",
      inputSchema: {
        type: "object",
        properties: {
          engine: { type: "string", enum: ["mitre-heatmap", "adversary-infra", "ioc-consensus", "cve-velocity", "attribution", "detection-debt", "enrichment"], description: "Correlation engine name" },
        },
        required: ["engine"],
      },
    },
    // ---- TRANSCRIPTS ----
    {
      name: "get_threat_transcripts",
      description: "Get agent analysis transcripts for a threat — multi-agent intelligence reports with phases, signals, participant roles, and summary assessments.",
      inputSchema: {
        type: "object",
        properties: {
          threat_id: { type: "string", description: "Threat ID to get transcripts for" },
        },
        required: ["threat_id"],
      },
    },
    // ---- PLATFORM ----
    {
      name: "get_roadmap",
      description: "Get the platform roadmap — planned features, ideas in progress, and completed items with priorities and status.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_platform_stats",
      description: "Get current platform statistics — total threats, detections, IOCs, MITRE coverage, category breakdown, and operational status.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_changelog",
      description: "Get the platform changelog — recent updates, new features, bug fixes, and improvements.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max entries (default 20)" },
        },
      },
    },
    // ---- MCP v4.3: Specialized + Composite Tools ----
    // Specialized tools (Purple tier, >= 3) — actor intel + similarity
    {
      name: "search_actors",
      description: "Search threat actors by name, alias, nation-state, or motivation. Requires Purple tier ($11.99/mo). Returns actors with threat_count, severity_levels, categories, and nation_state.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term (actor name or alias)" },
          nation_state: { type: "string", description: "Filter by nation-state (e.g. 'Russia', 'China', 'Iran')" },
          motivation: { type: "string", description: "Filter by motivation (e.g. 'financial', 'espionage', 'destruction')" },
          tool: { type: "string", description: "Only actors with a threat using this tool (e.g. 'Cobalt Strike')" },
          malware: { type: "string", description: "Only actors with a threat deploying this malware family (e.g. 'LockBit')" },
          sector: { type: "string", description: "Only actors with a threat targeting this sector (e.g. 'Healthcare')" },
          limit: { type: "number", description: "Max results (default 20)" },
        },
      },
    },
    {
      name: "get_actor_profile",
      description: "Get a lean threat actor profile. Requires Purple tier ($11.99/mo). Returns: actor metadata + attribution counts + attributed-threat summary rows + MITRE tactic rollup with technique ids + IOC category counts (no raw values) + CVE/CWE/tool summaries + relationships. For heavy detail use follow-up tools: get_threat(id), get_detections(threat_id) / get_detection_detail, search_iocs.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Actor name or canonical alias (e.g. 'APT29', 'Lazarus Group')" },
        },
        required: ["name"],
      },
    },
    {
      name: "get_similar_threats",
      description: "Find threats similar to a given threat by precomputed similarity score (shared TTPs / IOC overlap / actor attribution). Requires Purple tier ($11.99/mo). Reveals lateral threats the LLM otherwise wouldn't surface.",
      inputSchema: {
        type: "object",
        properties: {
          threat_id: { type: "string", description: "Source threat ID (e.g. TL-2026-0042)" },
          limit: { type: "number", description: "Max results (default 10, max 50)" },
        },
        required: ["threat_id"],
      },
    },
    // Tier 3 (Purple, $11.99/mo) — flagship composite intelligence
    {
      name: "get_threat_hunting_bundle",
      description: "FLAGSHIP PURPLE TOOL. Single-call complete threat dossier — wraps threat detail + IOCs + detection queries + similar threats + simulation commands + infrastructure pivots (cross-threat IOC links + DNS trail) into one response. Saves 5-7 MCP round-trips. Requires Purple tier ($11.99/mo).",
      inputSchema: {
        type: "object",
        properties: {
          threat_id: { type: "string", description: "Threat ID (e.g. TL-2026-0042)" },
        },
        required: ["threat_id"],
      },
    },
    {
      name: "get_actor_intelligence",
      description: "Composite actor intelligence — actor_profile + active C2 infrastructure + cross-actor shared entities (from corr_attribution) + recent threat activity timeline. Single call for full adversary picture. Requires Purple tier ($11.99/mo).",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Actor name or canonical alias" },
        },
        required: ["name"],
      },
    },
    {
      name: "get_ioc_intelligence",
      description: "Given an IOC (IP, domain, hash, URL), return a complete dossier: all threats touching it + actor attribution + DNS enrichment trail + infrastructure pivots (cross-IOC links) + corr_ioc_consensus confidence score from 7 external feeds (Pulsedive, GreyNoise, Yaraify, MalwareBazaar, URLScan, VxVault, OpenPhish). Powers 'I found this in a log — tell me everything' workflows. Requires Purple tier ($11.99/mo).",
      inputSchema: {
        type: "object",
        properties: {
          ioc_value: { type: "string", description: "IOC value (IP, domain, hash, URL)" },
        },
        required: ["ioc_value"],
      },
    },
    {
      name: "get_cve_intelligence",
      description: "Composite CVE dossier — CVE detail + linked threats + EPSS exploitation velocity + KEV status + detection coverage % + simulation availability + exploitation timeline. Requires Purple tier ($11.99/mo).",
      inputSchema: {
        type: "object",
        properties: {
          cve_id: { type: "string", description: "CVE ID (e.g. CVE-2025-12345)" },
        },
        required: ["cve_id"],
      },
    },
    {
      name: "get_mitre_gap_analysis",
      description: "Prioritized list of uncovered MITRE techniques sorted by detection debt score (combines threat exposure + KEV exposure + EPSS). Each entry includes threat examples + recommended detection types to deploy. Powers 'what should I write detections for next?' workflows. Requires Purple tier ($11.99/mo).",
      inputSchema: {
        type: "object",
        properties: {
          tactic: { type: "string", description: "Filter by MITRE tactic (e.g. 'initial-access', 'persistence', 'lateral-movement')" },
          limit: { type: "number", description: "Max results (default 20, max 100)" },
        },
      },
    },
    {
      name: "predict_attack_path",
      description: "Given a MITRE technique, predict the most likely next techniques based on observed chains across 160+ threats. Returns top-N transitions with probability + transition_count + example threats per branch. Powers attack-chain reasoning. Requires Purple tier ($11.99/mo).",
      inputSchema: {
        type: "object",
        properties: {
          technique_id: { type: "string", description: "MITRE technique ID (e.g. T1566, T1059.001)" },
          top_n: { type: "number", description: "Max transitions to return (default 5, max 20)" },
          direction: { type: "string", enum: ["forward", "reverse"], description: "Forward = what comes after; reverse = what typically precedes" },
        },
        required: ["technique_id"],
      },
    },
    {
      name: "generate_c2_blocklist",
      description: "Generate a firewall-ready C2 IOC blocklist from active beacons. Filter by framework (cobalt-strike, sliver, etc.), recency window, and output format. Returns CIDR list (default), hosts file, or plain IP list. Requires Purple tier ($11.99/mo).",
      inputSchema: {
        type: "object",
        properties: {
          framework: { type: "string", description: "Filter by C2 framework (e.g. 'cobalt-strike', 'sliver', 'havoc')" },
          since_days: { type: "number", description: "How many days back to include (default 30, max 365)" },
          format: { type: "string", enum: ["cidr", "hosts", "plain"], description: "Output format (default: cidr JSON)" },
        },
      },
    },
  ] as RawTool[]).map(enrichTool),
}));

// ---------------------------------------------------------------------------
// TOOL HANDLERS
// ---------------------------------------------------------------------------
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ================================================================
      // THREATS
      // ================================================================
      case "search_threats": {
        // Unified lean engine: route to threats?lean=1 with q + every structured
        // filter (AND-combined; the server already returns lean rows incl.
        // affected_products + a pagination envelope, so we pass them straight through).
        const limit = Math.min((args?.limit as number) || 20, 100);
        const qp = new URLSearchParams();
        qp.set("lean", "1");
        qp.set("limit", String(limit));
        qp.set("offset", String((args?.offset as number) || 0));
        const passthru: Record<string, string> = {
          q: "query", severity: "severity", category: "category", status: "status",
          actor: "threat_actor", nation_state: "nation_state", motivation: "motivation",
          target_sector: "target_sector", target_region: "target_region",
          affected_product: "affected_product", tag: "tag",
          mitre_technique: "mitre_technique", cve: "cve",
          malware: "malware", tool: "tool", campaign: "campaign", os: "os", sector: "sector",
          created_after: "created_after", created_before: "created_before",
        };
        for (const [param, argKey] of Object.entries(passthru)) {
          const v = args?.[argKey];
          if (v != null && String(v).trim() !== "") qp.set(param, String(v).trim());
        }
        const result = await apiFetch<{ data?: unknown[]; pagination?: Record<string, unknown> }>(`threats?${qp.toString()}`);
        return json(addMeta({
          count: (result.data || []).length,
          total: result.pagination?.total,
          has_more: result.pagination?.has_more,
          offset: result.pagination?.offset,
          items: result.data || [],
        }, "search_threats"));
      }

      case "get_threat": {
        const threatId = reqStr(args?.threat_id, "threat_id", { pattern: RE_THREAT_ID, patternHint: "Expected format like TL-2026-0042." });
        const threat = await apiFetch<Record<string, unknown>>(`threats/${encodeURIComponent(threatId)}`);
        return json(addMeta(enrichThreatMitre(threat), "get_threat"));
      }

      case "get_recent_threats": {
        // lean=1 → compact rows (no fat tags/detections/iocs); pass through as-is.
        const limit = Math.min((args?.limit as number) || 15, 100);
        const offset = (args?.offset as number) || 0;
        const result = await apiFetch<{ data: Record<string, unknown>[]; pagination?: Record<string, unknown> }>(`threats?lean=1&limit=${limit}&offset=${offset}`);
        return json(addMeta({
          count: (result.data || []).length,
          total: result.pagination?.total,
          has_more: result.pagination?.has_more,
          items: result.data || [],
        }, "get_recent_threats"));
      }

      case "list_threat_categories": {
        // Accurate counts over the FULL corpus via the dedicated aggregation
        // endpoint. Falls back to paging the threats list (older Workers) so
        // the count is never silently computed over a single capped page.
        try {
          const res = await apiFetch<{ data: { category: string; count: number }[]; total_categories: number }>("threats/categories");
          return json(addMeta({ total_categories: res.total_categories, categories: res.data }, "list_threat_categories"));
        } catch (e) {
          if (!(e instanceof Error && /API 404/.test(e.message))) throw e;
          const cats: Record<string, number> = {};
          for (let offset = 0; offset < 2000; offset += 100) {
            const page = await apiFetch<{ data: Record<string, unknown>[] }>(`threats?limit=100&offset=${offset}`);
            const rows = page.data || [];
            rows.forEach((t) => { const c = String(t.category || "UNCATEGORIZED"); cats[c] = (cats[c] || 0) + 1; });
            if (rows.length < 100) break;
          }
          const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([category, count]) => ({ category, count }));
          return json(addMeta({ total_categories: sorted.length, categories: sorted }, "list_threat_categories"));
        }
      }

      // ================================================================
      // DETECTIONS
      // ================================================================
      case "get_detections": {
        // Direct, server-side filtered query (no fetch-all-then-filter). The
        // Worker supports threat_id/type/severity/q/limit/offset natively.
        const threatId = args?.threat_id ? reqStr(args.threat_id, "threat_id", { max: 32 }) : undefined;
        const type = args?.type as string | undefined;
        const severity = args?.severity as string | undefined;
        const search = args?.search as string | undefined;
        const limit = clampInt(args?.limit, 50, 1, 200);
        const offset = clampInt(args?.offset, 0, 0, 1_000_000);

        let path = `detections?limit=${limit}&offset=${offset}`;
        if (threatId) path += `&threat_id=${encodeURIComponent(threatId)}`;
        if (type && type !== "all") path += `&type=${encodeURIComponent(type)}`;
        if (severity) path += `&severity=${encodeURIComponent(severity)}`;
        if (search) path += `&q=${encodeURIComponent(search)}`;
        const result = await apiFetch<{ data?: unknown[] }>(path);
        const data = (result.data || []) as unknown[];
        return json(addMeta({
          threat_id: threatId || null,
          count: data.length,
          limit, offset,
          has_more: data.length === limit,
          next_offset: data.length === limit ? offset + limit : null,
          data,
        }, "get_detections"));
      }

      case "search_detections": {
        const query = reqStr(args?.query, "query", { max: 200 });
        const type = args?.type as string | undefined;
        const severity = args?.severity as string | undefined;
        const limit = clampInt(args?.limit, 25, 1, 200);
        const offset = clampInt(args?.offset, 0, 0, 1_000_000);

        let path = `detections?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
        if (type && type !== "all") path += `&type=${encodeURIComponent(type)}`;
        if (severity) path += `&severity=${encodeURIComponent(severity)}`;
        const result = await apiFetch<{ data?: unknown[] }>(path);
        const data = (result.data || []) as unknown[];
        return json(addMeta({
          query, count: data.length, limit, offset,
          has_more: data.length === limit,
          next_offset: data.length === limit ? offset + limit : null,
          data,
        }, "search_detections"));
      }

      case "get_detection_detail": {
        const detectionId = reqStr(args?.detection_id, "detection_id", { max: 128 });
        try {
          const det = await apiFetch<Record<string, unknown>>(`detections/${encodeURIComponent(detectionId)}`);
          return json(addMeta(det, "get_detection_detail"));
        } catch (e) {
          if (e instanceof Error && /API 404/.test(e.message)) {
            return err(`Detection not found: ${detectionId}.`, { hint: "Use search_detections or get_detections(threat_id=...) to find a valid detection_id." });
          }
          throw e;
        }
      }

      case "export_detection": {
        // Direct fetch only — the old fetch-all-threats fallback is removed
        // (it silently missed detections past the 100/500 row cap).
        const detectionId = reqStr(args?.detection_id, "detection_id", { max: 128 });
        const format = reqStr(args?.format, "format", { pattern: /^(spl|kql|sigma|json)$/i, patternHint: "Use one of: spl, kql, sigma, json." }).toLowerCase();
        let det: Record<string, unknown>;
        try {
          det = await apiFetch<Record<string, unknown>>(`detections/${encodeURIComponent(detectionId)}`);
        } catch (e) {
          if (e instanceof Error && /API 404/.test(e.message)) {
            return err(`Detection not found: ${detectionId}.`, { hint: "Use search_detections to find a valid detection_id." });
          }
          throw e;
        }
        switch (format) {
          case "spl": return det.query ? ok(String(det.query)) : err(`Detection ${detectionId} has no SPL variant.`, { hint: "Use format=json to see which query languages this detection provides." });
          case "kql": return (det.kql_query || det.query_kql) ? ok(String(det.kql_query || det.query_kql)) : err(`Detection ${detectionId} has no KQL variant.`, { hint: "Use format=json to see available query languages." });
          case "sigma": return det.sigma_rule ? ok(String(det.sigma_rule)) : err(`Detection ${detectionId} has no Sigma rule.`, { hint: "Use format=json to see available query languages." });
          case "json":
          default: return json(addMeta(det, "export_detection"));
        }
      }

      // ================================================================
      // IOCs
      // ================================================================
      case "search_iocs": {
        const query = String(args?.query || "");
        const iocType = args?.type as string | undefined;
        const limit = Math.min((args?.limit as number) || 50, 200);

        let path = `iocs?q=${encodeURIComponent(query)}&limit=${limit}`;
        if (iocType && iocType !== "all") path += `&category=${iocType}`;

        const result = await apiFetch<unknown>(path);
        return json(result);
      }

      // ================================================================
      // MITRE ATT&CK
      // ================================================================
      case "get_mitre_coverage": {
        // lean=1 → tactic summary + top techniques (full list is ~85 KB).
        const tactic = args?.tactic as string | undefined;
        let path = "mitre?lean=1";
        if (tactic) path += `&tactic=${encodeURIComponent(tactic)}`;
        const mitre = await apiFetch<unknown>(path);
        return json(mitre);
      }

      case "get_mitre_technique": {
        const techId = reqStr(args?.technique_id, "technique_id", { pattern: RE_TECHNIQUE, patternHint: "Expected format like T1059 or T1059.001." });
        const result = await apiFetch<unknown>(`mitre/${encodeURIComponent(techId)}`);
        return json(result);
      }

      // ================================================================
      // GROUNDED ENRICHMENT & ENTITY PIVOTS
      // ================================================================
      case "get_threat_enrichment": {
        const threatId = reqStr(args?.threat_id, "threat_id", { pattern: RE_THREAT_ID, patternHint: "Expected format like TL-2026-0042." });
        const result = await apiFetch<unknown>(`threats/${encodeURIComponent(threatId)}/enrichment`);
        return json(addMeta(result, "get_threat_enrichment"));
      }

      case "get_malware_intelligence": {
        const name = reqStr(args?.name, "name", { max: 200 });
        const result = await apiFetch<unknown>(`intel/malware/${encodeURIComponent(name)}`);
        return json(addMeta(result, "get_malware_intelligence"));
      }

      case "get_tool_intelligence": {
        const name = reqStr(args?.name, "name", { max: 200 });
        const result = await apiFetch<unknown>(`intel/tool/${encodeURIComponent(name)}`);
        return json(addMeta(result, "get_tool_intelligence"));
      }

      case "get_campaign_intelligence": {
        const name = reqStr(args?.name, "name", { max: 200 });
        const result = await apiFetch<unknown>(`intel/campaign/${encodeURIComponent(name)}`);
        return json(addMeta(result, "get_campaign_intelligence"));
      }

      case "resolve_entity": {
        const name = reqStr(args?.name, "name", { max: 200 });
        const qp = new URLSearchParams({ name });
        if (args?.type) qp.set("type", String(args.type));
        const result = await apiFetch<unknown>(`resolve?${qp.toString()}`);
        return json(addMeta(result, "resolve_entity"));
      }

      // ================================================================
      // SIMULATIONS
      // ================================================================
      case "list_simulations": {
        const limit = Math.min((args?.limit as number) || 50, 200);
        const result = await apiFetch<Record<string, unknown>>("simulations");
        const threats = ((result.threats || []) as Record<string, unknown>[]).slice(0, limit);
        return json({
          total_threats: (result.threats as unknown[])?.length || 0,
          total_simulations: result.total_simulations,
          threats: threats.map((t) => ({
            id: t.id,
            title: t.title,
            severity: t.severity_level,
            category: t.category,
            threat_actor: t.threat_actor,
            nation_state: t.nation_state,
            simulation_count: t.simulation_count,
            platforms: t.platforms,
          })),
          correlation: result.correlation,
          filter_meta: result.filter_meta,
        });
      }

      case "get_threat_simulations": {
        const threatId = reqStr(args?.threat_id, "threat_id", { pattern: RE_THREAT_ID, patternHint: "Expected format like TL-2026-0042." });
        // Use threats/:id/simulations (tier 0) instead of simulations/threat/:id (tier 2)
        const result = await apiFetch<unknown>(`threats/${encodeURIComponent(threatId)}/simulations`);
        return json(result);
      }

      // ================================================================
      // DEBRIEFS
      // ================================================================
      case "list_debriefs": {
        // lean=1 → compact daily rollups (full set is ~420 KB); server also honors limit.
        const limit = Math.min((args?.limit as number) || 30, 100);
        const result = await apiFetch<unknown>(`debriefs?lean=1&limit=${limit}`);
        const debriefs = Array.isArray(result) ? result : ((result as Record<string, unknown>).data || []) as unknown[];
        return json({ count: debriefs.length, debriefs });
      }

      case "get_debrief": {
        const date = args?.date as string;
        if (!date) return err("date is required (YYYY-MM-DD format)");
        const fallback = (args?.fallback as string) || "strict";
        try {
          const result = await apiFetch<Record<string, unknown>>(`debriefs/${encodeURIComponent(date)}`);
          return json(addMeta({ ...result, requested_date: date, actual_date: date }, "get_debrief"));
        } catch (e) {
          if (fallback === "latest") {
            // Fall back to most recent debrief
            const all = await apiFetch<unknown>("debriefs");
            const debriefs = (Array.isArray(all) ? all : []) as Record<string, unknown>[];
            if (debriefs.length === 0) return err("No debriefs available");
            const latest = debriefs[0]; // API returns newest first
            return json(addMeta({ ...latest, requested_date: date, actual_date: latest.date, fallback_used: true }, "get_debrief"));
          }
          throw e; // strict mode — rethrow original error
        }
      }

      case "get_latest_debrief": {
        const all = await apiFetch<unknown>("debriefs");
        const debriefs = (Array.isArray(all) ? all : []) as Record<string, unknown>[];
        if (debriefs.length === 0) return err("No debriefs available");
        const latest = debriefs[0];
        const latestDate = String(latest.date || "");
        // Fetch full debrief detail for the latest date
        try {
          const full = await apiFetch<Record<string, unknown>>(`debriefs/${encodeURIComponent(latestDate)}`);
          return json(addMeta({ ...full, actual_date: latestDate, requested_date: null }, "get_latest_debrief"));
        } catch {
          // If full fetch fails, return the summary
          return json(addMeta({ ...latest, actual_date: latestDate, requested_date: null }, "get_latest_debrief"));
        }
      }

      // ================================================================
      // C2 INTELLIGENCE
      // ================================================================
      case "list_c2_beacons": {
        const limit = Math.min((args?.limit as number) || 50, 200);
        const result = await apiFetch<unknown>(`c2/beacons?limit=${limit}`);
        return json(result);
      }

      case "get_c2_stats": {
        const result = await apiFetch<unknown>("c2/stats");
        return json(result);
      }

      case "get_c2_operators": {
        const result = await apiFetch<unknown>("c2/operators");
        return json(result);
      }

      case "get_c2_cross_correlations": {
        const result = await apiFetch<unknown>("c2/cross-correlations");
        return json(result);
      }

      case "get_c2_watermarks": {
        const result = await apiFetch<unknown>("c2/watermarks");
        return json(result);
      }

      case "get_c2_timeline": {
        const result = await apiFetch<unknown>("c2/timeline");
        return json(result);
      }

      case "get_c2_configs": {
        // Cap the raw configs[] array (can be multiple MB); aggregates are unaffected.
        const limit = Math.min((args?.limit as number) || 25, 200);
        const result = await apiFetch<unknown>(`c2/configs/full?limit=${limit}`);
        return json(result);
      }

      // ================================================================
      // CORRELATIONS
      // ================================================================
      case "get_correlations_overview": {
        const result = await apiFetch<unknown>("correlations/overview");
        return json(result);
      }

      case "get_correlation_engine": {
        const engine = args?.engine as string;
        if (!engine) return err("engine is required (e.g., mitre-heatmap, adversary-infra, ioc-consensus)");
        const valid = ["mitre-heatmap", "adversary-infra", "ioc-consensus", "cve-velocity", "attribution", "detection-debt", "enrichment"];
        if (!valid.includes(engine)) return err(`Invalid engine. Must be one of: ${valid.join(", ")}`);
        const result = await apiFetch<unknown>(`correlations/${engine}`);
        return json(result);
      }

      // ================================================================
      // TRANSCRIPTS
      // ================================================================
      case "get_threat_transcripts": {
        const threatId = reqStr(args?.threat_id, "threat_id", { pattern: RE_THREAT_ID, patternHint: "Expected format like TL-2026-0042." });
        const result = await apiFetch<unknown>(`threats/${encodeURIComponent(threatId)}/transcripts`);
        return json(result);
      }

      // ================================================================
      // CVE / CWE LOOKUPS
      // ================================================================
      case "get_cve_details": {
        const cveId = reqStr(args?.cve_id, "cve_id", { pattern: RE_CVE, patternHint: "Expected format like CVE-2026-3055." });
        const result = await apiFetch<unknown>(`cve/${encodeURIComponent(cveId)}`);
        return json(result);
      }

      case "get_cwe_details": {
        const cweId = reqStr(args?.cwe_id, "cwe_id", { pattern: RE_CWE, patternHint: "Expected format like CWE-79." });
        const result = await apiFetch<unknown>(`cwe/${encodeURIComponent(cweId)}`);
        return json(result);
      }

      // ================================================================
      // PLATFORM
      // ================================================================
      case "get_platform_stats": {
        const stats = await apiFetch<unknown>("stats");
        return json(stats);
      }

      case "get_roadmap": {
        const result = await apiFetch<unknown>("roadmap");
        return json(result);
      }

      case "get_changelog": {
        const limit = Math.min((args?.limit as number) || 20, 100);
        const result = await apiFetch<unknown>("changelog");
        if (Array.isArray(result)) {
          return json(result.slice(0, limit));
        }
        return json(result);
      }

      // ================================================================
      // IOC ENRICHMENT
      // ================================================================
      case "get_ioc_dns": {
        const iocValue = args?.ioc_value as string;
        if (!iocValue) return err("ioc_value is required");
        try {
          const result = await apiFetch<unknown>(`iocs/${encodeURIComponent(iocValue)}/dns`);
          return json(addMeta(result, "get_ioc_dns"));
        } catch {
          // Return soft-no instead of error for unknown IOCs
          return json(addMeta({
            ioc_value: iocValue,
            known: false,
            dns_records: [],
            message: "No passive DNS data available for this IOC",
          }, "get_ioc_dns"));
        }
      }

      case "enrich_iocs": {
        const query = String(args?.query || "");
        const iocType = args?.type as string | undefined;
        const limit = Math.min((args?.limit as number) || 20, 100);
        if (!query) return err("query is required");

        let path = `iocs?q=${encodeURIComponent(query)}&limit=${limit}`;
        if (iocType && iocType !== "all") path += `&category=${iocType}`;

        try {
          const result = await apiFetch<Record<string, unknown>>(path);
          return json(addMeta(result, "enrich_iocs"));
        } catch {
          return json(addMeta({
            query,
            known: false,
            data: [],
            message: "No enrichment data available for this query",
          }, "enrich_iocs"));
        }
      }

      case "get_enrichment_overview": {
        const result = await apiFetch<unknown>("correlations/enrichment");
        return json(addMeta(result, "get_enrichment_overview"));
      }

      // ================================================================
      // BUNDLE TOOLS
      // ================================================================
      case "get_threat_bundle": {
        const threatId = reqStr(args?.threat_id, "threat_id", { pattern: RE_THREAT_ID, patternHint: "Expected format like TL-2026-0042." });
        const include = (args?.include as string) || "full";

        const threat = await apiFetch<Record<string, unknown>>(`threats/${encodeURIComponent(threatId)}`);
        const mitre = extractMitreFlat(threat.mitre_attack);

        if (include === "summary") {
          return json(addMeta({
            threat: { id: threat.id, title: threat.title, severity: threat.severity, category: threat.category, attribution: threat.attribution, created: threat.created || threat.created_at },
            ...mitre,
          }, "get_threat_bundle"));
        }

        // Full bundle: threat + simulations + IOCs + transcripts
        const [sims, transcripts] = await Promise.all([
          apiFetch<unknown>(`threats/${encodeURIComponent(threatId)}/simulations`).catch(() => null),
          apiFetch<unknown>(`threats/${encodeURIComponent(threatId)}/transcripts`).catch(() => null),
        ]);

        return json(addMeta({
          threat: enrichThreatMitre(threat),
          simulations: sims,
          iocs: threat.iocs || null,
          transcripts: transcripts,
          ...mitre,
        }, "get_threat_bundle"));
      }

      case "get_daily_intel_bundle": {
        const date = args?.date as string | undefined;
        const topN = Math.min((args?.top_n as number) || 5, 10);

        // Fetch debrief (latest if no date or if date fails)
        let debrief: Record<string, unknown> | null = null;
        let debriefDate = date;
        if (date) {
          try { debrief = await apiFetch<Record<string, unknown>>(`debriefs/${encodeURIComponent(date)}`); }
          catch { /* fall through to latest */ }
        }
        if (!debrief) {
          const all = await apiFetch<unknown>("debriefs");
          const debriefs = (Array.isArray(all) ? all : []) as Record<string, unknown>[];
          if (debriefs.length > 0) {
            debriefDate = String(debriefs[0].date || "");
            try { debrief = await apiFetch<Record<string, unknown>>(`debriefs/${encodeURIComponent(debriefDate)}`); }
            catch { debrief = debriefs[0] as Record<string, unknown>; }
          }
        }

        // Fetch stats + top threats + correlations in parallel
        const [stats, threats, correlations] = await Promise.all([
          apiFetch<unknown>("stats").catch(() => null),
          apiFetch<{ data: Record<string, unknown>[] }>(`threats?limit=${topN}`).catch(() => ({ data: [] })),
          apiFetch<unknown>("correlations/overview").catch(() => null),
        ]);

        // Enrich top threats with flat MITRE
        const topThreats = (threats.data || []).map((t) => ({
          id: t.id,
          title: t.title,
          severity: (t.severity as Record<string, unknown>)?.level || t.severity_level,
          category: t.category,
          threat_actor: (t.attribution as Record<string, unknown>)?.threat_actor || t.threat_actor,
          ...extractMitreFlat(t.mitre_attack),
        }));

        return json(addMeta({
          debrief,
          debrief_date: debriefDate,
          stats,
          top_threats: topThreats,
          correlations_overview: correlations,
        }, "get_daily_intel_bundle"));
      }

      // ================================================================
      // BULK TOOLS
      // ================================================================
      case "bulk_get_threats": {
        const ids = args?.threat_ids as string[];
        if (!ids || !Array.isArray(ids) || ids.length === 0) return err("threat_ids is required (array of threat IDs)");
        if (ids.length > 20) return err("Maximum 20 threat IDs per call");

        const results = await Promise.allSettled(
          ids.map((id) => apiFetch<Record<string, unknown>>(`threats/${encodeURIComponent(id)}`))
        );

        const threats: Record<string, unknown>[] = [];
        const missing: string[] = [];
        results.forEach((r, i) => {
          if (r.status === "fulfilled") {
            threats.push(enrichThreatMitre(r.value));
          } else {
            missing.push(ids[i]);
          }
        });

        return json(addMeta({ threats, missing, count: threats.length }, "bulk_get_threats"));
      }

      case "bulk_get_cves": {
        const ids = args?.cve_ids as string[];
        if (!ids || !Array.isArray(ids) || ids.length === 0) return err("cve_ids is required (array of CVE IDs)");
        if (ids.length > 20) return err("Maximum 20 CVE IDs per call");

        const results = await Promise.allSettled(
          ids.map((id) => apiFetch<Record<string, unknown>>(`cve/${encodeURIComponent(id)}`))
        );

        const cves: Record<string, unknown>[] = [];
        const missing: string[] = [];
        results.forEach((r, i) => {
          if (r.status === "fulfilled") {
            cves.push(r.value);
          } else {
            missing.push(ids[i]);
          }
        });

        return json(addMeta({ cves, missing, count: cves.length }, "bulk_get_cves"));
      }

      // ================================================================
      // HEALTH
      // ================================================================
      case "health": {
        const uptimeSeconds = Math.floor((Date.now() - SERVER_START) / 1000);
        let apiKeyValid = false;
        let threatCount = 0;
        let detectionCount = 0;
        let latestDebriefDate = "";

        try {
          const stats = await apiFetch<Record<string, unknown>>("stats");
          apiKeyValid = true;
          threatCount = (stats.total_threats as number) || 0;
          detectionCount = (stats.total_detections as number) || 0;
        } catch {
          apiKeyValid = false;
        }

        try {
          const all = await apiFetch<unknown>("debriefs");
          const debriefs = (Array.isArray(all) ? all : []) as Record<string, unknown>[];
          if (debriefs.length > 0) latestDebriefDate = String(debriefs[0].date || "");
        } catch { /* ignore */ }

        return json({
          status: apiKeyValid ? "ok" : "degraded",
          version: SERVER_VERSION,
          uptime_seconds: uptimeSeconds,
          threat_count: threatCount,
          detection_count: detectionCount,
          latest_debrief_date: latestDebriefDate,
          api_key_valid: apiKeyValid,
          api_key_configured: !!API_KEY,
        });
      }

      // ================================================================
      // MCP v4.3 — Specialized Tools (Tier 2 + Tier 3 Purple)
      // ================================================================
      case "search_actors": {
        const q = (args?.query as string) || "";
        const ns = (args?.nation_state as string) || "";
        const mot = (args?.motivation as string) || "";
        const limit = Math.min((args?.limit as number) || 20, 100);
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (ns) params.set("nation_state", ns);
        if (mot) params.set("motivation", mot);
        if (args?.tool) params.set("tool", String(args.tool));
        if (args?.malware) params.set("malware", String(args.malware));
        if (args?.sector) params.set("sector", String(args.sector));
        if (limit) params.set("limit", String(limit));
        const result = await apiFetch<unknown>(`actors${params.toString() ? "?" + params.toString() : ""}`);
        return json(addMeta({ actors: result }, "search_actors"));
      }

      case "get_actor_profile": {
        const name = args?.name as string;
        if (!name) return err("name is required");
        // lean=1 → counts + lean threat rows + MITRE/CVE/tool summaries (a heavy actor
        // like TeamPCP is ~1 MB at full detail). Use the dedicated tools for the heavy
        // slices: get_detections(threat_id), search_iocs, get_threat(id).
        const result = await apiFetch<unknown>(`actors/${encodeURIComponent(name)}?lean=1`);
        return json(addMeta({ actor: result }, "get_actor_profile"));
      }

      case "get_similar_threats": {
        const threatId = reqStr(args?.threat_id, "threat_id", { pattern: RE_THREAT_ID, patternHint: "Expected format like TL-2026-0042." });
        const limit = Math.min((args?.limit as number) || 10, 50);
        const result = await apiFetch<unknown>(`threats/${encodeURIComponent(threatId)}/similar?limit=${limit}`);
        return json(addMeta(result, "get_similar_threats"));
      }

      case "get_threat_hunting_bundle": {
        const threatId = reqStr(args?.threat_id, "threat_id", { pattern: RE_THREAT_ID, patternHint: "Expected format like TL-2026-0042." });
        const [threat, similar, sims, pivots] = await Promise.all([
          apiFetch<Record<string, unknown>>(`threats/${encodeURIComponent(threatId)}`),
          apiFetch<unknown>(`threats/${encodeURIComponent(threatId)}/similar?limit=10`).catch(() => null),
          apiFetch<unknown>(`threats/${encodeURIComponent(threatId)}/simulations`).catch(() => null),
          apiFetch<unknown>(`threats/${encodeURIComponent(threatId)}/infrastructure-pivots`).catch(() => null),
        ]);
        return json(addMeta({
          threat: enrichThreatMitre(threat),
          iocs: threat.iocs || null,
          detections: threat.detections || null,
          similar_threats: similar,
          simulations: sims,
          infrastructure_pivots: pivots,
          ...extractMitreFlat(threat.mitre_attack),
        }, "get_threat_hunting_bundle"));
      }

      case "get_actor_intelligence": {
        const name = args?.name as string;
        if (!name) return err("name is required");
        // Composite: actor profile + cross-actor attribution
        const [actor, attribution] = await Promise.all([
          apiFetch<unknown>(`actors/${encodeURIComponent(name)}?lean=1`),
          apiFetch<unknown>(`correlations/attribution`).catch(() => null),
        ]);
        return json(addMeta({
          actor,
          cross_actor_attribution: attribution,
        }, "get_actor_intelligence"));
      }

      case "get_ioc_intelligence": {
        const iocValue = args?.ioc_value as string;
        if (!iocValue) return err("ioc_value is required");
        const result = await apiFetch<unknown>(`iocs/${encodeURIComponent(iocValue)}/intelligence`);
        return json(addMeta(result, "get_ioc_intelligence"));
      }

      case "get_cve_intelligence": {
        const cveId = reqStr(args?.cve_id, "cve_id", { pattern: RE_CVE, patternHint: "Expected format like CVE-2026-3055." });
        // Composite: CVE detail + velocity + detection coverage (search by CVE)
        const [cve, velocity, detections] = await Promise.all([
          apiFetch<Record<string, unknown>>(`cve/${encodeURIComponent(cveId)}`),
          apiFetch<unknown>(`correlations/cve-velocity`).catch(() => null),
          apiFetch<unknown>(`detections?search=${encodeURIComponent(cveId)}&limit=20`).catch(() => null),
        ]);
        return json(addMeta({
          cve,
          velocity_data: velocity,
          related_detections: detections,
        }, "get_cve_intelligence"));
      }

      case "get_mitre_gap_analysis": {
        const tactic = args?.tactic as string | undefined;
        const limit = Math.min((args?.limit as number) || 20, 100);
        const params = new URLSearchParams();
        if (tactic) params.set("tactic", tactic);
        if (limit) params.set("limit", String(limit));
        const result = await apiFetch<unknown>(`correlations/detection-debt${params.toString() ? "?" + params.toString() : ""}`);
        return json(addMeta({ gap_analysis: result, tactic_filter: tactic || null, limit }, "get_mitre_gap_analysis"));
      }

      case "predict_attack_path": {
        const techniqueId = reqStr(args?.technique_id, "technique_id", { pattern: RE_TECHNIQUE, patternHint: "Expected format like T1059 or T1059.001." });
        const topN = Math.min((args?.top_n as number) || 5, 20);
        const direction = (args?.direction as string) || "forward";
        const result = await apiFetch<unknown>(`mitre/${encodeURIComponent(techniqueId)}/transitions?top_n=${topN}&direction=${encodeURIComponent(direction)}`);
        return json(addMeta(result, "predict_attack_path"));
      }

      case "generate_c2_blocklist": {
        const framework = args?.framework as string | undefined;
        const sinceDays = Math.min((args?.since_days as number) || 30, 365);
        const format = (args?.format as string) || "cidr";
        const params = new URLSearchParams();
        if (framework) params.set("framework", framework);
        params.set("since_days", String(sinceDays));
        params.set("format", format);
        // For plain/hosts format the API returns text; we still wrap in JSON for MCP transport.
        if (format === "plain" || format === "hosts") {
          const url = `${API_BASE}/api/v1/c2/blocklist?${params.toString()}`;
          const resp = await fetch(url, {
            headers: { ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}), Accept: "text/plain" },
            signal: AbortSignal.timeout(30000),
          });
          if (resp.status === 401 || resp.status === 403) {
            const body = await resp.text().catch(() => "");
            let parsed: Record<string, unknown> = {};
            try { parsed = JSON.parse(body) as Record<string, unknown>; } catch { /* not JSON */ }
            throw new Error(`Access denied: requires ${parsed.required || "Purple"} tier (your current tier: ${parsed.current || "unknown"}). Set THREADLINQS_API_KEY env var with a valid Purple-tier API key. Upgrade at ${parsed.upgrade_url || "https://threadlinqs.com/landing.html#pricing"}`);
          }
          if (!resp.ok) {
            const body = await resp.text().catch(() => "");
            throw new Error(`Blocklist export failed: ${resp.status} ${resp.statusText} — ${body}`);
          }
          const text = await resp.text();
          return json(addMeta({
            format,
            since_days: sinceDays,
            framework_filter: framework || null,
            blocklist_text: text,
            line_count: text.split('\n').filter(Boolean).length,
          }, "generate_c2_blocklist"));
        }
        const result = await apiFetch<unknown>(`c2/blocklist?${params.toString()}`);
        return json(addMeta(result, "generate_c2_blocklist"));
      }

      default:
        return err(`Unknown tool: ${name}`, { hint: "Call tools/list to see the available tools." });
    }
  } catch (error) {
    // Input-validation errors get a clean message; everything else is sanitized
    // (key/token stripped) and returned as an isError result — never thrown to
    // the protocol layer.
    if (error instanceof ToolInputError) return err(error.message);
    return err(sanitizeError(error));
  }
});

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main() {
  // Purple-tier gate — the Threadlinqs Intelligence MCP server is a Purple/Gold
  // feature (tier >= 3). Verify the key resolves to a tier >= 3 account at startup
  // and REFUSE to start otherwise. Transient/network failures warn-and-continue
  // (the server-side per-endpoint 403s still enforce the gate in that case).
  const PURPLE_MIN_TIER = 3;
  if (!API_KEY) {
    // Boot without a key so introspection (initialize / tools/list) works for
    // registries and clients that probe the catalog before configuring auth
    // (e.g. Glama's Docker introspection check). Tool CALLS remain gated: the
    // request path only attaches Authorization when API_KEY is set, so a keyless
    // call hits the API's 401/403 and returns a clean "set THREADLINQS_API_KEY"
    // tool error. The Threadlinqs Intelligence MCP server stays a Purple-tier
    // feature (tier >= 3, $11.99/mo) — there is no free or anonymous data access.
    console.error("WARNING: THREADLINQS_API_KEY is not set — the server will start and expose its tool catalog, but every tool CALL will fail until a Purple/Gold key is configured.");
    console.error("Get a Purple/Gold API key (or start a 7-day Purple trial) at https://intel.threadlinqs.com/profile");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`Threadlinqs Intelligence MCP server v${SERVER_VERSION} running on stdio (no API key — introspection only)`);
    return;
  }
  try {
    const resp = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    // NB: startup verification NEVER exits the process — it only logs. Exiting
    // here breaks registry introspection probes (e.g. Glama) that build the image
    // and may inject a placeholder key to satisfy the "required" env var, then
    // send tools/list. The real access gate is server-side per endpoint (each
    // tool CALL 403s on an invalid/under-tier key), so a bad key at startup just
    // warns and the catalog stays introspectable.
    if (resp.status === 401 || resp.status === 403) {
      console.error("WARNING: THREADLINQS_API_KEY is invalid or expired — tool calls will fail until it is fixed. Get a new key at https://intel.threadlinqs.com/profile");
    } else if (resp.ok) {
      const me = (await resp.json().catch(() => null)) as { authenticated?: boolean; tier?: number } | null;
      if (!me || me.authenticated === false) {
        console.error("WARNING: THREADLINQS_API_KEY did not resolve to an account — tool calls will fail. Get a valid key at https://intel.threadlinqs.com/profile");
      } else {
        const tier = Number(me.tier) || 0;
        if (tier < PURPLE_MIN_TIER) {
          console.error(`WARNING: MCP data access requires Purple or Gold (tier >= 3); your key is tier ${tier}. Under-tier tool calls will be refused. Upgrade at https://threadlinqs.com/landing.html#pricing`);
        } else {
          console.error(`API key validated — Purple/Gold (tier ${tier}). All 54 tools available.`);
        }
      }
    } else {
      console.error(`WARNING: could not verify tier (HTTP ${resp.status}); continuing — server-side tier checks still apply.`);
    }
  } catch {
    console.error("WARNING: could not verify tier (network error); continuing — server-side tier checks still apply.");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Threadlinqs Intelligence MCP server v${SERVER_VERSION} running on stdio`);
  console.error(`API base: ${API_BASE}`);
  console.error("54 tools + 8 resources available (Purple/Gold tier >= 3 only)");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
