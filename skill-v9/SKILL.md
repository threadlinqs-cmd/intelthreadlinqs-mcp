---
name: intelthreadlinqs-mcp-skill
description: >-
  Operate the Threadlinqs Intelligence MCP server: curated threat intelligence on threats,
  detection rules (Splunk SPL, Microsoft KQL, Sigma), IOCs, threat actors, malware, tools,
  campaigns, CVE/CWE, MITRE ATT&CK coverage, C2 infrastructure and community OSINT, with
  STIX 2.1, ATT&CK Navigator, rule-pack and blocklist exports. Use it WHENEVER the
  Threadlinqs, intelthreadlinqs or threadlinqs-intel MCP server is connected and the user
  asks about a threat, CVE, IOC, IP, domain, file hash, malware family, offensive tool,
  threat actor or APT group, ATT&CK technique, detection rule, C2 beacon, the daily brief
  or the threat landscape, or wants a file for a SIEM or TIP, even when the user never
  says "Threadlinqs". It maps each task to one of the server's {{tools.count}} tools, teaches the hunt
  grammar for counts and group-bys, and encodes the spend, locked-threat, free-plan and
  error rules. Read it before the first Threadlinqs tool call.
---

# Threadlinqs Intelligence MCP

{{tools.count}} tools over a curated corpus at `https://intel.threadlinqs.com/mcp` (server {{server.version}}).
Hosts may prefix names (`mcp__threadlinqs-intel__get_threat`): match by suffix. Every argument
is validated; an unknown argument or value is `invalid_argument`, so copy names from the schema.

## Route by what you hold

| You have / the user asks | Call | Then, if needed |
|---|---|---|
| "What is happening today?" | `brief` | `history:7` for a trend |
| A threat id | `get_threat {id}` | sections flow, similar, infrastructure |
| Several threat ids | `get_threat {id:"TL-…,TL-…"}` | lean rows; sections for up to 5 |
| Words or filters | `search_threats {q}` | `mode:"semantic"` if keywords miss |
| "How many / by X" | `hunt {query}` | `hunt {query:"?"}` for the grammar |
| An exact indicator | `get_ioc {value}` | include radius, dns, osint |
| Start of an indicator | `search_iocs {value}` | `match:"substring"` |
| An actor | `get_actor {name}` | `search_actors` to find one |
| Malware, tool, campaign | `get_entity {kind, name}` | `list_campaigns` |
| An uncertain name | `resolve_entity {name}` | then the row above |
| A CVE | `get_cve {id}` | `get_cwe {id}` |
| "What to patch first?" | `search_cves {kev:true, sort:"priority"}` | `get_cve` on the top few |
| A technique | `get_technique {id}` | include next, threats |
| "What do we not detect?" | `attack_coverage` | `search_detections {technique}` |
| Rule text | `get_detection {id}` | `export {kind:"detections", threat_id}` |
| "Are these related?" | `correlate {mode:"explain", a, b}` | `mode:"path"`, `graph` |
| C2 infrastructure | `c2` | `export {kind:"blocklist"}` |
| Community sightings | `osint` | label them unverified |
| A file for a SIEM or TIP | `export {kind}` | give the user the link |
| Plan, balance, prices | `account` | |
| Is the data fresh? | `status` | before trusting correlation or C2 |

## Rules

1. **Spending.** Calls spend the account's TL Creds: a threat's gated content unlocks once (0 when
   held); correlation, actor, IOC, DNS and OSINT reads take a day pass per tool per Toronto day;
   semantic search costs per call; keyword search and lean rows are free. Descriptions and
   `meta.spend` say which. On `confirmation_required`, ask the user and repeat with
   `confirm:true` only if they agree; never add it yourself.
2. **Locked or capped: stop.** `credits_required`, `api_cap_reached` or `locked:true`: tell the user
   what `unlock` or `error.details` says (cost, `reset_at`). Retrying or switching tools does not help.
3. **Retry only when `error.retryable` is true**, once, after `retry_after_s`. Avoid parallel bursts.
4. **Follow the envelope.** Pass `page.next_cursor` back as `cursor`; `meta.truncated` names what
   was cut and how to get it. `page.returned` is not the total.
5. **Count with `hunt`** and `count_distinct(threat)`, never by paging `search_threats`.
6. **Empty is not an error**: usually a misspelt filter. Normalise with `resolve_entity` first.
7. **Say what the data is.** A feed label is not an attribution (`actor.assessment.state`);
   correlation is a machine lead; OSINT is unverified; DNS is stored; quote stale `meta.freshness`.

## Access

Purple and Gold: everything. A free account (verified email): {{free.daily_calls}} tool calls a day, some
refused up front. A `tla_` agent key works once a human claims it. `-32001` and `-32002` are
terminal. See `references/setup.md`.

## Views

{{views.count}} MCP Apps views: {{views.list}}. Hosts that do not render them ignore them; always
answer in text too.

## References

`recipes-threats.md` (triage a threat, scope an indicator) · `recipes-hunt-detections.md` (counts,
coverage, rules) · `recipes-actors.md` (actors, malware, campaigns, attribution, correlation) ·
`recipes-vulns-exports.md` (CVEs, exports, C2, brief) · `hunt-cheatsheet.md` · `caveats.md`
(results, errors, locks, cache, prices) · `setup.md` (connect, plans, agent keys) ·
`legacy-names.md` (old tool names that still work), all under `references/`.
