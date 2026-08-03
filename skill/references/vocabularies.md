# Controlled vocabularies — every value you must not guess

Tool names here are bare. Hosts may prefix them (`mcp__threadlinqs-intel__search_threats`)
— match by suffix.

Every tool call needs tier ≥ 3 (Purple/Gold). `-32001` = missing/invalid key, `-32002` =
authenticated but under-tier. Both terminal — surface the upgrade path, do not retry.

## The single most misleading failure mode on this server

**A wrong enum value almost never errors. It returns an empty, HTTP-200, well-formed
result.**

Most filters compile to `WHERE col = ?`. A value that does not exist in the column matches
zero rows, and the tool answers `{ "data": [] }` with no complaint. An agent that guessed
`category="supply chain"` instead of `SUPPLY_CHAIN` will confidently report "no supply-chain
threats in the corpus" — against 202 of them.

Three distinct behaviours, and you have to know which one you are in:

| Behaviour | What you see | Tools |
|---|---|---|
| **Silent empty** (most common) | 200 + zero rows | `search_threats` (category/severity/status), `search_iocs` (type), `get_detections`/`search_detections` (type, severity), `get_mitre_coverage` (tactic), `get_pivotal_entities` (node_type), `get_entity_profile` / `get_correlation_subgraph` (seed_type/node_type), `resolve_entity` (type) |
| **Silent fallback to default** | 200 + *plausible but wrong* data | `get_c2` (bad `view` → `beacons`), `get_correlations` (bad `engine` → `overview`), `predict_mitre_transitions` (anything not `reverse` → `forward`), `search_vulnerabilities` (bad `sort` → `trending`) |
| **Silent filter drop** | 200 + *unfiltered* data | `search_vulnerabilities` `severity` — a value outside CRITICAL/HIGH/MEDIUM/LOW is ignored, so you get the whole feed and may report it as "all critical" |
| **Real error** | JSON-RPC error / 400 | `export_detection` (`format` validated → 400), `hunt` (unknown field → `Unknown hunt field: x`) |

The silent-fallback row is worse than the empty row: empty at least looks wrong.

## The rule: call the list tool first

Before filtering on any vocabulary you have not confirmed **in this session**:

| Want to filter on | Call first | Cost |
|---|---|---|
| threat category | `list_threat_categories` | one call, returns every category + its count |
| hunt fields / operators | `hunt_schema` (once per session, mandatory) | cheap, server-derived so it cannot go stale |
| actor / malware / tool / campaign name | `resolve_entity` | one call, returns canonical + UUID |
| MITRE tactic or technique | `get_mitre_coverage` (no `tactic` arg) | returns the tactic rollup with the exact strings |
| detection flavours in the corpus | `get_platform_stats` | includes the `detection_type` distribution |
| what a correlation engine offers | `get_correlations` with `engine="overview"` | the documented drill-down entry point |

`list_threat_categories` and `hunt_schema` exist for exactly this. Two cheap calls beat one
confident wrong answer.

Counts below are a 2026-08 snapshot of prod D1 and drift nightly. Treat them as *relative
magnitude* — "is this the majority spelling" — never as reportable figures.

---

## Threat categories (`search_threats.category`)

Exact match on `UPPER(category)`, so case does not matter but **spelling and the underscore
do**. `list_threat_categories` is the authority; this is what it currently returns.

**Load-bearing (≥8 threats):** `VULNERABILITY` 550 · `MALWARE` 465 · `SUPPLY_CHAIN` 202 ·
`PHISHING` 122 · `APT` 114 · `RANSOMWARE` 111 · `THREAT_INTEL` 77 · `DATA_BREACH` 37 ·
`ZERO_DAY` 23 · `CAMPAIGN` 14 · `THREAT_ACTOR` 12 · `ICS_SCADA` 9 · `CLOUD` 8

**Long tail (≤6, ingest noise not taxonomy):** `FRAUD` · `ADVISORY` · `AI_SECURITY` ·
`ESPIONAGE` · `INTRUSION` · `CYBERCRIME` · `MISCONFIGURATION` · `OTHER` · `POLICY` ·
`RECONNAISSANCE` · `SCAM` · `SOCIAL_ENGINEERING` · `SURVEILLANCE` · `BOTNET` · `EXTORTION` ·
`INCIDENT` · `IOT` · `NATION_STATE` · `RANSOMWARE_HACKTIVISM` · `RESEARCH` · `TOOL` · `TTP`

Traps:

- `SUPPLY_CHAIN`, not `SUPPLY-CHAIN` / `"supply chain"` / `SupplyChain`.
- There is no `CVE`, `EXPLOIT`, `INSIDER`, `DDOS`, or `CRYPTO` category — guessing any of
  them returns empty.
- Do not conclude anything from a long-tail filter. If you want "supply-chain-ish", use
  `query="supply chain"` (free text, substring) or `tag`, not a guessed category.

## Severity bands — three different vocabularies

There is no single severity vocabulary. Which one applies depends on the tool.

| Surface | Tool + arg | Accepted | Matching |
|---|---|---|---|
| Threats | `search_threats.severity` | `CRITICAL` `HIGH` `MEDIUM` `LOW` | `UPPER(severity_level) = ?` — case-insensitive, exact |
| Detections | `search_detections.severity` | `critical` `high` `medium` `low` `info` | lowercased, exact |
| CVEs | `search_vulnerabilities.severity` | `CRITICAL` `HIGH` `MEDIUM` `LOW` | uppercased; **anything else is silently dropped, not empty** |
| `hunt` | `severity = "…"` | as stored on `threats` | case-insensitive |

Corpus reality on `threats.severity_level`: `HIGH` ~1029, `CRITICAL` ~558, `MEDIUM` ~172,
plus a residue of `INFO` (11), `LOW` (8), `INFORMATIONAL` (7), `MODERATE` (1), `UNKNOWN` (1).
`severity="LOW"` returns ~8 rows and **misses** the `INFO`/`INFORMATIONAL` residue. Report
"8 rows are labelled LOW", not "only 8 low-severity threats exist". Detections carry `info`
as a real band; threats effectively do not — do not carry a band across surfaces.

## Threat status / exploitability / motivation / nation_state

`status` is exact on `UPPER(status)`:
`ACTIVE` (~1354) · `MONITORING` (187) · `PATCHED` (170) · `RESOLVED` (29) · `TRACKING` (17) ·
`DORMANT` (10) · `MITIGATED` (9) · `SUPERSEDED` (8) · `CONTAINED` (1) · `INACTIVE` (1) ·
`RESEARCH` (1). There is no `CLOSED`, `OPEN`, or `ARCHIVED`.

`exploitability` (returned, not a `search_threats` filter; filterable in `hunt`):
`ACTIVE` (~1312) · `POC_PUBLIC` (246) · `NONE` (81) · `THEORETICAL` (76) · `CONFIRMED` (4) ·
`WEAPONIZED` (3) · `ZERO-DAY` (2).

`motivation`, `nation_state`, `target_sector`, `target_region`, `affected_product`,
`threat_actor` on `search_threats` are **substring `LIKE`, not enums** — a near-miss will
not return empty. But they *are* dirty, so prefer the shortest unambiguous fragment:

- `motivation`: `FINANCIAL` 873 · `UNKNOWN` 541 · `ESPIONAGE` 296 · `DESTRUCTION` 18 ·
  `HACKTIVISM` 12, plus lowercase duplicates.
- `nation_state`: `Unknown` 1065 and `N/A` 143 dominate. Real: `Russia` 175 · `China` 113 ·
  `North Korea` 64 **and** `North Korea (DPRK)` 24 as separate strings · `Iran` 47.
  `"North Korea"` catches both DPRK spellings (substring); `"DPRK"` catches only 24.

## IOC vocabularies — the `search_iocs.type` trap

`search_iocs.type` does **not** take an indicator type. It is routed to the `category`
column and matched **exactly and case-sensitively**.

```
search_iocs(type="ip")       → []        # "ip" is an ioc_type, not a category
search_iocs(type="Network")  → []        # case-sensitive
search_iocs(type="network")  → 10,695 rows
```

Valid `search_iocs.type` values (lowercase, exact): `behavioral` 12309 · `network` 10695 ·
`file` 9846 · `entity` 3222 · `infrastructure` 2771 · `tool` 2533 · `malware` 2439 ·
`technique` 1624 · `package` 1469 · `host` 670 · `vulnerability` 169 · `cve` 40 ·
`financial` 25 · `software` 23 · `email` 11 · and `web` `application` `blockchain` `domain`
`signature` `cwe` at ≤4 rows each.

The finer **`ioc_type`** vocabulary is returned in results and is filterable through `hunt`
(`ioc_type = "sha256"`), not through `search_iocs`: `technique` 7304 · `domain` 4940 ·
`sha256` 3265 · `filename` 3009 · `ip` 2873 · `command` 2572 · `tool_name` 2509 ·
`organization` 2219 · `process` 2021 · `url` 1992 · `path` 1887 · `malware_family` 1754 ·
`package_name` 1486 · `platform` 1466 · `person` 973 · `pattern` 839 · `md5` 832 ·
`hosting` 690 · `registry` 610 · `c2_framework` 549 · `sha1` 353 · `hash` 179 · `cidr` 174 ·
`cve` 170 · `port` 122.

`hash` exists *alongside* `sha256`/`md5`/`sha1` — a legacy bucket. "All hashes" must union
all four.

`search_iocs` also **does not honor `offset`** (the response says `has_more` but paging is
not implemented). Narrow with a more specific `value` substring instead of paging.

Community indicators use a different, genuinely enumerated set —
`search_xscan_indicators.type`: `ip` · `domain` · `url` · `sha256` · `md5`. Nothing else.
There is deliberately **no family filter** on that tool (the upstream family field is
populated on <1% of rows); use `tag` instead. And community data corroborates — it is never
authoritative attribution.

`get_ioc_dns` reads **stored** DNS enrichment. It is not a live resolution at call time.
Say "stored enrichment as of the last ingest", never "I resolved it".

## Detection flavours

| Arg | Tool | Accepted | Behaviour on a wrong value |
|---|---|---|---|
| `type` | `get_detections`, `search_detections` | `spl` `kql` `sigma` | lowercased, exact → **empty** |
| `format` | `export_detection` (required) | `spl` `kql` `sigma` `json` | validated → **400 error** |

Corpus: `sigma` 5631 · `spl` 5542 · `kql` 5313, plus ~36 legacy rows typed `behavioral`,
`network`, `endpoint`, `authentication`, `integrity`, `file_integrity`, `ioc`, `process`,
`behavioral_correlation`. Those are real rows but not a supported filter surface — do not
present them as a fourth detection language.

`format="json"` returns the whole detection object; the other three return raw query text
plus `available: false` when that flavour is not populated for the rule. `available: false`
is not an error — it means that detection has no SPL/KQL/Sigma body, and you should say so
rather than reporting an empty rule.

## MITRE tactics — two spellings of the same tactic

The canonical ATT&CK order (this is what `predict_mitre_transitions` and the graph rank by):

`reconnaissance` · `resource-development` · `initial-access` · `execution` · `persistence` ·
`privilege-escalation` · `defense-evasion` · `credential-access` · `discovery` ·
`lateral-movement` · `collection` · `command-and-control` · `exfiltration` · `impact`

**But `threat_mitre.tactic` stores both a Title Case spelling and a kebab-case spelling, and
`get_mitre_coverage` matches `LOWER(tactic) = ?` exactly.** They are two different keys:

| `tactic=` you pass | Matches | ~rows |
|---|---|---|
| `"initial-access"` | only the kebab rows | 579 |
| `"initial access"` | only the Title Case rows | 2956 |

The value in the tool's own description (`initial-access`) hits the **minority** spelling
and undercounts by ~5×. Same everywhere: `Defense Evasion` 5916 vs `defense-evasion` 1665,
`Command and Control` 3636 vs `command-and-control` 827, `Execution` 3288 vs `execution` 1011.

So: call `get_mitre_coverage` with **no `tactic`** first and read the exact strings out of
the tactic rollup; if you must filter, query **both** spellings and sum, and say you did;
never report a per-tactic count from a single spelling.

ICS tactics also appear (`Inhibit Response Function`, `Impair Process Control`) — not in the
enterprise 14, so they vanish from any enterprise-only reasoning.

Technique ids are uppercased server-side (`t1059` works). `T1059` and `T1059.001` are
distinct nodes — a parent query does not roll up its sub-techniques.

## `get_c2` view

Exact enum; **an unknown value silently falls back to `beacons`**, so you get real-looking
beacon data when you asked for something else.

`beacons` (default, active beacon snapshots) · `configs` (full extracted C2 configs) ·
`operators` (operator clusters) · `watermarks` (Cobalt Strike watermark index) ·
`correlations` (cross-C2) · `timeline` (activity over time) · `stats` (aggregate counts).

There is no `clusters` view — the operator-clustering view is `operators`. There is no
`domains` view; use `get_c2_dns_intel`.

`get_c2_dns_intel.fidelity`: `dedicated` · `mixed` · `shared`. `dedicated` is
adversary-owned infrastructure; `shared` is shared hosting where a block would collateral.
The `compromised` boolean separates victim hosts from adversary-owned ones — relevant
whenever the output is going into a blocklist.

`generate_c2_blocklist` takes **no arguments at all**. Any argument object other than `{}`
is wrong. (Third-party docs claiming it takes three arguments are wrong.)

## `get_correlations` engine

Exact enum; **an unknown value silently falls back to `overview`**.

`overview` (default) · `mitre-heatmap` · `adversary-infra` · `ioc-consensus` ·
`cve-velocity` · `attribution` · `detection-debt` · `enrichment`

Hyphens, not underscores: `mitre-heatmap`, never `mitre_heatmap`. Call `overview` first —
it tells you which engines have data before you drill.

## Graph node types

`get_entity_profile.node_type`, `get_pivotal_entities.node_type`,
`get_correlation_subgraph.seed_type` all take the same enum:

`threat` · `technique` · `actor` · `ioc` · `cve`

Two things the enum does not tell you:

1. **`cve` has no rows in the centrality table.** `get_pivotal_entities(node_type="cve")`
   returns an empty list — the enum is valid, the data is not. Populated: `ioc` ~2944,
   `threat` ~1633, `technique` ~771, `actor` ~528. Use `get_cve_intelligence` instead.
2. **A wrong `seed_id` for a right `seed_type` also returns empty**, with
   `nodes: [], edges: []` and HTTP 200. Resolve the id first: `resolve_entity` for an actor
   name, an exact `TL-` id for a threat, an exact indicator value for an IOC. An
   un-canonicalized actor alias is the usual cause of an "empty graph".

`get_correlation_subgraph.depth` is 1–3 and clamps. Start at 1; depth 3 reliably blows the
response cap. Edge types are `technique_cooccurrence`, `actor_technique`,
`threat_similarity`, `ioc_threat` — there is no `actor_actor` or `cve_threat` edge, so paths
between those never exist.

`get_pivotal_entities` betweenness is an **ego-bridge heuristic**, not exact Brandes
betweenness — the payload says so in its own `note` field. Report it as a heuristic ranking.

## `predict_mitre_transitions.direction`

`forward` (default) = what typically follows · `reverse` = what typically precedes.

Anything that is not literally `reverse` (case-insensitively) becomes `forward`. So
`direction="backward"`, `direction="prior"`, `direction="back"` all silently give you the
forward chain — the opposite of what you asked for. There are exactly two values.

`predict_mitre_transitions` answers **sequence**. `get_technique_rules` answers
**co-occurrence** (support/confidence/lift on technique pairs). They are not substitutes.

## `search_vulnerabilities` — sort, window, vendor

`sort` — exact; anything else silently becomes `trending`:

| `sort` | Orders by |
|---|---|
| `trending` (default) | `trending_score DESC, priority_score DESC` — platform-native attention signal |
| `latest` | `published_date DESC` |
| `priority` | `priority_score DESC` — platform-native blended score |
| `cvss` | `cvss_v3_score DESC` (v3 only; a v4-only CVE sorts as null) |
| `epss` | `epss_score DESC` |

`trending` and `priority` are **Threadlinqs-computed scores, not standards**. Never present
them as CVSS/EPSS or as a vendor rating.

Other filter semantics:

- `severity` — `CRITICAL`/`HIGH`/`MEDIUM`/`LOW` against `cvss_v3_severity`. Anything else
  is **silently ignored** and you get the unfiltered feed. Check the returned
  `facets.severity` block before reporting a severity-scoped count.
- `window` — integer **days back from now** on `published_date`, clamped to 3650. Not a
  date, not a duration string: `window="7d"` parses as NaN and the filter is dropped.
- `vendor` — lowercased **substring** over the affected-products JSON, max 60 chars. No
  canonical vendor list. `vendor="cisco"` matches "Cisco IOS XE"; `"Cisco Systems, Inc."`
  matches nothing. Use the shortest distinctive fragment.
- `cwe` — uppercased, stripped to `[A-Z0-9-]`, substring over the weaknesses JSON. Pass
  `CWE-79`; bare `79` also substring-matches `CWE-798`.
- `kev` / `has_poc` / `nuclei` — booleans. `epss_min` — 0–1 float; `epss_percentile` is
  mixed-scale in storage and normalized on the way out, so never compare one to `epss_min`.
- The feed is **not the whole CVE table**: a row appears when
  `in_feed=1 OR is_kev=1 OR the CVE is linked to a threat`. "Not in the feed" ≠ "does not
  exist" — use `get_cve` for a specific id.

## `resolve_entity.type`

Optional. When given it is matched **exactly** against the reference set's `entity_type`,
so a wrong type turns a resolvable name into `matched: false`.

The tool description lists `actor|malware|tool|sector|region|technique|campaign`. The
reference set actually holds more: `malware` 10897 · `actor` 3996 · `technique` 2532 ·
`tool` 1448 · `mitigation` 564 · `country` 252 · `atlas` 182 · `campaign` 157 ·
`sector` 133 · `data_source` 80 · `region` 32 · `os` 31.

Practical rule: **omit `type` unless you are disambiguating.** Without it the lookup runs
across all types, does an exact-alias pass then a fuzzy pass, and tells you the
`entity_type` it found — which is usually the thing you wanted to learn. Supplying a wrong
`type` is the only way to make a resolvable name look unresolvable.

`matched: false` means "not in the reference set", not "does not exist". The response says
to use the name verbatim in that case. Do not invent a canonical form or a UUID.

## `hunt` — fields and observation types

`hunt_schema` is the authority and must be called once before your first `hunt`. Unlike
every other tool here, **`hunt` errors on an unknown field** (`Unknown hunt field: foo` in a
filter, `Unknown group-by field: foo` after `by`) rather than returning empty — so a typo is loud, but a *valid
field with a wrong value* is still silently empty.

Field names (each with aliases; see `hunt_schema` for the full alias list):
`actor` `actor_uuid` `tool` `malware` `arsenal` `ioc` `ioc_value` `ioc_type` `cve` `mitre`
`technique` `tactic` `nation` `country` `c2_ip` `watermark` `domain` `dns_ip` `severity`
`category` `threat` `threat_id` `type`/`obs` `source` `seen`/`first_seen`/`ts`
`sector` `region` (+ `target_*` forms).

`type` / `obs` filters the observation type. Real values across the ~106k rows: `ioc` 47500 ·
`mitre` 45640 · `dns` 5528 · `tool` 3030 · `malware` 2543 · `cve` 2045 · `attribution` 931 ·
`infra` 253 · `c2_beacon` 116.

There is no `detection` observation type — detections are not in the hunt index. Detection
questions go to `search_detections` / `get_mitre_gap_analysis`.

Two hunt-specific traps. `tool` and `malware` are **the same column** (`tool_lc`) with
different intent, so `malware = "LockBit"` also matches a row where LockBit was recorded as
a tool — cross with `type = "malware"` when it matters. And `tactic` inherits the **same
double-spelling problem**: use `tactic IN ("defense evasion", "defense-evasion")`, or group
by tactic and merge the pairs yourself.

One row = one observation, not one threat. `| stats count` counts observations;
`| stats count_distinct(threat) by …` (alias `dc`) counts distinct threats. There is no
`dcount` — the server rejects it outright.

## Attribution vocabularies

`get_attribution_evidence` returns these. They are the difference between an assessment and
a stub, and misreading them is a factual error, not a style issue.

| Field | Values | Meaning |
|---|---|---|
| `state` | `assessed` · `pending_research` | **`pending_research` is an unresearched intake stub.** Never present it as attribution. |
| `verdict` | `attributed` (~24) · `assessed_unattributed` (~907) | The researched conclusion |
| `method` | `research+adversarial-verify` (~516) · `intake` (~415) | `intake` = machine-stubbed, no research |
| `confidence` | `HIGH` · `MEDIUM` · `LOW` (empty on stubs) | Only meaningful when `verdict='attributed'` |
| `scope` | `operation` · `exploitation` (empty on stubs) | What the attribution covers |
| `reason_code` | `pending_research` `no_public_attribution` `generic_vuln` `report_roundup` `commodity_malware` `insufficient_evidence` `other` | Why *not* attributed |

`reason_code='pending_research'` is machine-only and always paired with
`state='pending_research'`. If you see it, the correct sentence is "this threat has not been
researched for attribution yet" — not "unattributed", and definitely not a named actor.

`threats.threat_actor` alone cannot tell you which of these you are looking at. That is the
whole reason `get_attribution_evidence` exists. If you are about to name an actor, check
`state` first.

## Community / OSINT vocabularies

Community tags (`search_xscan_indicators.tag`, `get_osint_trends`) are **free-form,
case-insensitive, normalized substrings** from the upstream feed — there is no closed list
and no validation. `tag="asyncrat"` and `tag="async"` both work; `tag="AsyncRAT_v3"`
probably does not.

`get_community_campaigns` cluster labels are **upstream AI output**, not a Threadlinqs
assessment — attribute them to the community feed explicitly. On an upstream failure the
response carries `community_error`: report "community feed unavailable", never "no campaigns
found". The layer is heavily concentrated (~73% of recent submissions from one reporter). It
corroborates. It never attributes.

## Quick reference — guess-safe vs guess-fatal

| Safe to guess (substring / free text) | Fatal to guess (exact match) |
|---|---|
| `search_threats`: `query` `threat_actor` `nation_state` `motivation` `target_sector` `target_region` `affected_product` `malware` `tool` `campaign` `os` `sector` | `search_threats`: `category` `severity` `status` |
| `search_vulnerabilities`: `query` `vendor` `cwe` | `search_vulnerabilities`: `sort` `severity` (silently dropped) |
| `search_xscan_indicators`: `tag` `q` | `search_xscan_indicators`: `type` |
| `search_detections`: `query` | `search_detections` / `get_detections`: `type` `severity` |
| `hunt`: values on `LIKE`-style fields | `search_iocs`: `type` · `get_mitre_coverage`: `tactic` · `get_c2`: `view` · `get_correlations`: `engine` · `get_entity_profile`/`get_pivotal_entities`/`get_correlation_subgraph`: `node_type`/`seed_type` · `resolve_entity`: `type` · `export_detection`: `format` |

When a filtered call returns empty, the first hypothesis is a wrong vocabulary value, not an
empty corpus. Re-run the same call **without** the suspect filter. If it returns rows, the
filter value was wrong — go call the list tool.

## Response cap

Every tool response is capped at **90,000 characters** and appends:

```
... [truncated: response exceeded 90000 chars — narrow your query
```

That marker means the payload is incomplete and **any count or "no results for X" you derive
from it is unsound**. Do not retry unchanged; do not summarize the fragment as if it were
whole. Narrow instead: add a filter from the vocabularies above, lower `limit`, switch to a
composite (`get_ioc_intelligence` over `search_iocs`, `get_cve_intelligence` over `get_cve` +
velocity + detections), or use `hunt … | stats count by <field>` so the server aggregates
instead of shipping you rows to count.

Paging is honored on `search_threats`, `get_recent_threats`, `get_detections`,
`search_xscan_indicators`. It is **not** honored on `search_iocs`, `list_debriefs`,
`search_actors` — on those, narrow rather than page.
