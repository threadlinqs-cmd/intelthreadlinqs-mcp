# intelthreadlinqs-mcp

> MCP server for [Threadlinqs Intelligence](https://intel.threadlinqs.com) — 49 tools across threat intelligence, detections, IOCs, threat actors, MITRE attack-chains, C2 infrastructure, and Purple-tier composite intelligence. Drop-in for Claude Code, Claude Desktop, Cursor, and any MCP-compatible client.

[![npm version](https://img.shields.io/npm/v/intelthreadlinqs-mcp.svg)](https://www.npmjs.com/package/intelthreadlinqs-mcp)
[![Node](https://img.shields.io/node/v/intelthreadlinqs-mcp.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What this gives your AI agent

- **583+ threats** with full metadata, severity, attribution, CVE/CWE, MITRE
- **5,704+ detection rules** in Splunk SPL, Microsoft KQL, and Sigma YAML
- **16,500+ IOCs** (IPs, domains, hashes, URLs, behavioral)
- **334 threat actors** with TTPs profiles and cross-actor infrastructure links
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

The `-e THREADLINQS_API_KEY` is **required**. The Threadlinqs Intelligence MCP server is a **Purple-tier feature** — it verifies your key is Purple or Gold (tier ≥ 3) at startup and refuses to start otherwise. There is no free or anonymous mode.

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

Sign up at [intel.threadlinqs.com](https://intel.threadlinqs.com), verify your email, and head to **Profile → API Key**. New accounts get a **7-day Purple-tier free trial** that unlocks all 49 tools.

## Access — Purple tier only

The MCP server is a **Purple-tier feature**: **all 49 tools require a Purple or Gold subscription (tier ≥ 3)**. The server verifies your key's tier at startup and refuses to run otherwise — there is no free or anonymous mode.

| Tier | Price | MCP access |
|---|---|---|
| **Purple** | $11.99/mo | ✅ All 49 tools |
| **Gold** | Custom | ✅ All 49 tools (enterprise — contact sales) |
| Lower tiers | — | ❌ No MCP access (the public website + REST API keep their own free Blue tier) |

New accounts get a **7-day Purple-tier free trial** that unlocks all 49 tools. Tool calls also enforce the tier server-side and return a structured 403 if your subscription lapses.

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

### `predict_attack_path`

**Input:** `technique_id` (e.g. `"T1566"`), `top_n`, `direction` (`forward` | `reverse`)

**Returns:** ranked next-technique predictions with probability and observation count, plus example threats showing the chain. Built from 4,271 observed transitions across the corpus.

### `generate_c2_blocklist`

**Input:** optional `framework`, `since_days` (default 30, max 365), `format` (`cidr` | `hosts` | `plain`)

**Returns:** firewall-ready blocklist of active C2 IPs with country, ASN, version, watermark, and last-seen metadata. Currently tracking Cobalt Strike beacons; framework filter is forward-compatible.

## Specialized tools

- **`search_actors`** — Find threat actors by name, alias, nation-state, or motivation.
- **`get_actor_profile`** — Full actor dossier in a single call.
- **`get_similar_threats`** — Precomputed-similarity matches by shared TTPs, IOC overlap, and same-actor attribution.

## Full tool catalog

For the complete list of 49 tools with parameters and example invocations, see the [interactive MCP documentation page](https://intel.threadlinqs.com/mcp).

## Architecture

- **Transport:** stdio (local subprocess)
- **Auth:** `THREADLINQS_API_KEY` environment variable (Bearer token to the worker API)
- **Runtime:** Node ≥18
- **SDK:** `@modelcontextprotocol/sdk@^1.26.0`
- **Backend:** Cloudflare Workers + D1 (multi-region)
- **Purple gate:** the server verifies the API key is Purple/Gold (tier ≥ 3) at startup and refuses to start otherwise; tool calls also enforce the tier server-side (structured 403 on lapse)

## Links

- 📖 [Interactive docs + try-it](https://intel.threadlinqs.com/mcp)
- 🔑 [Get an API key](https://intel.threadlinqs.com/profile)
- 💳 [Pricing](https://threadlinqs.com/landing.html#pricing)
- 🐛 [Issues](https://github.com/threadlinqs-cmd/intelthreadlinqs-mcp/issues)
- 📜 [Changelog](https://intel.threadlinqs.com/changelog)

## License

MIT © Threadlinqs
