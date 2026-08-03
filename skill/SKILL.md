---
name: intelthreadlinqs-mcp-skill
description: >-
  Operate the Threadlinqs Intelligence MCP server — 73 threat-intelligence tools covering
  threats, detection rules in Splunk SPL / Microsoft KQL / Sigma, IOCs, threat actors,
  CVE/CWE enrichment, MITRE ATT&CK coverage and prediction, C2 infrastructure, the
  correlation graph, and STIX 2.1 / ATT&CK Navigator export. Use this skill WHENEVER the
  Threadlinqs, intelthreadlinqs or threadlinqs-intel MCP server is connected and the user
  asks about a threat, a CVE, an IOC, an IP or domain or file hash, a malware family, an
  offensive tool, a threat actor or APT group, an ATT&CK technique, a detection rule, a C2
  beacon, a daily debrief or the threat landscape — or wants a STIX bundle, an ATT&CK
  Navigator layer, or a firewall blocklist. It applies even when the user never says
  "Threadlinqs" and even when the question sounds like generic security research. It routes
  to the one-call composite tools instead of chaining five single-purpose calls, teaches the
  hunt query grammar for any "how many X by Y" aggregate, and encodes the tier gate, the
  response cap and the data caveats that keep answers honest. Read it BEFORE the first tool
  call in a Threadlinqs session, not after one fails.
---

# Threadlinqs Intelligence MCP

73 tools over a curated threat-intelligence corpus. This skill exists because the naive
path through those tools is expensive and often wrong: an agent that reaches for
`get_threat` and then chains four follow-ups is doing by hand what one composite tool does
in a single call, and an agent that guesses an enum value gets an empty result rather than
an error and reports "nothing found" when the answer was there all along.

Read this before your first call. The routing table below is the part that matters.

> **Tool names may be prefixed by your host.** Claude Code exposes
> `mcp__threadlinqs-intel__get_threat`, Claude Desktop exposes `get_threat`, the remote
> connector uses another prefix again. This document writes bare names — match by suffix.

## Access, in one paragraph

Tool **calls** require a Purple or Gold key (tier ≥ 3) in `THREADLINQS_API_KEY`.
Introspection over MCP (`tools/list`) is gated too, but the HTTP twins
`GET /mcp/catalog.json` and `GET /mcp.md` are public, which is how registries index the
server without a key. There is no free tier for the data. If you have no key, say so and
point at `https://intel.threadlinqs.com/profile` — new accounts get a 7-day Purple trial.
See `references/setup.md` for per-host install.

## Before your first call

1. Call `get_started` once. It returns the tool catalog, categories and tiering, and costs
   no database round-trip.
2. Call `hunt_schema` **only if** an aggregate question is coming — then cache it for the
   session. It is the field grammar for `hunt`, and you cannot write a valid query without it.
3. Call `get_engine_status` **only if** you are about to reason over correlation output. A
   stale engine is a caveat on every correlation answer you give.

Do not reflexively open with `get_platform_stats` + `list_threat_categories` + `health`.
That is three calls of ceremony before you have learned anything.

## Routing — what to call first

| You have / user asks | First call | Then, only if needed |
|---|---|---|
| Threat ID + a hunting or scoping question | `get_threat_hunting_bundle` | `get_threat_enrichment`, `get_detection_detail` |
| Threat ID, just want the record | `get_threat` | `get_threat_bundle` |
| 2–20 threat IDs | `bulk_get_threats` | — |
| Actor name or alias | `get_actor_intelligence` | `get_attribution_evidence`, `export_attack_navigator` |
| A name you are not sure resolves | `resolve_entity` | then the matching pivot below |
| An exact IOC value | `get_ioc_intelligence` | `get_ioc_blast_radius`, `get_ioc_dns`, `get_infrastructure_pivots` |
| An IOC substring / partial | `search_iocs` | — (narrow it; paging is not honored) |
| CVE ID | `get_cve_intelligence` | `get_cwe`, `bulk_get_cves` |
| "What should we patch first?" | `search_vulnerabilities` with `kev` / `epss_min` | `get_cve_intelligence` on the top few |
| Malware family | `get_malware_intelligence` | `resolve_entity` if the name is ambiguous |
| Offensive tool | `get_tool_intelligence` | `resolve_entity` |
| Named campaign | `get_campaign_intelligence` | `get_graph_campaigns` for engine-derived clusters |
| ATT&CK technique | `get_mitre_technique` | `predict_mitre_transitions`, `get_technique_rules` |
| "What do we detect / not detect?" | `get_mitre_coverage` → `get_mitre_gap_analysis` | `search_detections` |
| "Are these two threats related?" | `explain_correlation` | `get_correlation_path` |
| "What is around this entity?" | `get_entity_profile` | `get_correlation_subgraph` at **depth 1** |
| Any count / group-by / cross-type question | `hunt_schema` once → `hunt` | — |
| Conceptual question, keywords already failed | `search_corpus_semantic` | — |
| "What happened today?" | `get_daily_intel_bundle` | `list_debriefs` → `get_debrief` |
| "Block this" | `generate_c2_blocklist` | `get_c2`, `get_c2_dns_intel` |
| "Feed my TIP / SIEM" | `export_stix`, `export_attack_navigator`, `export_detection` | — |

### `hunt` vs `search_threats` — the highest-value rule here

Use **`hunt`** when the question contains a count, a grouping, or crosses observation types
("which actors use Cobalt Strike *and* have domain IOCs"). Scoped observables compile to a
threat-level subquery, which is exactly why cross-type questions work at all. Append
`| stats count by <field>` for aggregates.

Use **`search_threats`** when you want matching threat rows back with structured filters.

Counting rows yourself from repeated `search_threats` calls is wrong twice over: it burns
calls, and your count is wrong at page boundaries. Full grammar in `references/hunt-tlql.md`.

## Composite tools — one call instead of five

These exist specifically to collapse a chain. Reaching for the parts when a composite
covers the whole is the most common failure on this server.

| Instead of chaining | Call |
|---|---|
| `get_threat` → `get_similar_threats` → `get_threat_simulations` → `get_infrastructure_pivots` | `get_threat_hunting_bundle` |
| threat + simulations + transcripts | `get_threat_bundle` |
| `get_actor` + attribution + correlations | `get_actor_intelligence` |
| `search_iocs` → N× `get_threat` → N× `get_actor` | `get_ioc_intelligence` |
| `get_cve` + exploitation velocity + detection coverage | `get_cve_intelligence` |
| debrief + stats + recent threats + correlations | `get_daily_intel_bundle` |
| a loop of `get_threat` / `get_cve` over known IDs | `bulk_get_threats` / `bulk_get_cves` (≤ 20) |
| N× `search_threats` then counting the rows | `hunt … \| stats count by …` |

## Budget discipline

Responses are capped at **90,000 characters**. On overflow the payload ends with
`... [truncated: response exceeded 90000 chars — narrow your query`. Recognise that string
and escalate in this order:

1. add a filter, 2. lower `limit`, 3. switch to a narrower tool,
4. for graph calls lower `depth` / `limit_nodes` / `limit_edges`, or use `get_entity_profile`
   instead of `get_correlation_subgraph`.

Retrying the identical call after truncation just burns the same budget again.

**Paging is honored** on `search_threats`, `get_recent_threats`, `get_detections`,
`search_xscan_indicators`. It is **not** honored on `search_iocs`, `list_debriefs`,
`search_actors` — narrow the query instead of incrementing an offset that does nothing.

## Errors — both terminal

| Code | Meaning | Do |
|---|---|---|
| `-32001` | No key, or the key is invalid | Say so, link `https://intel.threadlinqs.com/profile`, **stop** |
| `-32002` | Authenticated but tier < 3 | Report the tier and the upgrade path, **stop** |

Neither is retryable, and neither gets better by trying a different tool. Do not walk the
catalog hoping one is ungated — none are.

An **empty result is not an error**, and on this server it is most often a *guessed enum*.
Categories, severities, C2 views, correlation engines, node types and seed types are all
closed vocabularies where a wrong value returns nothing silently. Call the corresponding
list tool first. Full vocabulary in `references/vocabularies.md`.

## Honesty rules

The corpus is opinionated about what it knows, and the skill is what stops you overclaiming.

- **Attribution.** `get_attribution_evidence` distinguishes a researched, cited assessment
  from a pending intake stub. A stub is **not** an attribution — never restate one as a
  finding. Say "unattributed, pending research".
- **Pivotal entities.** The betweenness score from `get_pivotal_entities` is an ego-bridge
  *heuristic*; the payload says so itself. It ranks candidates, it does not prove centrality.
- **OSINT.** Everything from `get_osint`, `get_osint_trends`, `search_xscan_indicators` and
  `get_community_campaigns` is community-sourced. It corroborates; it is never authoritative.
  Campaign labels there are upstream AI output. Keep it labelled as community-sourced rather
  than merging it into corpus findings.
- **DNS.** `get_ioc_dns` returns stored enrichment, never a live lookup. Say when it was seen.
- **Shared infrastructure.** Shared hosting and CDN ranges are not adversary infrastructure.
  Call that out rather than listing it as a pivot.
- **Correlation strength.** A shared-technique edge is not attribution. `explain_correlation`
  returns the evidence behind an edge — quote which signal carries the claim.

Fuller treatment in `references/data-caveats.md`.

## Reference files

| File | Read it when |
|---|---|
| `references/tools.md` | You need a tool's exact arguments and return shape (all 73, generated from the live catalog) |
| `references/hunt-tlql.md` | Any aggregate or cross-observable question |
| `references/recipes.md` | You want a proven end-to-end workflow |
| `references/vocabularies.md` | Before passing any category, severity, view, engine or type |
| `references/setup.md` | Installing, or diagnosing auth and connectivity |
| `references/data-caveats.md` | Before making a claim the data may not support |

## Resources and interactive widgets

Beyond tools, the server exposes MCP **resources** — `threadlinqs://stats`,
`threadlinqs://threats/recent`, `threadlinqs://briefing/landscape`, plus templates for
individual threats, CVEs and actors. Hosts that render MCP Apps also get interactive
`ui://` widgets (ATT&CK matrix, correlation graph, threat and actor dossiers, C2 treemap,
hunt results). Hosts that do not render them ignore them safely — never depend on a widget
for correctness, and always state the answer in text as well.

Prompt playbooks ship with the server too; call `prompts/list` to see what the connected
version offers, since the set grows between releases.
