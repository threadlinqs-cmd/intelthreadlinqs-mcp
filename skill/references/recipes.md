# Recipes — end-to-end playbooks

Ordered playbooks for the Threadlinqs Intelligence MCP server. Each one gives the trigger,
the call sequence with real argument names, what to do when a step comes back empty, and how
to write the result up honestly.

The server also ships these as MCP prompts (call `prompts/list` to see the current set —
`triage_cve`, `hunt_ioc`, `build_c2_blocklist`, …). Most hosts never surface prompts, so every
recipe below is written to be followed without them. Where a recipe mirrors a server prompt,
the prompt name is given so the two surfaces stay in step.

## Before any recipe

| Rule | Detail |
|---|---|
| Names | Tool names are written bare. Hosts may prefix them (`mcp__threadlinqs-intel__get_threat`) — match by suffix. |
| Tier | Every tool call needs Purple/Gold. `-32001` = missing/invalid key, `-32002` = authenticated but under-tier. **Both are terminal.** Surface the upgrade path; do not retry with a different tool. |
| Discovery | `tools/list` is tier-gated. Unauthenticated twins: `GET /mcp/catalog.json` and `/mcp.md`. |
| Truncation | Responses cap at **90,000 characters** and end with `... [truncated: response exceeded 90000 chars — narrow your query`. If you see that string, narrow (filters, `limit`, lower `depth`) — do not stitch guesses over the cut. |
| Hunt | `hunt_schema` once per session before the first `hunt`. |
| Paging | Honored on `search_threats`, `get_recent_threats`, `get_detections`, `search_xscan_indicators` (`limit` + `offset`/`cursor`). **Not** honored on `search_iocs`, `list_debriefs`, `search_actors` — narrow instead. |
| Enums | Never guess a category. `list_threat_categories` first. Never pivot on a raw alias — `resolve_entity` first. |
| Bulk | `bulk_get_threats` / `bulk_get_cves` take up to 20 ids per call. Never loop `get_threat` over a known list. |

## R0 — Orient (start of a session)

**Trigger:** first question of a session, or you do not know what the corpus covers.
**Prompt:** `orient` · **Lane:** L0

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `get_started` | none | Catalog, categories, tiering. Cheap — no D1 round-trip — but still tier-gated. |
| 2 | `get_platform_stats` | none | Corpus size and shape. |
| 3 | `list_threat_categories` | none | The only valid vocabulary for `search_threats` `category`. |
| 4 | `hunt_schema` | none | TLQL field grammar. Required before `hunt`. |

**Empty/failed:** if step 1 returns `-32001`/`-32002`, stop — this is an access problem, not a data problem. Report the tier requirement and the upgrade path.
**Present:** state in one line what the server can and cannot answer, then aim the real question.

## R1 — Triage a CVE

**Trigger:** "is CVE-2024-3400 a problem for us?", a CVE id pasted from a scanner.
**Prompt:** `triage_cve` · **Lanes:** L5, L2

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `get_cve_intelligence` | `cve_id="CVE-2024-3400"` | One call: detail + linked threats + exploitation velocity + detections. |
| 2 | `get_cve` | `cve_id` | Only if step 1 is unavailable. |
| 3 | `get_threat` | `id="TL-…"` | Only for linked threats that need depth. Two or more ids → `bulk_get_threats`. |
| 4 | `get_cwe` | `cwe_id="CWE-77"` | The weakness class behind the CVE. |

**Anti-pattern:** `get_cve` + a velocity call + a detections call. That is what `get_cve_intelligence` composes.
**Empty:** no linked threats means the corpus has no reporting on exploitation of this CVE — say that, do not read it as "not exploited". Check `kev` and EPSS from the CVE record before concluding anything about urgency.
**Present:** severity, exploitation status (KEV / in-the-wild), corpus exposure, prioritized remediation. Distinguish "high CVSS" from "actually being exploited".

## R2 — Sweep the vulnerability feed

**Trigger:** "what should we patch this week?", a vendor-scoped question.
**Prompt:** `sweep_vulnerabilities` · **Lane:** L5

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `search_vulnerabilities` | `kev=true`, `epss_min=0.1`, `vendor="Fortinet"`, `window=7`, `severity="CRITICAL"`, `sort="priority"` | `window` is a **number of days**, not "7d". `severity` here is upper-case (`CRITICAL\|HIGH\|MEDIUM\|LOW`); `search_threats` severity is case-insensitive. `sort` ∈ `trending\|latest\|priority\|cvss\|epss`. |
| 2 | `bulk_get_cves` | `cve_ids=["CVE-…","CVE-…"]` | One call, ≤20. Never loop `get_cve`. |
| 3 | `get_cve_intelligence` | `cve_id` | Only the two or three that matter. |
| 4 | `get_cwe` | `cwe_id` | On the recurring weakness ids, to name the systemic class. |

**Empty:** drop the narrowest filter first (`epss_min`, then `window`), not all of them at once.
**Present:** a patch-priority list ordered by exploitation likelihood and corpus exposure. Call out explicitly where a high CVSS is *not* urgent.

## R3 — Profile an actor

**Trigger:** "what do we know about APT29 / Lazarus / this alias?"
**Prompt:** `profile_actor` · **Lanes:** L3, L7

| # | Call | Args | Note |
|---|---|---|---|
| 0 | `resolve_entity` | `name="fancy bear"`, `type="actor"` | Aliases live in a JSON column; the raw string often will not match. |
| 1 | `get_actor_intelligence` | `name="APT28"` | Composite: profile + cross-actor attribution correlations. |
| 2 | `get_actor` | `name` | Lean fallback if step 1 is unavailable. |
| 3 | `get_attribution_coverage` | `actor="APT28"` | How much of the attribution is *researched* vs labelled at ingest vs uncovered. |
| 4 | `get_mitre_coverage` | `tactic="execution"` (optional) | ATT&CK context for the technique rollup. |

**Empty:** if `resolve_entity` finds nothing, try `search_actors` — it returns the full roster and accepts `tool` / `malware` / `sector` filters. It is not paginated; narrow with a filter.
**Present:** TTPs, targeting, notable campaigns, cited by TL- id. State the researched-vs-stub split from step 3 rather than implying every labelled threat is an assessment.

## R4 — Hunt an IOC

**Trigger:** an IP, domain, hash or URL from an alert or a customer.
**Prompt:** `hunt_ioc` · **Lane:** L4

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `get_ioc_intelligence` | `value="185.…"` | The dossier: linked threats, actor attribution, related IOCs, enrichment. |
| 2 | `get_ioc_blast_radius` | `value`, `depth=2` | Sizes what else it reaches. `depth` 1=threats, 2=+techniques, 3=+actors & sibling IOCs. |
| 3 | `get_similar_threats` | `id="TL-…"`, `limit=10` | Only from a linked threat that matters. |

**Anti-pattern:** `search_iocs` → N × `get_threat` → N × `get_actor`. That is exactly what `get_ioc_intelligence` replaces. Use `search_iocs` only when you have a **substring**, not an exact value — and remember it does not page.
**Empty:** nothing linked means the corpus has not seen this indicator. Say so plainly; consider R11 (OSINT) for community corroboration, clearly labelled as community-sourced.
**Present:** which threats and actors it ties to, consensus confidence, recommended block or detect action.

## R5 — Answer an aggregate question (TLQL)

**Trigger:** "how many", "which is most common", "grouped by", or a question crossing two observation types ("threats using Cobalt Strike that also have DNS observations").
**Prompt:** `hunt_corpus` · **Lane:** L1

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `hunt_schema` | none | Once per session. You cannot write valid TLQL without it. |
| 2 | `hunt` | `query='tool = "cobalt strike" AND sector = "healthcare" \| stats count by nation'`, `limit=50` | `limit` caps rows (clamped to **100**) and in `\| stats` mode caps the number of **groups** returned. The tool description saying otherwise is wrong. |

**Anti-pattern:** N × `search_threats` and counting the rows yourself. That is slower, tier-caps differently, and the count will be wrong.
**Empty:** relax **one** predicate at a time and re-run; do not rewrite the query wholesale. If the field name was the problem, re-read the grammar from step 1 rather than guessing an alias.
**Present:** the answer, the exact TLQL you ran, and whether the result hit a row cap.

## R6 — Research an open question

**Trigger:** conceptual or paraphrased question where the exact keywords will not appear.
**Prompt:** `research_question` · **Lanes:** L1, L8, L2

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `search_corpus_semantic` | `query="ransomware crews pivoting to data-theft-only extortion"` | Vector + rerank. Rate-limited; it ranks, it does not count. |
| 2 | `resolve_entity` | `name`, `type` | On any named entity the results surface. |
| 3 | `get_entity_profile` | `node_type="actor"`, `node_id="APT28"` | `node_type` ∈ `threat\|technique\|actor\|ioc\|cve`. Best token-per-call ratio in the graph lane. |
| 4 | `get_threat_bundle` | `threat_id="TL-…"`, `include="full"` | `include="summary"` returns just the threat record. |

**Empty:** if semantic search returns nothing, fall back to `search_threats` with structured filters — the concept may exist under a category rather than a phrase.
**Present:** cite TL- ids. State what the corpus does **not** cover instead of filling the gap from general knowledge. If the question turned out to be aggregate, switch to R5.

## R7 — Map a threat's detections to ATT&CK

**Trigger:** "what do we detect for TL-2026-0042?"
**Prompt:** `map_detections_to_mitre` · **Lanes:** L2, L6, L7

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `get_threat` | `id="TL-2026-0042"` | Techniques as published. |
| 2 | `get_detections` | `threat_id="TL-2026-0042"`, `type="sigma"`, `limit=50` | `type` ∈ `spl\|kql\|sigma`. Pages via `offset`/`cursor`. |
| 3 | `get_threat_enrichment` | `id` | The enrichment layer the base record does not carry. |
| 4 | `get_mitre_technique` | `technique_id="T1059"` | For any technique you need to describe. |

**Empty:** no detections on a threat is itself the finding — it is detection debt, not an error.
**Present:** a technique → rule table, then the uncovered techniques ranked by what an attacker reaches for first.

## R8 — Review detection gaps

**Trigger:** "where should the detection team spend next sprint?"
**Prompt:** `review_detection_gaps` · **Lanes:** L6, L7

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `get_mitre_gap_analysis` | `tactic="persistence"` (optional), `limit=20` | Debt score = threat exposure + KEV count + EPSS. |
| 2 | `get_mitre_coverage` | `tactic` (optional) | Gives the gaps a denominator. |
| 3 | `get_technique_rules` | `limit=50` | Technique **pairs** with support/confidence/lift — what travels together. Also stops you recommending a rule that already exists. |

**Empty:** a tactic with no gaps is a real answer. Report coverage rather than widening until something looks broken.
**Present:** a ranked "write these next" list; each entry names the technique, why it scores high, and the example threats driving the score.

## R9 — Write a detection

**Trigger:** "give me a Sigma rule for T1059 / for this threat."
**Prompt:** `write_detection` · **Lanes:** L6, L7

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `search_detections` | `query="powershell encoded command"`, `type="sigma"`, `limit=25` | Ground in what exists. Pages via `offset` (limit max 200). |
| 2 | `get_detection_detail` | `detection_id="…"` | Full logic of the closest match. |
| 3 | `get_mitre_technique` | `technique_id="T1059"` | Procedures. |
| 4 | `get_threat` + `get_detections` | `id` / `threat_id` | When the request is threat-scoped. |
| 5 | `export_detection` | `detection_id`, `format="sigma"` | `format` ∈ `spl\|kql\|sigma\|json`. Deployable form. |

**Empty:** no near neighbour means you are writing from scratch — say so.
**Present:** the rule, plus the log sources it assumes. If a field you need is not evidenced anywhere in the returned data, name the gap rather than inventing a telemetry source.

## R10 — Plan a purple-team exercise

**Trigger:** "can we exercise TL-2026-0042?"
**Prompt:** `plan_purple_team` · **Lanes:** L6, L2

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `get_threat_simulations` | `threat_id="TL-2026-0042"` | Step-by-step emulation commands by platform. |
| 2 | `list_simulations` | `limit=50` | Only if step 1 is empty — find the closest analogue. |
| 3 | `get_threat_transcripts` | `threat_id` | Observed execution detail from the research agents. |
| 4 | `get_detections` | `threat_id` | The rules that *should* fire. |

**Present:** pair each simulation step with the detection expected to trip and the technique it exercises, so a miss is attributable. These are live attack commands — state that they belong in an authorized lab or an approved engagement, never against production without sign-off.

## R11 — Review an attribution

**Trigger:** a threat names an actor and someone is about to act on it.
**Prompt:** `review_attribution` · **Lane:** L3

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `get_attribution_evidence` | `threat_id="TL-2026-0042"` | Returns `state` — **researched assessment vs unresearched intake stub** — plus verdict, confidence, scope, evidence chain, suspected alternatives. |
| 2 | `get_threat` | `id` | The claim as published. |
| 3 | `get_actor` | `name` | If an actor is named. |
| 4 | `get_attribution_coverage` | `actor` | The wider evidence base for that actor. |

**Honesty rule (non-negotiable):** a pending stub is **UNATTRIBUTED**. Never restate a stub as a finding, and never let `threats.threat_actor` alone stand in for an assessment.
**Present:** a verdict — evidence-backed, thin, or unassessed — naming the specific evidence carrying it.

## R12 — Explain a correlation

**Trigger:** "why are these two linked?", two TL- ids side by side.
**Prompt:** `explain_link` · **Lane:** L8

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `explain_correlation` | `threat_a="TL-…"`, `threat_b="TL-…"` | Per-channel decomposition, dominant channel, shared artifacts, staleness flags. |
| 2 | `get_correlation_path` | `from="TL-…"`, `to="TL-…"`, `max_hops=6` | Shortest evidence path. 6 is the schema default (range 1-8); lower it to make the search stricter, raise it only after a `found:false`. |
| 3 | `get_threat` | `id` (each end) | Context. |

**Empty:** `found:false` carries a reason (no edges vs different components). Report the reason — it is not the same as "unrelated but probably connected".
**Present:** same campaign / shared infrastructure / merely a shared technique / unrelated, and which signal carries the claim. Never upgrade a weak shared-technique edge into attribution.

## R13 — Map a campaign

**Trigger:** a campaign or cluster name, or "what else is part of this?"
**Prompt:** `map_campaign` · **Lanes:** L9, L8

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `get_campaign_intelligence` | `name="Snowflake campaign"` | Looks up a **named** campaign mentioned in threat text. |
| 2 | `get_graph_campaigns` | `limit=20` | Engine-assembled clusters (components + label propagation). Use when the name does not resolve. |
| 3 | `get_correlation_subgraph` | `seed_type="threat"`, `seed_id="TL-…"`, `depth=1`, `limit_nodes=40` | `seed_type` ∈ `threat\|technique\|actor\|ioc\|cve` — **there is no campaign seed**; seed from a member threat or the actor. |
| 4 | `get_pivotal_entities` | `node_type="ioc"`, `limit=20` | Hubs and bridges worth monitoring. |
| 5 | `get_correlations` | `engine="adversary-infra"` | `engine` ∈ `overview\|mitre-heatmap\|adversary-infra\|ioc-consensus\|cve-velocity\|attribution\|detection-debt\|enrichment`. |

**Anti-pattern:** `get_correlation_subgraph` at `depth=3`. Each hop multiplies nodes and blows the 90k cap. Start at 1 and expand only where the topology is the point — for a single entity `get_entity_profile` is cheaper and usually what you wanted.
**Honesty rule:** `get_pivotal_entities` betweenness is an **ego-bridge heuristic**, not exact Brandes — its own payload says so. Do not present it as exact betweenness.
**Present:** member threats, shared infrastructure, pivotal entities, attribution confidence.

## R14 — Pivot on infrastructure

**Trigger:** an IP/domain from a beacon, or "what else does this threat's infrastructure touch?"
**Prompt:** `pivot_infrastructure` · **Lane:** L4

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `get_ioc_dns` | `value="1.2.3.4"` | **Stored enrichment, not a live lookup.** Date it in the write-up. |
| 2 | `get_ioc_blast_radius` | `value`, `depth=2` | What the indicator reaches. |
| 3 | `get_infrastructure_pivots` | `threat_id="TL-…"` | Cross-threat shared IPs/domains and DNS overlaps. |
| 4 | `get_c2_dns_intel` | `fidelity="dedicated"`, `compromised=false`, `limit=50` | `fidelity` ∈ `dedicated\|mixed\|shared`. Separates adversary-owned from shared hosting. |

**Empty:** no DNS enrichment stored ≠ no DNS history. Say the platform has none cached.
**Present:** high-confidence vs incidental pivots. Shared hosting and CDN ranges are **not** adversary infrastructure — call that out instead of listing it as a finding.

## R15 — Build a C2 blocklist

**Trigger:** "give me something to drop into the firewall."
**Lane:** L4

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `generate_c2_blocklist` | **none** | Takes no arguments at all. Firewall-ready active C2 IPs. |
| 2 | `get_c2` | `view="operators"`, `limit=50` | `view` ∈ `beacons\|configs\|operators\|watermarks\|correlations\|timeline\|stats`. Use `beacons` for underlying detail. |
| 3 | `get_c2_dns_intel` | `compromised=false` | Folds in unmasked C2 domains, excluding victim hosts. |
| 4 | `search_iocs` | `value="…"`, `type="network"`, `limit=100` | Only for indicators outside the live C2 feed. Does not page. |

**Present:** one deduplicated list of IPs and domains with the threats or operator clusters they map to, **and the age of the data** — a stale entry must never be blocked blind.

## R16 — OSINT sweep

**Trigger:** "is anyone else seeing this?", coverage/lead-time questions.
**Prompt:** `osint_sweep` · **Lane:** L10

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `get_osint` | `threat_id="TL-…"` *or* `ioc_value="1.2.3.4"` | Per-threat corroboration block, or the community lookup for an indicator. |
| 2 | `get_osint_trends` | none | Trending tags, novelty, corpus corroboration, `early_warning` lead-time distribution. |
| 3 | `get_community_campaigns` | `limit=20` | Community clusters. |
| 4 | `search_xscan_indicators` | `tag="asyncrat"`, `type="domain"`, `asn="AS14061"`, `country="RU"`, `min_threats=1`, `limit=50`, `offset=0` | `type` ∈ `ip\|domain\|url\|sha256\|md5`. There is deliberately **no family filter** — use `tag`. Pages. |

**Honesty rules:** OSINT is community-sourced — corroborating, never authoritative. `get_community_campaigns` cluster labels are **upstream AI output**, not a Threadlinqs assessment. Keep both labelled as such; never merge them into corpus findings silently.
**Present:** what the community knows that the corpus does not, and vice versa.

## R17 — Malware / tool dossier

**Trigger:** a family or offensive-tool name.
**Prompt:** `malware_dossier` · **Lanes:** L9, L8

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `resolve_entity` | `name="Cobalt Strike"`, `type="tool"` | Learn *what kind* of entity it is. `type` ∈ `actor\|malware\|tool\|sector\|region\|technique\|campaign`. |
| 2 | `get_malware_intelligence` *or* `get_tool_intelligence` | `name` | Try the other if the first is empty — the split is not always obvious. |
| 3 | `get_entity_profile` | `node_type`, `node_id` | Graph context. |
| 4 | `search_actors` | `tool="Cobalt Strike"` | Which actors use it. |

**Present:** actors and campaigns using it, the threats it appears in, observed capabilities, and the detections that cover it. A commodity tool shared by many actors is not attribution.

## R18 — Predict the next move

**Trigger:** "we saw T1566 — what comes next?"
**Prompt:** `predict_next_move` · **Lane:** L7

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `predict_mitre_transitions` | `technique_id="T1566"`, `direction="forward"`, `top_n=10` | `direction` ∈ `forward\|reverse`. Sequence. |
| 2 | `get_mitre_technique` | `technique_id` | What the technique actually does. |
| 3 | `get_technique_rules` | `limit=50` | Co-occurrence (what appears alongside), the complement of step 1. |

**Present:** the progression with the probability **and observation count** behind each step. A prediction with a low observation count is a weak signal — say so rather than stating it flatly.

## R19 — Assess exposure to a CVE, actor or technique

**Trigger:** "are we exposed to X?" where X is a CVE, an actor, or a technique.
**Prompt:** `assess_exposure` · **Lanes:** L5, L3, L7, L6

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `get_cve` / `get_actor` / `get_mitre_technique` | `cve_id` / `name` / `technique_id` | Whichever was provided. |
| 2 | `search_threats` | `cve="CVE-…"` or `threat_actor="APT28"` or `mitre_technique="T1059"`, `limit=50` | All filters AND-combine. Pages via `offset`/`cursor`. |
| 3 | `get_detections` | `threat_id` | Per linked threat that matters. |

**Present:** covered vs uncovered, and the recommended actions. Exposure the corpus cannot see is not exposure that does not exist — bound the claim to the corpus.

## R20 — Daily brief / period review

**Trigger:** "what happened today?", "brief me on last week."
**Prompts:** `daily_brief`, `period_review` · **Lane:** L11

Daily:

| # | Call | Args |
|---|---|---|
| 1 | `get_daily_intel_bundle` | `date="2026-08-01"` (omit for latest), `top_n=5` |
| 2 | `get_threat_level` | none |
| 3 | `get_daily_theme` | none |
| 4 | `get_landscape_briefing` | none |
| 5 | `get_recent_threats` | `limit=10`, `offset=0` |

Period: `get_latest_debrief` (or `get_debrief` with `date="YYYY-MM-DD"`) → `list_debriefs`
with `limit=30` for surrounding context. `list_debriefs` does **not** page — raise `limit`.

**Empty:** a missing debrief date means nothing was published that day; check `list_debriefs` for the real dates rather than inventing a gap narrative.
**Present:** what changed — new threats, escalations, what a defender should do differently this week versus last. Anchor every claim to a TL- id or a debrief date.

## R21 — Bulk enrich a list of ids

**Trigger:** a pasted list of TL- ids or CVE ids.
**Prompt:** `bulk_enrich` · **Lanes:** L2, L5

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `bulk_get_threats` | `threat_ids=["TL-2026-0042","TL-2026-0099"]` | ≤20 per call. Returns `{threats, missing, count}`. |
| 2 | `bulk_get_cves` | `cve_ids=["CVE-2024-3400"]` | ≤20 per call. |
| 3 | `get_threat_bundle` | `threat_id`, `include="full"` | Only the entries that need depth. |
| 4 | `get_threat_hunting_bundle` | `threat_id` | When the depth needed is *hunting* — detail + similar threats + simulations + infra pivots in one call. |

**Anti-pattern:** looping `get_threat`, or chaining `get_threat` → `get_similar_threats` → `get_threat_simulations` → `get_infrastructure_pivots`. The second is exactly `get_threat_hunting_bundle`.
**Present:** a table keyed by id, and list the `missing` ids explicitly rather than dropping them.

## R22 — Export for downstream tooling

**Trigger:** "get this into our TIP / SIEM / Navigator."
**Prompt:** `export_for_tooling` · **Lane:** L12

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `export_stix` | `threat_id="TL-…"` *or* `actor="APT29"` *or* `cve_id="CVE-…"`, `include_osint=false` | At least one selector. `include_osint=true` adds community `sighting` objects — only if the consumer wants community-sourced data mixed in. |
| 2 | `export_attack_navigator` | `actor="APT29"` *or* `all=true` | Enterprise-attack layer, capped at 600 techniques. |
| 3 | `search_detections` → `export_detection` | `query` → `detection_id`, `format="spl"` | `format` ∈ `spl\|kql\|sigma\|json`. |

**Present:** the artifacts with a one-line note on what each is for and which tool ingests it. If `include_osint=true`, say so — the bundle then carries community-sourced sightings.

## R23 — Platform status (freshness caveats)

**Trigger:** before you trust any correlation answer, or when a result looks off.
**Prompt:** `platform_status` · **Lane:** L0

| # | Call | Args | Note |
|---|---|---|---|
| 1 | `health` | none | Liveness. |
| 2 | `get_engine_status` | none | Per-engine row counts, last-compute times, staged graph-pipeline progress, `degraded` flag, recent failures, latest held-out AUC. |
| 3 | `get_enrichment_overview` | none | Enrichment completeness and coverage gaps. |
| 4 | `get_platform_stats` | none | Corpus size. |
| 5 | `get_changelog` / `get_roadmap` | `limit=10` / none | What shipped, what is coming. |

**Present:** whether the data is currently trustworthy for analysis, and name anything that would make a result misleading right now. A stale engine is a caveat on **every** correlation answer you give in that session.

## Failure handling, in order

1. **`-32001` / `-32002`** — terminal. Report the tier requirement and the upgrade path. Do not
   probe other tools; the gate is checked before tool existence, so a different name proves nothing.
2. **Truncation marker** — narrow the query (tighter filters, lower `limit`, lower `depth`,
   `include="summary"`), then re-run. Never summarize across a truncation boundary as if complete.
3. **Empty result** — relax one predicate at a time. Empty is often the answer; report it.
4. **Unknown enum / no match** — go back to the vocabulary tool (`list_threat_categories`,
   `hunt_schema`, `resolve_entity`) rather than guessing another spelling.
5. **Composite unavailable** — fall back to the named single-purpose tool in the recipe, and say
   the answer was assembled from parts.
