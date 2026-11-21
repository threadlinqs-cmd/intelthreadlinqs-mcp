# intelthreadlinqs-mcp

> Threat intelligence MCP server for IOC enrichment, detection rules (Sigma, SPL, KQL) and MITRE ATT&CK. Every threat comes with one complete detection in Splunk SPL, Microsoft KQL and Sigma, free for everyone; a free account adds daily TL Creds to unlock the rest. The MCP server needs an API key or an OAuth sign-in on every call; Purple and Gold have full access.
>
> MCP server for [Threadlinqs Intelligence](https://intel.threadlinqs.com): <!--count:tools-->25<!--/count--> tools and <!--count:prompts-->26<!--/count--> analyst-playbook prompts across threat intelligence, detections, IOCs, threat actors, MITRE attack-chains, C2 infrastructure and correlations. Drop-in for Claude Code, Claude Desktop, Cursor, and any MCP-compatible client.

[![npm version](https://img.shields.io/npm/v/intelthreadlinqs-mcp.svg)](https://www.npmjs.com/package/intelthreadlinqs-mcp)
[![Node](https://img.shields.io/node/v/intelthreadlinqs-mcp.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What changed in 9.0.0

This package is a thin stdio proxy over the platform's remote `/mcp` endpoint, and 9.0.0 follows the platform's move to MCP v9.

- **A shorter tool list: <!--count:tools-->25<!--/count--> tools.** Each tool covers a family through a `view`, `include` or `sections` argument (`get_threat` takes sections, `export` takes a `kind`, `c2` takes a `view`). Results are bounded and normalised, lists page with `cursor`, and errors are tool results with a stable `code`, `retryable` and `retry_after_s`.
- **Every earlier tool name still works.** Every tool name from 8.x (and the v7 names this package aliased) stays callable. They are no longer listed: `tools/list` shows the current tools only. A name that has no new equivalent (simulations, transcripts, technique rules, ATLAS, flow-similar, threat level and a few more) is a *legacy name, still callable, not listed*; it answers as before.
- **The tool list is whatever the platform serves.** The proxy asks the platform for `tools/list` on every start, so it follows the platform without a new release. The bundled catalog is only the offline fallback (see Architecture).
- **It works against both platform surfaces.** The proxy sends `Accept: application/json, text/event-stream` and reads either a plain JSON answer or a Server-Sent-Events answer, so it keeps working while the platform serves the earlier surface or the current one.
- **Failures keep their detail.** A refused call keeps the platform's own code, data and retry hint, and the proxy adds the remedy: a missing or rejected key, an agent key nobody has claimed yet, an unverified email, the free plan switched off, or a plan that does not cover the call.
- **The proxy identifies itself** with `User-Agent: intelthreadlinqs-mcp/<version>` (the package name and version, nothing about you or your machine).

## What this gives your AI agent

- **Curated threats** with severity, attribution, CVE/CWE and MITRE mapping
- **Detection rules** in Splunk SPL, Microsoft KQL and Sigma YAML
- **IOCs** (IPs, domains, hashes, URLs, behavioral) with the threats and actors behind them
- **Threat actors** with TTP profiles and cross-actor infrastructure links
- **Live C2 beacons** with watermark clustering and operator attribution
- **Daily intelligence briefs** and correlation analytics
- **MITRE attack-chain prediction** from observed technique transitions

Corpus sizes change daily; ask the `status` tool, or see `GET /api/v1/stats` on the platform.

## Remote (no install)

The same server runs at **`https://intel.threadlinqs.com/mcp`** (MCP Streamable HTTP). Sign in with OAuth, or send `Authorization: Bearer tl_...` with an API key. Nothing to install and no Node needed.

- **claude.ai and Claude Desktop:** Settings > Connectors > Add custom connector, paste `https://intel.threadlinqs.com/mcp`, then sign in.
- **Claude Code:**

  ```bash
  claude mcp add --transport http threadlinqs-intel https://intel.threadlinqs.com/mcp
  # or with an API key instead of OAuth:
  claude mcp add --transport http threadlinqs-intel https://intel.threadlinqs.com/mcp --header "Authorization: Bearer tl_..."
  ```

- **Cursor** (`.cursor/mcp.json`):

  ```json
  {"mcpServers":{"threadlinqs-intel":{"url":"https://intel.threadlinqs.com/mcp","headers":{"Authorization":"Bearer tl_..."}}}}
  ```

- **VS Code** (`.vscode/mcp.json`, signs in with OAuth):

  ```json
  {"servers":{"threadlinqs-intel":{"type":"http","url":"https://intel.threadlinqs.com/mcp"}}}
  ```

- **ChatGPT:** in developer mode, add a connector with the same URL and sign in with OAuth (ChatGPT cannot send a custom Bearer header). *Pending verification:* this path has not been confirmed end to end yet.

## Quick install (local stdio proxy)

```bash
# No install needed — npx will fetch it
npx -y intelthreadlinqs-mcp@latest
```

### Claude Code

```bash
claude mcp add threadlinqs-intel \
  -e THREADLINQS_API_KEY=tl_your_key_here \
  -- npx -y intelthreadlinqs-mcp@latest
```

The `-e THREADLINQS_API_KEY` is **required in practice**. Purple and Gold keys have full access; a free account (verified email) has a daily allowance of calls. The server starts without a key and exposes its tool catalog so clients and registries can introspect it, but **tool calls are gated server-side**: with no valid key they return an authentication error instead of data. There is no anonymous access to the data.

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "threadlinqs-intel": {
      "command": "npx",
      "args": ["-y", "intelthreadlinqs-mcp@latest"],
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
      "args": ["-y", "intelthreadlinqs-mcp@latest"],
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
      "args": ["-y", "intelthreadlinqs-mcp@latest"],
      "env": {
        "THREADLINQS_API_KEY": "tl_your_key_here"
      }
    }
  }
}
```

## Getting an API key

Sign up at [intel.threadlinqs.com](https://intel.threadlinqs.com), verify your email, and head to **Profile → API Key**. Signing up alone gives you the free plan; Purple removes the daily call limit and the free-plan exclusions. A **Purple trial** is offered at checkout on the pricing page (a card is required). Prices are on the [pricing page](https://threadlinqs.com/#pricing).

## Access

Purple and Gold have full access to every tool. The `account` tool answers what your plan is, what is left today and what each paid call costs.

**Free plan.** A free account (verified email) has a daily allowance of calls with the full data view, and each call you make spends one of them (a call that fans out inside the platform still spends one). Daily briefs and the STIX, ATT&CK Navigator and detection-pack exports are refused up front, before anything is spent; single lookups stay open. The C2 blocklist export runs but returns only its summary: downloading the file needs Purple or Gold. When the allowance is used up the next call returns a tool result with `isError: true` and a `rate_limited` error (`details.code` is `free_mcp_limit_reached`) that says when it renews. MCP resources with data stay Purple or Gold.

**Agent keys.** A self-registered `tla_` agent key opens the free REST routes only. Once a person claims it with its `claim_url` (request one with `POST /api/v1/agents/claim-link`), it reaches `/mcp` and acts with that person's plan. Until then `/mcp` answers `-32002` with `claim_required`, and the proxy tells you how to get it claimed.

**Failures.** The proxy reports a protocol-level refusal with the platform's message plus a remedy, and puts the machine-readable fields in the result's `_meta["threadlinqs/error"]`: `-32001` (HTTP 401) is a missing or rejected key; `-32002` (HTTP 403) is a plan or account-state refusal (unclaimed agent key, unverified email, free plan off, plan too low). A refusal of one call (`credits_required`, `api_cap_reached`, `rate_limited`, `tier_required`) arrives as an ordinary tool result and is passed through unchanged, including `retryable` and `retry_after_s`.

Every call spends the account's TL Creds like an API key (creds per threat unlocked, daily creds first and then earned; HTTP 402 `credits_required` or a locked threat means the account is out of creds for that call, and HTTP 429 `api_cap_reached` means the daily spending cap is reached until its `reset_at` time). Prices and allowances: https://threadlinqs.com/tl-creds

## The tools

The list below is generated from the catalog bundled with this release; the live `tools/list` is authoritative.

<!--tools:begin-->
| tool | what it does |
|---|---|
| `account` | Plan, TL Creds balance, today’s API/MCP spend and the platform’s prices (threat unlock, day passes, per-call tools, exports). |
| `attack_coverage` | Detection coverage against ATT&CK. |
| `brief` | Start here for "what is happening": current threat posture (0–25 score with its drivers), the debrief’s theme, counts by severity and its threats, most severe first. |
| `c2` | Command-and-control intelligence: view="summary" (counts and feed health), beacons, configs, operators, watermarks, correlations, timeline, or dns (which domains ride on each beacon IP, with dedicated / mixed /... |
| `correlate` | Relate threats with evidence. mode="similar": neighbours of one threat (blended score, falls back to attack-flow order for new threats). |
| `export` | Package intelligence as a file for a SIEM or TIP: kind="stix" (STIX 2.1 bundle for a threat, actor or CVE), "navigator" (ATT&CK Navigator layer for an actor), "detections" (all rules of a threat in one spl/kql/sigma... |
| `get_actor` | Profile of one threat actor by name or alias: identity, counts, and by default recent threats, tactic profile and arsenal. |
| `get_cve` | One CVE (or up to 20 comma-separated ids): description, CVSS, EPSS, CISA KEV status with dates, patch availability and linked threats. |
| `get_cwe` | One weakness class: definition, likelihood of exploit, consequences, mitigations by phase, and the corpus CVEs and threats that carry it (top by KEV then CVSS). |
| `get_detection` | One detection with its rule text, ready to deploy: metadata, ATT&CK mapping, data sources, false positives and tuning notes. |
| `get_entity` | Pivot on a malware family, an offensive tool or a named campaign: the threats that involve it, actors, techniques and related indicators. |
| `get_ioc` | Everything about one exact indicator: threats carrying it, with context, actors behind them, first seen, and a consensus verdict (confidence, rarity, trend). |
| `get_technique` | One ATT&CK technique (T1190, T1059.001, AML.T0010): authoritative name, tactics, mitigations, data sources and how many corpus threats use it. |
| `get_threat` | Open a threat, or up to 20 comma-separated ids as free lean rows. |
| `graph` | Explore the entity graph. view="profile": what surrounds one entity (threat, technique, actor, ioc, cve). |
| `hunt` | SIEM-style query over the joined observation index — the tool for counts, group-bys and questions that cross types ("threats using tool A that also have IOC type B"). |
| `list_campaigns` | Campaign rosters. source="named" (default): operations named in reporting, with actors, nations, date range and member threats; each member says whether the campaign name really occurs in that threat (`supported`). |
| `osint` | Community-sourced signals (public OSINT feed): view="trends" — volume, movers, lead time versus the curated corpus; view="threat" — community sightings for one threat. |
| `resolve_entity` | Normalise an actor, malware, tool, sector, region, technique or campaign name or alias to its canonical form ("fancy bear" → APT28). |
| `search_actors` | List threat actors with threat counts, filtered by name fragment, tool, malware family, targeted sector or nation. |
| `search_cves` | Query the live CVE feed (CVSS, EPSS, CISA KEV, public PoC/exploit, nuclei template). |
| `search_detections` | Find detection rules (Splunk SPL, Microsoft KQL, Sigma) by keyword, threat, ATT&CK technique, language or severity. |
| `search_iocs` | Find indicators by value (IP, domain, hash, URL, file name), newest first, grouped per indicator with the threats that carry it. |
| `search_threats` | Find threats in the catalog. No arguments = newest first. |
| `status` | Health and freshness in a few hundred bytes: server version, corpus counts, which correlation engines are stale, graph-pipeline state and feed outages. |
<!--tools:end-->

Legacy names (the 8.x names and the v7 names before them) stay callable and are not listed. Where one has a direct equivalent, the platform answers it through the new tool and says so in the result's `meta.deprecated`.

## Agent skill

A portable skill that teaches any MCP client how to route across these tools — which tool to
call first, the `hunt` query grammar, the response budget, and the data caveats that keep
answers honest. Generated from the live catalog, so its tool reference cannot drift.

- **Single file** (paste into any assistant): <https://intel.threadlinqs.com/mcp/skill.md>
- **Bundle** (`SKILL.md` + `references/`, for Claude Desktop / API skill upload):
  <https://intel.threadlinqs.com/skills/intelthreadlinqs-mcp-skill.zip>
- Also in this repo under [`skill-v9/`](skill-v9/), and linked from
  <https://intel.threadlinqs.com/mcp>.

## Prompts — <!--count:prompts-->26<!--/count--> analyst playbooks

Prompts are pre-built workflows that orchestrate the tools for you. Rather than working out which tools to chain, invoke a playbook and the agent gets an ordered, argument-correct plan.

<!--prompts:begin-->
| prompt | what it does |
|---|---|
| `assess_exposure` | What is covered and what is not for a CVE, an actor or a technique. |
| `build_c2_blocklist` | A firewall-ready list of command-and-control infrastructure. |
| `bulk_enrich` | Enrich a list of threat or CVE ids in as few calls as possible. |
| `daily_brief` | What changed today and what to act on first. |
| `explain_link` | Why two threats are related, with the evidence. |
| `export_for_tooling` | STIX, ATT&CK Navigator or a rule pack for downstream tools. |
| `hunt_corpus` | Answer a "how many X by Y" question with one aggregate query. |
| `hunt_ioc` | Scope one IP, domain, hash or URL. |
| `investigate_threat` | Full picture of one threat: chain, indicators, detections, neighbours. |
| `malware_dossier` | Profile a malware family or offensive tool. |
| `map_campaign` | Members, actors, shared infrastructure and timeline of a campaign. |
| `map_detections_to_mitre` | Which techniques of a threat have rules, and which do not. |
| `orient` | What this server holds and how to query it. |
| `osint_sweep` | Add community sightings to what the corpus knows. |
| `period_review` | Review one day, or the last two weeks, of intelligence. |
| `pivot_infrastructure` | Follow an indicator or a threat across DNS and shared hosting. |
| `plan_purple_team` | Steps to emulate from a threat, and the rule each should trigger. |
| `platform_status` | Corpus health, engine freshness and feed outages. |
| `predict_next_move` | Likely next (or previous) techniques after an observed one. |
| `profile_actor` | Who they are, how they operate, what to watch. |
| `research_question` | Open-ended question: semantic search, then verify in the records. |
| `review_attribution` | Is the actor on a threat evidence-backed or only a feed label? |
| `review_detection_gaps` | Where coverage is weakest against real exposure. |
| `sweep_vulnerabilities` | Triage the CVE feed by exploitability, not by CVSS alone. |
| `triage_cve` | Is it exploited, are we covered, what to do. |
| `write_detection` | Start from an existing rule and tune it for an environment. |
<!--prompts:end-->

## Privacy, support and data handling

- **What the stdio proxy sends:** your API key (as a Bearer token) and the tool arguments of each call, to `https://intel.threadlinqs.com` only (or the `THREADLINQS_API_URL` you set), with `User-Agent: intelthreadlinqs-mcp/<version>`. It also reads the public catalog (`/mcp/catalog.json`) there, without the key.
- **What it keeps:** nothing. It stores nothing on disk and sends no telemetry of its own.
- **Policies:** [Privacy](https://threadlinqs.com/privacy) · [Terms](https://threadlinqs.com/terms).
- **Support:** open an issue at <https://github.com/threadlinqs-cmd/intelthreadlinqs-mcp/issues>.

## Full tool catalog

For the complete list of tools with parameters and example invocations, see the [interactive MCP documentation page](https://intel.threadlinqs.com/mcp).

## Architecture

- **Transport:** stdio (local subprocess), proxying JSON-RPC to the platform's Streamable-HTTP `/mcp`.
- **Auth:** `THREADLINQS_API_KEY` environment variable (Bearer token to the platform).
- **Runtime:** Node ≥18
- **SDK:** `@modelcontextprotocol/sdk@^1.26.0`
- **Wire:** the proxy speaks MCP `2025-11-25` to the platform (which also serves `2026-07-28`) and to your host, sends `Accept: application/json, text/event-stream`, and parses a JSON or an SSE answer by content type. Retries: 429 and 5xx only, honouring `Retry-After` or `retry_after_s` up to a few seconds, then reporting how long to wait.
- **Access gate:** enforced server-side on every call (see Access). The server starts without a key so the catalog stays introspectable.
- **Introspection has three tiers:** authenticated `tools/list` (live, and the only authority on what is listed) → the public `/mcp/catalog.json` → a **catalog snapshot bundled in the package**. The first two need network; the third does not, so `tools/list` returns a real catalog even in a fully network-isolated sandbox instead of an empty array (which is indistinguishable from a server with no tools, and is why registry scanners once indexed this server with zero tools). A tool list that did not come from the live call is stamped in each tool's `_meta` (`threadlinqs/catalog_source`) and logged on stderr.

  Maintainers: `npm run sync:catalog -- --local` rebuilds the snapshot, and every count and table in this README, from the v9 package in this repository; `npm run sync:catalog -- --url` does the same from the deployed platform and refuses a catalog whose server version is not this package's. Release order: deploy the platform, `sync:catalog -- --url`, `npm run test:catalog`, publish, then rebuild the `.mcpb`.

## Links

- 📖 [Interactive docs + try-it](https://intel.threadlinqs.com/mcp)
- 🔑 [Get an API key](https://intel.threadlinqs.com/profile)
- 💳 [Pricing](https://threadlinqs.com/#pricing)
- 🐛 [Issues](https://github.com/threadlinqs-cmd/intelthreadlinqs-mcp/issues)
- 📜 [Changelog](https://intel.threadlinqs.com/changelog)

## License

MIT © Threadlinqs
