# intelthreadlinqs-mcp

> MCP server for [Threadlinqs Intelligence](https://intel.threadlinqs.com) — 73 tools and 25 analyst-playbook prompts across threat intelligence, detections, IOCs, threat actors, MITRE attack-chains, C2 infrastructure, and Purple-tier composite intelligence. Drop-in for Claude Code, Claude Desktop, Cursor, and any MCP-compatible client.

[![npm version](https://img.shields.io/npm/v/intelthreadlinqs-mcp.svg)](https://www.npmjs.com/package/intelthreadlinqs-mcp)
[![Node](https://img.shields.io/node/v/intelthreadlinqs-mcp.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What this gives your AI agent

- **1,700+ threats** with full metadata, severity, attribution, CVE/CWE, MITRE
- **16,000+ detection rules** in Splunk SPL, Microsoft KQL, and Sigma YAML
- **47,000+ IOCs** (IPs, domains, hashes, URLs, behavioral)
- **500+ threat actors** with TTPs profiles and cross-actor infrastructure links
- **140+ live C2 beacons** (Cobalt Strike) with watermark clustering + operator attribution
- **Daily intelligence debriefs** + 7-engine correlation analytics
- **MITRE attack-chain prediction** based on 4,271 observed technique transitions

## Quick install

```bash
# No install needed — npx will fetch it
npx -y intelthreadlinqs-mcp
```

### Claude Code

```bash
claude mcp add threadlinqs-intel \
  -e THREADLINQS_API_KEY=tl_your_key_here \
  -- npx -y intelthreadlinqs-mcp
```

The `-e THREADLINQS_API_KEY` is **required in practice**. The Threadlinqs Intelligence MCP server is a **Purple-tier feature** — it checks your key's tier at startup and warns if it is missing, invalid, or below Purple. The server still starts and exposes its tool catalog so clients and registries can introspect it, but **tool calls are gated server-side**: without a Purple or Gold key (tier ≥ 3) they return an `Access denied` error instead of data. There is no free or anonymous access to gated intelligence.

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "threadlinqs-intel": {
      "command": "npx",
      "args": ["-y", "intelthreadlinqs-mcp"],
      "env": {
        "THREADLINQS_API_KEY": "tl_your_key_here"
      }
    }
  }
}
```

### Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "threadlinqs-intel": {
      "command": "npx",
      "args": ["-y", "intelthreadlinqs-mcp"],
      "env": {
        "THREADLINQS_API_KEY": "tl_your_key_here"
      }
    }
  }
}
```

### VS Code

`.vscode/mcp.json`:

```json
{
  "servers": {
    "threadlinqs-intel": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "intelthreadlinqs-mcp"],
      "env": {
        "THREADLINQS_API_KEY": "tl_your_key_here"
      }
    }
  }
}
```

## Getting an API key

Sign up at [intel.threadlinqs.com](https://intel.threadlinqs.com), verify your email, and head to **Profile → API Key**. Note that signing up alone lands you on Blue (tier 1) — MCP tool calls need tier ≥ 3, so they return an under-tier error until you upgrade. A **7-day Purple free trial** is offered at checkout on the pricing page.

## Access — Purple tier only

The MCP server is a **Purple-tier feature**: **all 73 tools require a Purple or Gold subscription (tier ≥ 3)**. The server checks your key's tier at startup and warns when it is missing, invalid, or below Purple — it still starts and lists its tools so clients can introspect the catalog, but the tier is enforced server-side on every call, so gated tools return `Access denied` rather than data. There is no free or anonymous access to gated intelligence.

| Tier | Price | MCP access |
|---|---|---|
| **Purple** | $11.99/mo | ✅ All 73 tools |
| **Gold** | Custom | ✅ All 73 tools (enterprise — contact sales) |
| Lower tiers | — | ❌ No MCP access (the public website + REST API keep their own free Blue tier) |

A **7-day Purple free trial** is available at checkout on the pricing page — it is not granted by signup alone. Tool calls enforce the tier server-side and return a structured 403 if your subscription lapses.

## v4.3 flagship tools (Purple tier)

The composite tools are the reason most people upgrade to Purple — each one replaces 5–7 single-purpose MCP calls.

### `get_threat_hunting_bundle` ⭐

**Input:** `threat_id` (e.g. `"TL-2026-0599"`)

**Returns:** complete hunt dossier in one shot — threat metadata, full IOC list, SPL/KQL/Sigma detection queries, similar threats, simulation commands, and cross-threat infrastructure pivots. The single most useful tool in the platform.

### `get_actor_intelligence`

**Input:** actor `name` (e.g. `"Lazarus Group"`, `"APT29"`)

**Returns:** comprehensive adversary picture — actor profile, attributed threats, MITRE techniques, IOCs (200 cap), detection rules (100 cap), activity timeline, active C2 infrastructure correlated to the actor, and cross-actor shared entities.

### `get_ioc_intelligence`

**Input:** `ioc_value` (IP, domain, hash, URL)

**Returns:** every threat that touches the IOC + actor attribution + DNS enrichment trail + cross-IOC infrastructure pivots + consensus confidence score across 7 external feeds (Pulsedive, GreyNoise, YARAify, MalwareBazaar, URLScan, VxVault, OpenPhish). The *"I found this in a log — tell me everything"* workflow.

### `get_cve_intelligence`

**Input:** `cve_id` (e.g. `"CVE-2024-3400"`)

**Returns:** CVE detail + linked threats + EPSS exploitation velocity + KEV status + detection coverage % + available attack simulations + first-weaponization timeline.

### `get_mitre_gap_analysis`

**Input:** optional `tactic` filter, `limit`

**Returns:** prioritized list of MITRE techniques without detection coverage, sorted by debt score (threat exposure + KEV count + EPSS). Each entry includes example threats and recommended detection types. Answers *"what should I write detections for next?"*

### `predict_mitre_transitions`

**Input:** `technique_id` (e.g. `"T1566"`), `top_n`, `direction` (`forward` | `reverse`)

**Returns:** ranked next-technique predictions with probability and observation count, plus example threats showing the chain. Built from 4,271 observed transitions across the corpus.

### `generate_c2_blocklist`

**Input:** none.

**Returns:** firewall-ready blocklist of active C2 IPs with country, ASN, version, watermark, and last-seen metadata. Currently tracking Cobalt Strike beacons. For operator clustering call `get_c2`, and for unmasked C2 domains `get_c2_dns_intel`.

## Specialized tools

- **`search_actors`** — Find threat actors by name, alias, nation-state, or motivation.
- **`get_actor`** — Full actor dossier in a single call.
- **`get_similar_threats`** — Precomputed-similarity matches by shared TTPs, IOC overlap, and same-actor attribution.

## Agent skill

A portable skill that teaches any MCP client how to route across these tools — which tool to
call first, the `hunt` query grammar, the response budget, and the data caveats that keep
answers honest. Generated from the live catalog, so its tool reference cannot drift.

- **Single file** (paste into any assistant): <https://intel.threadlinqs.com/mcp/skill.md>
- **Bundle** (`SKILL.md` + `references/`, for Claude Desktop / API skill upload):
  <https://intel.threadlinqs.com/skills/intelthreadlinqs-mcp-skill.zip>
- Also in this repo under [`skill/`](skill/), and linked from
  <https://intel.threadlinqs.com/mcp>.

## Prompts — 25 analyst playbooks

Prompts are pre-built workflows that orchestrate the tools for you. Rather than working out which of 73 tools to chain, invoke a playbook and the agent gets an ordered, argument-correct plan. Between them they reach **every tool on the server**, so an agent that only reads `prompts/list` still finds the whole surface.

| Playbook | What it does |
|---|---|
| `orient` | Start here — catalog, corpus shape, categories, TLQL grammar |
| `triage_cve` | CVE end-to-end: severity, exploitation, exposure, remediation |
| `profile_actor` | Actor dossier: TTPs, targeting, attribution confidence |
| `hunt_ioc` | Indicator → linked threats, blast radius, blocking action |
| `hunt_corpus` | Aggregate questions in TLQL over the hunt index |
| `research_question` | Open-ended research via semantic corpus search |
| `map_detections_to_mitre` | Map a threat's SPL/KQL/Sigma to ATT&CK, flag gaps |
| `review_detection_gaps` | Highest-value detection debt, ranked by exposure |
| `write_detection` | Draft a deployable rule grounded in corpus logic |
| `predict_next_move` | Forecast the next (or preceding) ATT&CK techniques |
| `explain_link` | Why two threats are linked, with the evidence |
| `map_campaign` | Campaign members, shared infra, pivotal entities |
| `review_attribution` | Audit whether an attribution is evidence-backed |
| `pivot_infrastructure` | Pivot across DNS, hosting and adjacent infrastructure |
| `malware_dossier` | Profile a malware family or offensive tool |
| `build_c2_blocklist` | Firewall-ready C2 blocklist with operator clustering |
| `osint_sweep` | Fold community signal in; surface coverage lead time |
| `sweep_vulnerabilities` | Triage by exploitability, not CVSS alone |
| `plan_purple_team` | Simulations paired with the detections they should trip |
| `export_for_tooling` | STIX 2.1, ATT&CK Navigator, SIEM-ready rules |
| `bulk_enrich` | Batch a list of threat/CVE ids without N round-trips |
| `assess_exposure` | Covered vs uncovered for a CVE, actor or technique |
| `daily_brief` | Today's posture, top new threats, daily theme |
| `period_review` | Review a day or span from the debrief archive |
| `platform_status` | Corpus health, engine state, enrichment completeness |

## Full tool catalog

For the complete list of 73 tools with parameters and example invocations, see the [interactive MCP documentation page](https://intel.threadlinqs.com/mcp).

## Architecture

- **Transport:** stdio (local subprocess)
- **Auth:** `THREADLINQS_API_KEY` environment variable (Bearer token to the worker API)
- **Runtime:** Node ≥18
- **SDK:** `@modelcontextprotocol/sdk@^1.26.0`
- **Backend:** Cloudflare Workers + D1 (multi-region)
- **Purple gate:** the server checks the API key's tier at startup and warns if it is missing, invalid, or below Purple/Gold (tier ≥ 3) — it starts regardless so the tool catalog stays introspectable; the gate itself is enforced server-side on every tool call (structured 403 on lapse or under-tier)
- **Introspection has three tiers** (since 8.1.0): authenticated `tools/list` → the public `/mcp/catalog.json` → a **catalog snapshot bundled in the package**. The first two need network; the third does not, so `tools/list` returns the real catalog even in a fully network-isolated sandbox. Previously that case returned an empty array — not an error, an empty list, which is indistinguishable from a server with no tools, and is why registry scanners indexed this server with zero tools.

  Maintainers: regenerate the snapshot with `npm run sync:catalog` **after** deploying the worker, since the worker owns the tool and prompt registries. `npm run test:catalog` fails the build when the snapshot and the live catalog disagree, and it runs on `prepublishOnly`.

## Links

- 📖 [Interactive docs + try-it](https://intel.threadlinqs.com/mcp)
- 🔑 [Get an API key](https://intel.threadlinqs.com/profile)
- 💳 [Pricing](https://threadlinqs.com/landing.html#pricing)
- 🐛 [Issues](https://github.com/threadlinqs-cmd/intelthreadlinqs-mcp/issues)
- 📜 [Changelog](https://intel.threadlinqs.com/changelog)

## License

MIT © Threadlinqs
