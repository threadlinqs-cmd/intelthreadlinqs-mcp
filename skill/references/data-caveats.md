# Data caveats — what the corpus does not support

Every tool here returns something. That is the problem: a populated field is not the same
as a supported claim. This file is the boundary between what the payload says and what you
are allowed to say on top of it.

Tool names are written bare. Hosts may prefix them (`mcp__threadlinqs-intel__get_threat`,
`mcp__claude_ai_threadlinqs__get_threat`) — match by suffix.

Read this before writing any sentence that names an actor, asserts a link, ranks an entity,
or reports a count.

---

## 1. The provenance ladder

Four kinds of content ship through the same JSON. They do not carry the same weight.

| Provenance | Produced by | Tools | How to speak about it |
|---|---|---|---|
| Curated | Threadlinqs research + editorial review | `get_threat`, `get_detections`, `get_cve`, `get_actor`, `get_debrief` | State it. Cite the threat ID. |
| Researched assessment | Analyst-run evidence chain with citations | `get_attribution_evidence` where `state: "assessed"` | State it, with confidence + scope + the citations. |
| Machine-derived | Nightly graph/correlation pipeline | `get_similar_threats`, `explain_correlation`, `get_correlation_path`, `get_pivotal_entities`, `get_graph_campaigns`, `get_correlation_subgraph`, `predict_mitre_transitions`, `get_technique_rules` | "The correlation engine links…", never "these are the same campaign". |
| Community-sourced | tweetfeed.live (CC0), reported by the public | `get_osint`, `get_osint_trends`, `search_xscan_indicators`, `get_community_campaigns` | Corroborating evidence. Never authoritative, never attribution. |
| Upstream AI output | tweetfeed's own clustering model | `get_community_campaigns` cluster names/labels | "The community feed labels this cluster X" — not our assessment. |
| Agent process artifact | Research agents' working notes | `get_threat_transcripts` | Reasoning that produced the record, not an independent source. Do not cite a transcript as evidence for its own conclusion. |

Anything from the bottom three rows needs an attributed source in the sentence. If you
cannot fit the attribution in, drop the claim.

---

## 2. Attribution: researched assessment vs pending intake stub

`get_attribution_evidence` returns a `verdict` column on **every** row, including rows
nobody has researched. The nightly intake stubs each unattributed threat as
`verdict: "assessed_unattributed"`, `reason_code: "pending_research"`, `method: "intake"`
purely so the backlog has a live denominator. The `state` field exists to keep you from
rendering "ASSESSED · no public attribution" over a row nobody has looked at.

| Field | Meaning |
|---|---|
| `state: "assessed"` | A researcher ran the check. `evidence` holds citations, `reasoning` holds the analysis. |
| `state: "pending_research"` | Queue placeholder. `evidence` and `signals` are `[]`. `queued_at` is an intake timestamp, not an assessment date. |
| `verdict: "attributed"` | Actor named for *this* activity by cited sources, with `confidence` and `scope`. |
| `verdict: "assessed_unattributed"` + `state: "assessed"` | A **documented** non-attribution — the check was performed and cited. |
| `suspected` | Near-miss candidates that failed the evidence bar. Leads, not conclusions. |

`get_attribution_coverage` splits the corpus three ways and the three do not mean the same
thing:

- `actor_labeled_at_ingest` — the source feed carried an actor name. Never independently
  assessed by this platform. `threats.threat_actor` being populated proves nothing about
  evidence quality.
- `assessed` = `rows_total − pending_research` — research-backed records.
- `uncovered` — cohort threats with no attribution row at all.
- `coverage_pct` divides by `denominator_total` (`rows_total + uncovered`), not by
  `rows_total`. Do not recompute it against `rows_total`; that reads 100% whenever the
  intake has not run.
- `latest_assessment_at` is the **research** clock. `last_intake_at` is the machine clock.
  A fresh `last_intake_at` with a months-old `latest_assessment_at` means the research lane
  is stalled, not that attribution is current.

| Tempted to say | Say instead |
|---|---|
| "TL-2026-0989 is unattributed." (from a stub) | "No attribution assessment has been performed yet — the record is a pending research stub." |
| "The platform assessed 1,787 threats." | "N threats carry a research-backed assessment; M more are labelled by the source feed at ingest and have not been independently assessed." |
| "Attributed to APT29." (from `threats.threat_actor`) | "Labelled APT29 by the source feed. `get_attribution_evidence` shows `state: pending_research`, so the label is not corroborated here." |
| "Suspected LockBit." (from `suspected`) | "LockBit was considered and rejected against the evidence bar; recorded as a near-miss candidate." |

**Never** present a stub as an attribution, and never upgrade `suspected` to attributed
prose.

---

## 3. `threat_similarity` is directional — absence is not dissimilarity

The similarity writer stores **top-N neighbours per source threat**. Row `(A,B)` exists
because B was in A's top-N; `(B,A)` may not exist. `get_similar_threats` queries both slots
and dedupes to max score, and `explain_correlation` tries `(a,b)` then `(b,a)`, so you do
not need to compensate — but the *semantics* still bite:

- A threat can be genuinely related to another and be **absent** from its neighbour list
  simply because both top-N slots were full of stronger links.
- The campaign / centrality layer only ingests edges with `similarity_score >= 0.45`.
  Anything weaker is invisible to `get_graph_campaigns` and `get_pivotal_entities`.
- `explain_correlation` returning 404 means **the engine has no edge**, not "these threats
  are unrelated". Same for `get_correlation_path` returning `found: false` — it tells you
  which reason (no edges vs different components).

| Tempted to say | Say instead |
|---|---|
| "These two threats are unrelated." | "The correlation engine holds no edge between them, so it offers no evidence either way." |
| "TL-A's five related threats are…" | "The engine's top-ranked neighbours for TL-A are… (a top-N list, not an exhaustive set)." |
| "Nothing connects this incident to that campaign." | "No path was found within N hops over the similarity graph." |

---

## 4. Correlation fidelity — what a low-fidelity edge does not mean

Co-occurrence edges (`technique_cooccurrence`, `ioc_threat`, `actor_technique`) score with
NPMI plus a support shrink: `fidelity = round(weight_norm × 100 × c/(c+2))`, where `c` is
the joint count. Two consequences:

- **Low fidelity usually means low support**, not a weak real-world relationship. A pair
  seen twice is shrunk by 0.5 before it is scored at all; pairs below the minimum support
  produce **no edge**, so they are absent rather than low.
- **High fidelity means "co-occurs far above chance in this corpus"** — a statement about
  the corpus, not about the adversary. A technique pair that is universal in the wild but
  rare across the corpus scores low. (Do not hard-code a corpus size here — call
  `get_platform_stats`; the nightly ingest moves it.)

Per-pair quality flags come back on `get_similar_threats` and `explain_correlation`:

| Flag | Set when | What it obliges you to do |
|---|---|---|
| `is_high_conf_low_signal` | score > 0.7 but fewer than 3 signals fired | Do not lead with the score. Name the one or two shared artifacts and let the reader judge. |
| `is_stale` | `decay_factor < 0.3` | Say the link rests on old activity. |
| `dominance` | `{signal, pct}` — which channel carried the score | If `pct` is high and the channel is `context`, the link is thematic, not technical. |

`get_correlation_subgraph` compares `min_fidelity` against a **0-100** stored column. A
value like `0.5` therefore filters essentially nothing. Check the `fidelity_score` values on
the returned edges before claiming you restricted the view to strong edges.

| Tempted to say | Say instead |
|---|---|
| "A low-fidelity edge shows the link is weak." | "The edge has low support — few co-occurrences — so the engine cannot separate it from chance." |
| "I filtered to high-fidelity edges only." | Quote the actual `fidelity_score` range you saw. |
| "Score 0.82 — strongly related." (with `is_high_conf_low_signal`) | "Score 0.82, but on fewer than three signals; the shared evidence is X and Y only." |

---

## 5. `get_pivotal_entities` betweenness is an ego-bridge heuristic

`betweenness_approx` is **not** Brandes betweenness. For each node the pipeline counts
non-adjacent pairs among its strongest neighbours (capped at 24, recorded in
`betweenness_basis` as `ego_bridge_full` or `ego_bridge_top24`). The response says so in
`note` — repeat it rather than dropping it.

- `role` (`bridge` / `hub` / `leaf`) is assigned by a **p10 threshold over the current
  corpus**. It is a relative rank, not an absolute property. A rebuild can flip a node's
  role without anything in the world changing.
- `pivot_rank` is a dense rank on weighted degree over the same snapshot.
- The metric is computed over threat nodes on the similarity graph, so "pivotal" means
  "structurally central *in our corpus*", never "central to the threat landscape".

| Tempted to say | Say instead |
|---|---|
| "T1059 has the highest betweenness centrality." | "T1059 ranks highest on the engine's approximate ego-bridge score — a heuristic for structural brokerage, not exact betweenness." |
| "This is a bridge node." | "The engine classes it `bridge` — top-decile ego-bridge score in the current snapshot." |
| "Detect here and you cover the most threats." | "The engine ranks this highest for coverage-per-detection in this corpus; validate against your own telemetry." |

---

## 6. OSINT is community-sourced, concentrated, and corroborating only

`get_osint`, `get_osint_trends`, `search_xscan_indicators` and `get_community_campaigns`
read the TL_OSINT_Scan layer over tweetfeed.live (CC0). Every response carries a `caveat`
block computed live from the producer rollup:

| Field | Meaning |
|---|---|
| `reporter_concentration` | Share of recent submissions from the single largest reporter (recently ~73%). |
| `top_reporter` | That reporter's handle. |
| `bus_factor_50` | How many reporters it takes to reach half the volume. |
| `active_producers` | Distinct reporters in the 7-day window. |

Read these from the payload; do not hardcode the percentage — it moves. When
`reporter_concentration` is high, "the community is reporting X" is really "one or two
accounts are reporting X".

Two fields are routinely misread:

- **`community_tag_volume` is not this threat's community IOC count.** It is the
  community's total volume for the *matched tags* — on one threat it read 4,294 against 15
  actually corroborated indicators, a ~280× overstatement. The corroboration number is
  `corroborated`.
- **`level`** grades the evidence: `full` (at least one curated indicator corroborated) ·
  `context` (no corroboration, but campaigns or new related indicators) · `tags_only`
  (family-tag overlap only) · `none` (scanned, found nothing). Only `full` supports
  "the community corroborated this".

### Lead time is bimodal — do not report a single average

`get_osint_trends.early_warning` returns the distribution deliberately, with its own
`interpretation` string:

- `within_7d` is the **operational early-warning cohort** — the community flagged the
  indicator days before our report.
- `over_90d` is **reused infrastructure resurfacing**, not advance warning. Folding it into
  a mean inflates "we get N days of warning" enormously.
- `mean_lead_days` ships, but quoting it alone is the misuse the field's own comment warns
  about.

Also: `search_xscan_indicators` has no family filter on purpose — the upstream AI family
field is populated on under 1% of rows. Filter by `tag`. "No results" from a family-shaped
query would be an artifact of the missing field, not evidence of absence.

| Tempted to say | Say instead |
|---|---|
| "The community independently corroborates this." | "N indicators were corroborated by community reports; the feed's recent volume is ~X% from a single reporter, so treat it as one source." |
| "4,294 community indicators for this threat." | "15 of this threat's indicators were corroborated; 4,294 is the community's total volume for the matched tags." |
| "We see threats ~40 days before disclosure." | "For the ≤7-day cohort (N threats) the community flagged indicators a median of X days before our report; a long tail over 90 days reflects reused infrastructure, not warning." |
| "OSINT attributes this to X." | The OSINT layer never attributes. Drop the sentence. |

---

## 7. Community campaign labels are upstream AI output

`get_community_campaigns` returns clusters the **upstream feed's own model** assembled —
`name`, `confidence`, `targeted_brand` are its labels, not Threadlinqs assessments. The
`source` string on the response says exactly that.

Failure mode matters: on a proxy failure the response carries `community_error:
"upstream_unavailable"` with `campaigns: null` rather than erroring. Report "the community
feed is unavailable", never "there are no community campaigns". Same rule applies to
`stale` / `stale_since` on that payload — a stale window is not a quiet week.

| Tempted to say | Say instead |
|---|---|
| "The 'ClickFix Payroll' campaign targets Workday." | "The community feed's clustering labels this group 'ClickFix Payroll' with `targeted_brand: Workday` — an upstream AI label, not our attribution." |
| "No community campaigns are active." | "The community campaign feed did not return data (`community_error: upstream_unavailable`)." |

---

## 8. DNS is stored enrichment, never a live lookup

`get_ioc_dns` reads previously-resolved records out of the platform dataset. It does **not**
resolve anything at call time. A domain that has since moved, been sinkholed, or been taken
down still returns its historical records.

- Always date the claim from the record's `first_seen` / `last_seen` / `enriched_at`.
- An empty result means "no stored enrichment for this indicator", not "does not resolve".
- `get_c2_dns_intel` reports `fidelity` derived purely from the count of distinct domains
  on a beacon IP: `dedicated` ≤5, `mixed` ≤50, `shared` >50. That is a hosting-shape
  heuristic. `dedicated` means "few domains observed", not "proven adversary-owned"; a
  fresh or under-enriched IP looks dedicated for the same reason a real one does.
- `compromised` on that tool is a TLD heuristic (`.gov`/`.edu`/`.mil`/`.int` and country
  equivalents), i.e. "looks like legitimate infrastructure", not a confirmed breach.
- `generate_c2_blocklist` takes **no arguments**. It compiles beacons seen in a recent
  window, and the beacon corpus today is Cobalt Strike only — it is not a complete C2 list,
  and an IP's absence is not a clean bill of health.

| Tempted to say | Say instead |
|---|---|
| "The domain currently resolves to 5.9.x.x." | "Stored enrichment (last seen YYYY-MM-DD) maps it to 5.9.x.x. This is cached data, not a live resolution." |
| "This IP is adversary-owned." | "Only N domains are observed on this IP, which the platform grades `dedicated` — consistent with dedicated infrastructure, not proof of ownership." |
| "That IP is not a C2." | "It is not in the current beacon blocklist, which covers Cobalt Strike beacons in a recent window only." |

---

## 9. Corpus recency and drift

The corpus is ingested nightly and derived layers are rebuilt on their own clocks. Nothing
here is real-time.

| Layer | Refresh | Consequence |
|---|---|---|
| `threats` | Nightly ingest | Counts drift within a day; never quote a total as fixed. |
| `threats.created_at` | Date-only, midnight UTC | It is a publication date, not an incident timestamp. Do not derive hours-level timing. |
| Similarity / centrality / campaigns | Nightly staged graph pipeline | Staged: a partial rebuild can leave a stage at the previous generation. |
| `hunt` index | Materialized nightly from the live tables | `hunt` results lag `search_threats` / `get_threat` by up to a rebuild. |
| Correlation engines (`get_correlations`) | Nightly | Each engine ages independently. |
| Community OSINT | Harness-driven, budgeted at 168h | "Stale" here is routine operator cadence, not an outage. |
| Attribution research | Manual/agent lane, budgeted at 168h | Backlog grows between runs by design. |

`get_engine_status` is the authority when freshness matters. Its per-engine `status` is
`ok` / `stale` / `empty` / `error` / `backlog`, with `stale_after_hours` and
`freshness_basis` so you can see what it graded against. Call it before reasoning over
correlation output in an answer that will be acted on, and say so when a layer is `stale`.

`get_platform_stats` and `health` return live counts. Prefer them over any number written
in documentation, including this file.

| Tempted to say | Say instead |
|---|---|
| "The platform tracks 1,787 threats." | "As of this call, `get_platform_stats` reports N threats." |
| "The graph shows no link." (engine `stale`) | "The similarity layer last computed YYYY-MM-DD and is currently graded `stale`; the absence of a link may reflect the lag." |
| "This threat emerged on the 14th at 03:00." | "The threat record is dated the 14th (publication date, day resolution)." |

---

## 10. "No data" vs "wrong argument" vs "under-tier"

Three different failures produce empty-looking output. Conflating them is how a skill
reports "nothing exists" about something that does.

| Signal | What it is | Correct response |
|---|---|---|
| JSON-RPC `-32001` | Missing or invalid API key. `data.upgrade_url` included. | **Terminal.** Surface the upgrade path. Do not retry, do not try other tools. |
| JSON-RPC `-32002` | Authenticated but under-tier — tool calls need Purple/Gold (tier ≥ 3). `data.your_tier` / `data.required_tier` included. | **Terminal.** Same. Trying a "lighter" tool does not help; `get_started` and `health` are gated too. |
| `tools/list` empty or refused | `tools/list` is tier-gated. | Read the unauthenticated twin: `GET /mcp/catalog.json` or `/mcp.md`. Never conclude the server has no tools. |
| `matched: false` (`resolve_entity`, `get_malware_intelligence`, `get_tool_intelligence`, `get_campaign_intelligence`) | HTTP 200, name did not resolve. `detail_hint` suggests the fix. | "No canonical match for that name" — then retry via `resolve_entity`, not "the actor does not exist". |
| Empty rows from `search_threats` with a `category` filter | Almost always an invented enum value. | Call `list_threat_categories` and re-run. Never report zero until the enum is confirmed. |
| `hunt` error `Unknown hunt field: X` | Field not in the hunt grammar. | Call `hunt_schema` once and re-issue. This is a syntax failure, not an empty result. |
| `search_corpus_semantic` 503 | The retrieval index is unavailable. | "Semantic search is unavailable", never "nothing matched". |
| `community_error` on an OSINT payload | Upstream proxy failure. | "Community feed unavailable", never "no community data". |
| `... [truncated: response exceeded 90000 chars — narrow your query` | The response hit the 90,000-character cap and was cut. | The tail is **missing**, not absent from the data. Narrow (tighter filters, lower `limit`, a more specific tool) and re-run. Never total, rank, or say "that's all" over a truncated payload. |
| Genuinely empty result, no marker, valid arguments | Real absence in this corpus. | "The corpus holds no record of X" — scoped to this corpus, never to the world. |

Paging note that changes what "all" means: `search_threats`, `get_recent_threats`,
`get_detections` and `search_xscan_indicators` honour `offset`/`cursor` and return
`has_more` + `next_cursor`. `search_iocs`, `list_debriefs` and `search_actors` do **not**
honour offset — you cannot page them. `has_more: true` there means "more may exist and you
cannot reach it by paging"; narrow the filter instead, and say so rather than presenting a
first page as the complete set.

---

## 11. Phrases to never write

- "comprehensive" / "powerful" — banned outright.
- "confirmed" for anything not `verdict: "attributed"` with citations.
- "the community verified" — the community reports; it does not verify.
- "betweenness centrality" without "approximate" / "ego-bridge heuristic".
- "currently resolves" / "live lookup" about `get_ioc_dns` or `get_c2_dns_intel`.
- "no X exists" where the honest claim is "this corpus holds no X".
- "unrelated" where the honest claim is "the engine holds no edge".
- Any count taken from a truncated response.
- Any author name. The organization is Threadlinqs Intelligence; the team is Threadlinqs Team.

## 12. The one-line test

Before any assertion, ask: *if the reader acted on this and it was wrong, which field in the
payload already told me so?* If a field did — `state`, `note`, `caveat`, `level`,
`community_error`, `is_high_conf_low_signal`, `is_stale`, `matched`, `has_more`,
`freshness_basis`, the truncation marker — put it in the sentence.
