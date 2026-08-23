# Tool reference — all 81 tools

GENERATED FILE — do not edit by hand. Regenerate with `npm run build:skill`.
Source: `https://intel.threadlinqs.com/mcp/catalog.json`.

Arguments marked **\*** are required. Tool **calls** need a Purple or Gold key (tier ≥ 3);
introspection does not. Your host may prefix these names — match by suffix.


## L0 · Orient

Cheap situational calls. Do not open every session with all of these.

### `get_started`

Start here. Returns the Threadlinqs Intelligence tool catalog, categories, tiering, and usage guidance. No API call — read this before using other tools.

**Arguments:** _takes no arguments_

### `health`

Lightweight liveness probe: confirms the API is reachable and your key is valid, and returns platform counts + the latest debrief date.

**Arguments:** _takes no arguments_

### `get_platform_stats`

Get aggregate platform statistics: threat, detection, IOC, MITRE technique, and actor counts.

**Arguments:** _takes no arguments_

### `get_engine_status`

Is the intelligence pipeline healthy? Per-engine row counts, last-compute times and derived ok/stale/empty status; the nightly graph pipeline's staged progress, current stage and degraded flag; recent failures; and the latest held-out accuracy eval (AUC). Check this before reasoning over correlation output if freshness matters.

**Arguments:** _takes no arguments_

### `get_enrichment_overview`

Health and coverage of the enrichment LANES feeding the platform, one row each: cve_details, threat_iocs, detections, mitre_attack, c2_intel, dns_enrichment, tl_osint_scan, osint_blocklist_liveness. EPSS and KEV are NOT separate lanes - they are fields inside cve_details (whose hit_rate is the share of CVEs carrying both CVSS v3 and EPSS), and there is no IOC-reputation lane; the nearest signals are osint_blocklist_liveness and tl_osint_scan. Each lane's hit_rate has its OWN definition (they are not comparable to each other) and coverage_basis distinguishes 'measured_zero' from 'not_measured' - c2_intel really is 0% corpus coverage, because c2_correlations_v2 has no populated threat_id. This is a nightly snapshot: read as_of/stale_hours before treating it as current.

**Arguments:** _takes no arguments_

### `get_changelog`

Get the platform changelog (new threats, detections, features), strictly newest-first by date. Pass limit (default 20, max 100). NOTE: this is a hand-maintained release feed, not a deploy log — it stopped being written in Feb 2026, so the response carries latest_entry_date / stale_days / a warning. For what the platform actually looks like NOW use get_platform_stats (live corpus counts) and get_engine_status (pipeline state); do not answer "what changed recently" from this alone.

**Arguments:** `limit` _number_ — Max entries (default 20, max 100)

### `get_roadmap`

Get the Threadlinqs Intelligence platform roadmap: `completed`, `in_progress` and `ideas` (planned), with `counts`, `generated_at` and `as_of`. WARNING: this table is hand-maintained and has not been updated since Feb 2026 — the response carries stale_days and a warning, and several items still marked "planned" have since shipped. Do not report an item as unbuilt on this basis; confirm with get_started (live tool catalog), get_platform_stats or get_engine_status.

**Arguments:** _takes no arguments_


## L1 · Find

Four different search modes. They are NOT interchangeable — boolean-exact, vector-rerank, SIEM-aggregate, alias-canonicalise.

### `search_threats`

The deterministic threat-catalog query tool. Returns LEAN summary rows {id, title, severity, category, status, threat_actor, nation_state, affected_products, cves, cvss_score, summary, created} — call get_threat for full detail on a specific id. Combine a free-text `query` with any structured filters; ALL filters AND-combine and apply together (e.g. query="supply chain" + threat_actor="TeamPCP" + category="SUPPLY_CHAIN" returns only matching rows, with affected_products inline). Paginated: limit (default 20, max 100) + offset/cursor; result carries total, has_more, and next_cursor.

**Arguments:** `query` _string_ — Free-text term across title/summary/description/CVE/actor (optional; AND-combined with filters)<br>`severity` _string_ — critical | high | medium | low<br>`category` _string_ — e.g. SUPPLY_CHAIN, MALWARE, RANSOMWARE, VULNERABILITY, APT, PHISHING, ZERO_DAY (call list_threat_categories for the full vocabulary)<br>`status` _string_ — Threat status filter (e.g. active)<br>`threat_actor` _string_ — Filter by attributed actor name/alias (e.g. "TeamPCP", "APT29")<br>`nation_state` _string_ — Filter by nation-state (e.g. Russia, China, Iran)<br>`motivation` _string_ — Filter by motivation (e.g. financial, espionage)<br>`target_sector` _string_ — Filter by targeted sector (e.g. Healthcare, Finance)<br>`target_region` _string_ — Filter by targeted region (e.g. APAC, Europe)<br>`affected_product` _string_ — Filter by affected product/vendor (e.g. "npm", "Microsoft", "VS Code")<br>`tag` _string_ — Filter by exact tag (e.g. "supply-chain-compromise")<br>`mitre_technique` _string_ — Filter by MITRE technique id (e.g. T1059)<br>`cve` _string_ — Filter by CVE id (e.g. CVE-2026-45321)<br>`malware` _string_ — Filter to threats deploying a malware family (e.g. "LockBit", "Vidar")<br>`tool` _string_ — Filter to threats using a tool (e.g. "Cobalt Strike", "Mimikatz")<br>`campaign` _string_ — Filter to threats in a named campaign/operation (e.g. "Snowflake campaign")<br>`os` _string_ — Filter to threats affecting an operating system (e.g. "Windows", "Linux", "VMware ESXi")<br>`sector` _string_ — Filter by grounded industry sector (e.g. "Healthcare", "Government")<br>`created_after` _string_ — ISO date — only threats created on/after (e.g. 2026-05-01)<br>`created_before` _string_ — ISO date — only threats created on/before<br>`limit` _number_ — Max results (default 20, max 100)<br>`offset` _number_ — Row offset for pagination (default 0).<br>`cursor` _string_ — Opaque pagination cursor (next_cursor from a prior result); ignored when offset is given.

### `search_corpus_semantic`

Vector + rerank retrieval over the whole corpus, returning ranked source cards. Use when keyword search fails — conceptual or paraphrased questions where the exact terms do not appear in the text. Complements search_threats, which is boolean/exact over structured filters. Depends on the AI Search binding and is rate-limited; a 503 means the index is unavailable, not that nothing matched.

**Arguments:** `query`**\*** _string_ — A natural-language question or concept.

### `hunt`

Run a deterministic SIEM-style query over the pre-joined observation index (~106k rows across tool, malware, ioc, mitre, cve, attribution, dns and infra observations). Use this INSTEAD of chaining many search_threats calls when the question is an aggregate ("how many X grouped by Y") or crosses observation types ("threats using tool A that also have IOC type B"). Append "| stats count by <field>" to aggregate; without it you get matching rows. A threat contributes one row per observation, so for "how many THREATS" use "| stats count_distinct(threat) by <field>" — plain count double-counts. Operators are = != > < >= <= LIKE CONTAINS IN "NOT IN"; quote any value with a hyphen (cve = "CVE-2024-3400"). Call hunt_schema first if you do not know the field names.

**Arguments:** `query`**\*** _string_ — TLQL, e.g. `tool = "cobalt strike" AND sector = "healthcare" | stats count by nation`<br>`limit` _integer_ — Row cap for non-stats queries (default 50, max 100). In stats mode it caps the number of GROUPS returned. Check `has_more` in the response.

### `hunt_schema`

The hunt query grammar: every filterable field and alias, which fields are scoped observables vs denormalized, the operators, the stats-pipe form, worked examples, and how fresh the index is. Call once before writing a hunt query.

**Arguments:** _takes no arguments_

### `resolve_entity`

Normalize an actor / malware / tool / sector / region / technique name or alias to its canonical reference form + stable UUID (e.g. "fancy bear" → "APT28"). Call this BEFORE pivoting (get_actor / get_malware_intelligence / get_tool_intelligence / search_threats) when unsure of the canonical name. Optional type narrows the lookup.

**Arguments:** `name`**\*** _string_ — Name or alias to resolve<br>`type` _string_ — Optional: actor|malware|tool|sector|region|technique|campaign

### `get_entity_aliases`

Every alias the reference set maps to ONE entity — the reverse of resolve_entity, which only walks a single alias forward. Use it to check alias collision: the commonest reason two "different actors" turn out to be one. IMPORTANT: the source (MISP) OVER-MERGES — it folds subgroups into their parent, so "andariel" and "bluenoroff" both appear under "Lazarus Group". An alias entry is a MAPPING, not an assertion of identity. Each alias therefore carries `relation` (canonical|subgroup|alias), `other_entities` (how many other entities claim the same label) and `corpus_threats` (how many threats this platform files under that exact label); `corpus_uses_separately` lists labels the corpus treats as their own actor despite the merge. Accepts a name or a uuid.

**Arguments:** `name` _string_ — Name or alias to expand (e.g. "andariel"). Resolved exact-then-fuzzy, same ladder as resolve_entity.<br>`uuid` _string_ — Entity uuid, if you already have one from resolve_entity. Skips resolution.<br>`type` _string_ — Optional: actor|malware|tool|sector|region|technique|campaign — narrows name resolution.

### `list_threat_categories`

List every threat category with its threat count across the whole corpus. Use to discover valid category filters for search_threats.

**Arguments:** _takes no arguments_

### `get_recent_threats`

List the most recently published threats. Paginated: pass limit (default 15, max 100) and offset to page through older threats; the result includes has_more and an opaque next_cursor (reusable as offset/cursor).

**Arguments:** `limit` _number_ — Max results (default 15, max 100)<br>`offset` _number_ — Row offset for pagination (default 0). Or pass cursor from a prior result.<br>`cursor` _string_ — Opaque pagination cursor (next_cursor from a prior result). Decoded to an offset; ignored when offset is given.


## L2 · Threat dossier

Prefer a bundle over a chain.

### `get_threat`

Get the detail for a single threat by its ID (e.g. TL-2026-0042): overview, attribution, MITRE techniques, IOCs, the detection roster, timeline, targets and tags. RETRIEVABLE IN PARTS — pass `sections` to choose what comes back; the response echoes `_sections` telling you what was returned and what was omitted. By default detection RULE BODIES (SPL/KQL/Sigma) are omitted — they are ~40% of a heavy dossier and have dedicated tools (export_detection / get_detection_detail) — and `description` is trimmed to 1500 chars with `description_chars` disclosing the true length. Pass sections="all" and max_description=-1 for the complete record. For malware families, tools, sectors/regions, OS and campaigns, call get_threat_enrichment.

**Arguments:** `id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)<br>`sections` _string_ — CSV of sections to return. Any of: overview, attribution, mitre, iocs, detections (WITH rule bodies), detections_meta (roster only, the default), timeline, tags, targets, remediation, references (full bibliography), references_compact (ranked primary-first + corroboration summary, in the default), similar, updates, osint, flow, entities — or "all", or "row" (exclusive: a ~500-byte identity row plus section counts). Default: overview,attribution,mitre,iocs,detections_meta,timeline,tags,targets,similar,flow,osint,references_compact<br>`max_description` _number_ — Char budget for the narrative description. Default 1500; 0 drops it; -1 returns it whole.

### `get_threat_enrichment`

Reference-grounded enrichment for one threat by ID: the malware families and tools used, targeted sectors/regions, affected operating systems, named campaigns, AI/ML (ATLAS) techniques, and per-technique mitigations + detection data sources. Complements get_threat (overview/MITRE/IOCs/detections) — call this for the "what malware/tools were used and who was targeted" view. Read `coverage` before acting on an empty array: grounded = the normalised association tables, threat_record = fell back to the threat's own target_sectors/target_regions, unmapped = NOT MAPPED, which is not the same as not targeted.

**Arguments:** `id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)

### `get_threat_bundle`

One-shot dossier for a threat: threat detail plus its simulations and pipeline transcripts (include="summary" returns just the threat). Fewer round-trips than get_threat + get_threat_simulations + get_threat_transcripts separately. The threat is the same bounded projection get_threat returns by default — call get_threat(id, sections="all") for the unabridged record.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)<br>`include` _string_ — "full" (default) bundles simulations + transcripts; "summary" returns just the threat<br>`simulation_limit` _integer_ — Playbooks to embed, 1-20 (default 3). Each carries full command text; raise only if you need more than the newest few.

### `get_threat_hunting_bundle`

Flagship one-call hunting dossier for a threat: threat detail + similar threats + simulations + infrastructure pivots, composed server-side. Best single tool to scope a hunt around one threat. Every section is bounded so the bundle fits in one response — raise simulation_limit / pivot_limit, or call get_infrastructure_pivots and get_threat directly, when you need the full lists.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)<br>`simulation_limit` _integer_ — Playbooks to embed, 1-20 (default 3).<br>`pivot_limit` _integer_ — Infrastructure pivots to embed, 1-200 (default 25). One threat can carry 150+; get_infrastructure_pivots returns the full set.<br>`shape` _string_ — "v1" (default, unchanged nested envelope) | "canonical" (flat, stably-named, SMALLER — recommended for programmatic consumers) | "both". In canonical: technique ids are a top-level `ttps` array, sectors/regions use ONE spelling, and every array key is ALWAYS an array (never null, never an object). In v1, `similar_threats` and `infrastructure_pivots` are handler envelopes (objects) while `threat.similar_threats` is a flat array — if you are writing a parser, use canonical.

### `bulk_get_threats`

Fetch up to 20 threats by ID in one call. Returns LEAN rows by default (identity, severity, attribution, CVEs, targets + `counts` for MITRE/IOCs/detections/timeline/tags), which is what makes 20 ids actually fit in one response. `count` is the number of rows actually present in threats[]; unresolvable ids come back in `missing`. detail="full" returns whole dossiers but is capped at 3 ids per call (a full dossier is ~68 KB) — the overflow is named in `deferred_ids`, never silently dropped. Drill into any row with get_threat(id).

**Arguments:** `threat_ids`**\*** _array_ — Threat IDs (max 20)<br>`detail` _string_ — "summary" (default, all 20 fit) | "full" (whole dossiers, max 3 ids per call)

### `get_threat_transcripts`

Get the PIPELINE PROVENANCE record for a threat — how its profile was produced, not analysis of the threat itself. Returns the 7 pipeline phases (HUNT/RESEARCH/SIMULATION/DETECT/PUBLISH/CORRELATION/TRANSCRIPT) with per-phase timing, the quality gates and their PASS/FAIL metrics (tag/technique/IOC/reference counts), an overall quality score, the inter-agent handoff log, and correlation_highlights (related threat ids and the high-frequency IOCs that linked them). The handoff messages are routing stubs and file pointers, NOT analyst prose — do not expect written reasoning about the adversary. Use this to judge how thoroughly a threat was worked and to find its related-threat/IOC leads; use get_threat or get_threat_enrichment for the analysis, and get_attribution_evidence for why it is attributed.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)


## L3 · Actor & attribution

Always check evidence state before repeating an attribution.

### `get_actor`

Get a lean threat-actor profile by name or alias: actor metadata, attribution counts, attributed-threat summary rows, MITRE tactic rollup + technique ids, IOC category counts (no raw values), CVE/CWE/tool summaries, and relationships. Tactic keys are canonicalised (the corpus writes both "Credential Access" and "credential-access") and the rollup counts DISTINCT TECHNIQUES per tactic; mitre.technique_ids is capped at 60 against mitre.techniques_total. relationships splits into shared_infra / shared_techniques / shared_tooling with the type re-derived from the value, because corr_attribution types tool names as hashes. An empty actor_relationships means UNRECORDED, not unrelated — see actor_relationships_coverage. For heavy detail use the follow-up tools: get_threat(id) for a full threat, search_detections / get_detection_detail for detection bodies, search_iocs for IOC values, get_infrastructure_pivots for shared infrastructure.

**Arguments:** `name`**\*** _string_ — Actor name or alias (e.g. 'APT29', 'Lazarus Group')

### `search_actors`

List attributed threat actors with aggregate stats (threat_count, severity levels, categories, nation_state). Returns the full roster in one call, or narrow it with the optional tool / malware / sector filters (e.g. tool="Cobalt Strike" → only actors that used it). Use get_actor for a single actor's full profile. Not paginated; the response carries a total count. Names are REPAIRED before they are returned: the corpus stores threat_actor as free text and comma-split it, so prose fragments and truncated parentheticals used to appear as adversaries — `label_hygiene` reports what was dropped and repaired. Two per-row flags matter: `role: "co-mention"` means the corpus never files a threat under that name as its primary attribution, and `also_grounded_as` means the corpus also records the name as a malware family or tool (e.g. SNOWLIGHT). Check both before reporting a row as an operator.

**Arguments:** `tool` _string_ — Only actors with a threat using this tool (e.g. "Cobalt Strike")<br>`malware` _string_ — Only actors with a threat deploying this malware family (e.g. "LockBit")<br>`sector` _string_ — Only actors with a threat targeting this sector (e.g. "Healthcare")

### `get_actor_intelligence`

Composite intelligence picture for a threat actor: the actor profile (threats, MITRE, IOC counts, CVEs, tooling, targets), the known actor_relationships baseline, plus cross-actor attribution SCOPED TO THIS ACTOR — only shared entities whose actor list names it or one of its aliases, ranked by attribution belief (shared malware/infrastructure outranks commodity TTPs). Use it to answer "who else does this actor overlap with, and on what evidence".

**Arguments:** `name`**\*** _string_ — Threat-actor name or alias (e.g. "APT29")

### `get_actor_relationships`

The platform's baseline of ALREADY-DOCUMENTED links between threat actors (subgroup / overlaps / similar / linked-to) with both uuids and the source. Call this before claiming any actor-to-actor relationship is new — it is the only surface that says whether a link is public knowledge. CRITICAL: this table is sparse, covering a small minority of the corpus's actor labels (the response carries live coverage numbers). An empty result means the link is UNRECORDED, never that it was disproved or that the actors are unrelated. Use it to rule a claim out of NOVELTY, never to rule a relationship out of EXISTENCE. Matches both slots, so it also returns rows where your actor is the target — get_actor's relationship list does not.

**Arguments:** `actor` _string_ — Optional: only rows naming this actor on either side (e.g. "Lazarus Group"). Omit to list the whole baseline.<br>`rel_type` _string_ — Optional: filter by relationship type. The response's coverage.rel_types lists what is actually present.<br>`limit` _integer_ — Default 50, max 200.

### `get_attribution_evidence`

Why a threat is attributed to an actor: the verdict, canonical actor, confidence, scope, the cited evidence chain, which signals fired, suspected alternatives and the analyst reasoning. Crucially it also reports `state` — whether this is a researched assessment or an unresearched intake stub — which threats.threat_actor alone cannot tell you.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-0989).

### `get_attribution_coverage`

Corpus-level attribution honesty: how many threats are genuinely assessed vs merely actor-labelled at ingest vs uncovered, broken down by confidence, scope and reason code, plus the research backlog, contradictions, top actors and the research clock (last real assessment, not last nightly intake).

**Arguments:** `actor` _string_ — Optional — scope the `recent` list to one actor.


## L4 · IOC & infrastructure

Exact value → intelligence; substring → search.

### `search_iocs`

Search indicators of compromise (IPs, domains, hashes, URLs). Filter by value substring and/or category. Pass limit (default 25, max 100); the result includes has_more (true when the page is full, so more may exist). NOTE: the indicator endpoint does not yet honor offset — narrow with a more specific value/type substring rather than paging.

**Arguments:** `value` _string_ — Substring to match against IOC values<br>`type` _string_ — IOC category (e.g. network, file, behavioral)<br>`limit` _number_ — Max results (default 25, max 100)

### `get_ioc_intelligence`

Get the composite intelligence dossier for one indicator: linked threats, actor attribution, related IOCs, and enrichment context in a single call. Prefer this over search_iocs when you already have an exact indicator value and want its full story.

**Arguments:** `value`**\*** _string_ — Exact indicator value (IP, domain, hash, or URL)

### `get_ioc_dns`

Return stored DNS enrichment for an IP or domain indicator (reverse-IP and subdomain records previously resolved and cached in the platform dataset). This reads stored data — it is NOT a live lookup at call time. Use get_ioc_intelligence for the full stored dossier.

**Arguments:** `value`**\*** _string_ — IP address or domain (stored DNS enrichment lookup)

### `get_ioc_blast_radius`

Map the blast radius of one indicator: the threats that contain it, the MITRE techniques those threats use, and the actors + sibling IOCs in the same campaigns. Matching is case-insensitive, and for a CVE the threat ring is the UNION of indicator rows and threats.cve_list (the authoritative CVE-to-threat mapping) — `coverage` reports which of the two produced how many, so a count can be traced to its source. `edge_scores` is a sampled graph_edges projection for fidelity context, never the denominator. Use this to scope impact of a single IOC; for a richer multi-source dossier on one indicator use get_ioc_intelligence instead.

**Arguments:** `value`**\*** _string_ — Indicator value (IP, domain, hash, URL, or CVE-XXXX-NNNN)<br>`depth` _number_ — Traversal rings to expand (1–3, default 3): 1=threats, 2=+techniques, 3=+actors & sibling IOCs

### `get_infrastructure_pivots`

For a given threat, surface cross-threat infrastructure links — shared IPs/domains/hashes and DNS-derived overlaps that tie it to other campaigns. Derived from the SAME indicator universe the correlation graph scores, so a pivot here and an ioc-basis edge in explain_correlation agree. Each pivot carries value_threat_count (2 = the value is nearly unique to this pair; 40 = commodity such as a Run key) and a rarity-derived confidence — read those before calling an overlap a link. `coverage` gives the denominator: pivot_count 0 with scorable_iocs > 0 is a REAL negative, pivot_count 0 with scorable_iocs 0 only means the threat carries no pivotable indicator. Labels (malware family, tool name, technique) are deliberately not pivotable — two write-ups naming the same family observed nothing in common. Use get_similar_threats for TTP/actor-based similarity instead.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)

### `get_c2`

Query the live C2 (command-and-control) intelligence center. Pick a view: 'beacons' (active C2 beacon snapshots — default), 'configs' (full extracted C2 configs), 'operators' (operator clusters), 'watermarks' (Cobalt Strike watermark index), 'correlations' (cross-C2 correlations), 'timeline' (activity over time), 'stats' (aggregate counts). Use generate_c2_blocklist when you want firewall-ready output rather than raw records.

**Arguments:** `view` = `beacons` \| `configs` \| `operators` \| `watermarks` \| `correlations` \| `timeline` \| `stats` — Which C2 dataset to return (default 'beacons')<br>`limit` _number_ — Max records for the record-bearing views — beacons (default 50), configs (default 25), correlations (default 25). Max 100.<br>`offset` _number_ — Skip this many records — 'correlations' only; the aggregate summary block stays whole across pages.

### `get_c2_dns_intel`

Reverse-DNS unmasking of C2 beacon infrastructure: which domains ride on each beacon IP, infrastructure fidelity (dedicated / mixed / shared), compromised-host flags and sample domains. Answers "what else lives on this C2 infrastructure". Filter by fidelity to separate adversary-owned infrastructure from shared hosting.

**Arguments:** `fidelity` = `dedicated` \| `mixed` \| `shared`<br>`compromised` _boolean_ — Only hosts flagged as compromised rather than adversary-owned.<br>`limit` _integer_ — Default 40, max 100.

### `generate_c2_blocklist`

Compile a firewall-ready C2 blocklist of active command-and-control IPs observed recently. Returns deduplicated network indicators ready to drop into a denylist. Use this for actionable blocking; use get_c2 with view="beacons" when you need the underlying beacon detail.

**Arguments:** _takes no arguments_


## L5 · Vulnerability

Rank by exploitation, not CVSS.

### `search_vulnerabilities`

Query the real-time CVE feed — validated against CVE.org and enriched from open sources (CVSS, EPSS exploitation probability, CISA KEV, public PoCs/exploits, nuclei detection templates, affected products/packages, plus platform-native trending/priority). Sort by trending|latest|priority|cvss|epss; filter by severity, kev (KEV-only), has_poc, nuclei, epss_min, window (days), vendor, cwe, or free-text query. Returns COMPACT cards {cve_id, severity, cvss, epss_percentile, is_kev, has_poc/exploit/nuclei, priority, trending, vendors, age} — call get_cve(id) for full detail.

**Arguments:** `query` _string_ — Free-text: a CVE id or keyword (matches id + description)<br>`sort` _string_ — trending (default) | latest | priority | cvss | epss<br>`severity` _string_ — CRITICAL | HIGH | MEDIUM | LOW<br>`kev` _boolean_ — Only CISA KEV (known-exploited) CVEs<br>`has_poc` _boolean_ — Only CVEs with a public proof-of-concept<br>`nuclei` _boolean_ — Only CVEs with a nuclei detection template<br>`epss_min` _number_ — Minimum EPSS exploitation probability, 0-1<br>`window` _number_ — Only CVEs published within the last N days<br>`vendor` _string_ — Affected vendor/product substring<br>`cwe` _string_ — Weakness id, e.g. CWE-79<br>`limit` _number_ — default 30, max 100

### `get_cve`

Look up a CVE by identifier (e.g. CVE-2024-3400): description, CVSS v2/v3/v4, EPSS, CISA KEV status, exploitation flags (PoC/exploit/nuclei), weaknesses (CWE ids), affected products, references, and linked threats. `threat_ids` is the LIVE join over threats.cve_list (threat_ids_source says so; threat_ids_note appears when the stale derived index disagreed, and any ids only that index held are surfaced separately in threat_ids_derived_only rather than merged) — it is the same linkage get_cve_intelligence reports. Enumerated pre-release CPEs are collapsed into ranges (affected_products_raw_count gives the uncollapsed count). enrichment_status distinguishes a fully enriched record from one merely seeded from KEV, where blank CVSS/EPSS means NOT MEASURED rather than measured-absent. For linked threats WITH titles/actors/detections/velocity in one call, prefer get_cve_intelligence.

**Arguments:** `cve_id`**\*** _string_ — CVE identifier (e.g. CVE-2024-3400)

### `get_cve_intelligence`

Composite CVE dossier in one call: the enriched CVE detail, the threats that reference it (authoritative join — cve.threat_ids is reconciled to it), the attributed actors and MITRE techniques behind those threats, weaponization velocity for THIS CVE with its rank against the corpus, CWE-sibling related CVEs, and detections that name it.

**Arguments:** `cve_id`**\*** _string_ — CVE identifier (e.g. CVE-2024-3400)

### `bulk_get_cves`

Fetch up to 20 enriched CVEs by ID in one call. Returns {cves, missing, count}.

**Arguments:** `cve_ids`**\*** _array_ — CVE IDs (max 20)

### `get_cwe`

Look up a CWE by identifier (e.g. CWE-79): weakness name, description, abstraction, MITRE likelihood_of_exploit, common consequences, detection methods, phased mitigations, related CWEs, the corpus threats that carry it, and related_cves - the corpus CVEs mapping to this weakness (top 20 by KEV then CVSS, with related_cve_count giving the true total; use search_vulnerabilities with cwe=<id> for the full list). NOTE: CWE has no CVSS severity - likelihood_of_exploit is the ontology's own High/Medium/Low rating, and severity_note says so; for scored severity read the related_cves rows or call get_cve. related_cves is null (never []) if the join could not run.

**Arguments:** `cwe_id`**\*** _string_ — CWE identifier (e.g. CWE-79)


## L6 · Detection & purple team

Only some of these return actual rule text.

### `get_detections`

List detection logic (Splunk SPL, Microsoft KQL, Sigma). Optionally filter by threat_id or detection type. Paginated: pass limit (default 15, max 100) and offset to page; the result includes has_more and an opaque next_cursor (reusable as offset/cursor).

**Arguments:** `threat_id` _string_ — Filter detections for a specific threat ID<br>`type` _string_ — Detection type: spl, kql, or sigma<br>`limit` _number_ — Max results (default 15, max 100)<br>`offset` _number_ — Row offset for pagination (default 0). Or pass cursor from a prior result.<br>`cursor` _string_ — Opaque pagination cursor (next_cursor from a prior result). Decoded to an offset; ignored when offset is given.

### `search_detections`

Keyword search across detection logic (SPL/KQL/Sigma) by rule text, technique, or threat. Optionally filter by type (spl|kql|sigma) or severity. Paginated via limit (default 25, max 200) + offset.

**Arguments:** `query`**\*** _string_ — Search term (rule text, CVE, technique, etc.)<br>`type` _string_ — Detection type: spl, kql, or sigma<br>`severity` _string_ — Filter by severity: critical, high, medium, low<br>`limit` _number_ — Max results (default 25, max 200)<br>`offset` _number_ — Row offset for pagination (default 0)

### `get_detection_detail`

Get the full detail for one detection rule by its ID, including the complete query text (SPL/KQL/Sigma), metadata, and the threat it maps to.

**Arguments:** `detection_id`**\*** _string_ — Detection ID

### `export_detection`

Export one detection rule in a specific format. format=spl|kql|sigma returns the raw query text for that flavor; format=json returns the full detection object.

**Arguments:** `detection_id`**\*** _string_ — Detection ID<br>`format`**\*** _string_ — spl, kql, sigma, or json

### `get_threat_simulations`

DEPRECATED (generation stopped 2026-08-03; ~5,362 archived rows still served, no new ones are produced) — the response carries deprecated:true and the caveat inline. Adversary-emulation playbooks attached to a threat. Most were synthetic-telemetry generators against local mocks rather than real execution, so they could not trigger the platform's own detections. One threat's playbooks can run 30 KB+ of command text: narrow with platform (see available_platforms) and limit. An empty result carries a `reason` distinguishing "this threat never had any" from "none for that platform". Prefer get_attack_flow, which returns the analyst-authored causal DAG that replaced them.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)<br>`platform` _string_ — Return only this platform: windows, linux, python (also aws, macos, multi on a few rows). Omit for all.<br>`limit` _number_ — Max playbooks to return (max 50). Omit for all — bodies are large.

### `list_simulations`

DEPRECATED (generation stopped 2026-08-03; archived rows only). List adversary-emulation simulation scenarios across the platform (atomic test commands grouped by threat). `total` / `total_simulations` are CORPUS-wide; the page you got is `returned` / `page_simulations`, and `has_more` + `next_offset` walk the rest. The `correlation` block (shared_techniques, attack_chain_similarities, platform/tactic coverage) is computed over the RETURNED PAGE only — it carries scope:"page" and changes with limit. Pass limit (default 50, max 200) and offset. include_facets=true adds the corpus filter vocabulary (~20 KB of actor/nation/category strings) — off by default. Prefer get_flow_coverage and get_attack_flow — ATT&CK Flows replaced simulations.

**Arguments:** `limit` _number_ — Max threats in this page (default 50, max 200)<br>`offset` _number_ — Row offset for paging (default 0). Use next_offset from the previous response.<br>`include_facets` _boolean_ — Include the corpus filter vocabulary (filter_meta). Default false — it is ~20 KB and does not shrink with limit.

### `get_mitre_gap_analysis`

Prioritized list of MITRE ATT&CK techniques with the weakest detection coverage (detection debt), ranked by debt_score = attributed threats / (1 + detection rules mapping the technique or its parent), scaled by exploitability (max EPSS / KEV of the CVEs its threats weaponize) and rarity. Higher = more exposure with less rule coverage. Filter by tactic (spelling-insensitive: "execution", "Execution" and "Execution (ICS)" all match) and cap with limit; summary.gaps/coverage_pct describe the FILTERED corpus, not the returned page.

**Arguments:** `tactic` _string_ — Filter to one ATT&CK tactic (e.g. "execution", "defense-evasion", "command-and-control"). An unmatched value returns summary.available_tactics.<br>`limit` _number_ — Max techniques (default 20, max 100). Rows come back debt_score-descending, so limit=N is the top-N worst.


## L7 · MITRE ATT&CK

predict_mitre_transitions is sequence; get_technique_rules is co-occurrence.

### `get_mitre_coverage`

Get MITRE ATT&CK coverage across the platform. Optionally filter by tactic.

**Arguments:** `tactic` _string_ — Filter by ATT&CK tactic (e.g. "initial-access")

### `get_mitre_technique`

Get details for a specific MITRE ATT&CK technique by ID (e.g. T1059 or T1059.001): authoritative name, tactics, matrix, revocation status, mitigations, detection data sources, and the corpus threats using it. The threat list is paged — a heavily-used technique attaches hundreds of threats, so pass include_threats=false for the definition alone (a few KB), or limit/offset to page. threat_count always reports the true total.

**Arguments:** `technique_id`**\*** _string_ — Technique ID (e.g. T1059 or T1059.001)<br>`include_threats` _boolean_ — Set false to return the technique definition WITHOUT the threat list (default true). Use this when you only need the name/tactic/mitigations.<br>`limit` _number_ — Max threats to return (default 50, max 500)<br>`offset` _number_ — Threat-list row offset for paging (default 0)

### `predict_mitre_transitions`

Predict the MITRE ATT&CK techniques most likely to follow (or precede) a given technique, with probabilities and example threats. Each row carries order_basis: 'attack_flow' rows come from analyst-authored ATT&CK Flow DAGs (real asserted causality), 'mitre_canonical' rows are inferred by sorting a threat's flat technique set by canonical tactic rank, and 'blended' rows have both. Prefer attack_flow evidence: ~24% of real transitions run against canonical tactic order and are inexpressible by the canonical basis. Use forward to anticipate the next step; reverse to infer what came before.

**Arguments:** `technique_id` _string_ — Source technique ID (e.g. T1059 or T1059.001)<br>`direction` = `forward` \| `reverse` — 'forward' = techniques that typically follow (default); 'reverse' = techniques that typically precede<br>`top_n` _number_ — Max transitions to return (default 5, max 20)<br>`basis` = `any` \| `attack_flow` \| `blended` \| `mitre_canonical` — Filter by evidence basis. Default 'any' (unfiltered, byte-identical to previous behaviour). Use 'attack_flow' for authored-causality rows only.

### `get_technique_rules`

MITRE ATT&CK technique PAIRS mined from the corpus with support, confidence and lift — which techniques travel together far above chance. Each rule carries both technique ids AND their ATT&CK names (technique_a_name / technique_b_name), so a rule is readable without a follow-up lookup. Complements predict_mitre_transitions exactly: that answers sequence (what follows what), this answers co-occurrence (what appears alongside what). Rules come back lift-descending; `summary.total_rules` reports how many exist in total, so `has_more` tells you whether the tail was cut. Note minSupport 0.02 — a pair must appear in ~2% of threats to be mined at all, so rare-technique pairs are structurally absent rather than uncorrelated.

**Arguments:** `limit` _integer_ — Default 50, max 100.


## L8 · Correlation graph

Start shallow. Depth multiplies node count.

### `get_similar_threats`

Threats similar to a given threat, with the EVIDENCE behind each link: per-channel score breakdown, which signal dominates, the concrete shared techniques / IOCs / CVEs, and quality flags for stale or high-confidence-low-evidence links. Use explain_correlation for a full decomposition of one specific pair.

**Arguments:** `id`**\*** _string_ — Source threat ID (e.g. TL-2026-0042)<br>`limit` _number_ — Max results (default 10, max 20 — the handler caps here).

### `explain_correlation`

Why two threats are linked: the per-channel similarity decomposition (techniques, IOCs, CVEs, products, CWEs, context), which channel dominates and by how much, the concrete shared artifacts, the signal count, and quality flags for high-confidence/low-evidence and stale links. Use when get_similar_threats gives a score and you need the evidence behind it. Pass the pair in either order. Returns 404 when the engine has no edge between them.

**Arguments:** `threat_a`**\*** _string_ — First threat ID.<br>`threat_b`**\*** _string_ — Second threat ID.

### `get_correlation_path`

Shortest evidence path between two threats across the similarity graph: the intermediate threats, each hop's dominant linking signal and shared artifacts, and the weakest-link strength of the whole path. Answers "is this incident connected to that campaign, and through what". Returns found:false with a reason (no edges vs different components) rather than an empty array.

**Arguments:** `from`**\*** _string_ — Starting threat ID.<br>`to`**\*** _string_ — Target threat ID.<br>`max_hops` _integer_ — Search depth, 1-8 (default 6).

### `get_entity_profile`

One-call dossier for any node in the intelligence graph — threat, technique, actor, IOC or CVE. Returns its centrality/pivot rank, top graph neighbours with edge fidelity, and type-specific rollups (linked threats, techniques with risk scores, IOCs with consensus and rarity, campaigns, related CVEs). Best token-per-call ratio in the graph family: replaces five or six separate lookups. Neighbours on the NPMI edge types also carry raw pmi, co_occurrence_count and the marginals {c, df_actor, df_tech, N}. For technique and ioc nodes the response includes `rarity` — corpus_df (how many threats mention it) against corpus_n — which is what separates a distinctive shared technique from background noise; check `top_neighbors_truncated` and raise `limit` before concluding a neighbour is absent.

**Arguments:** `node_type`**\*** = `threat` \| `technique` \| `actor` \| `ioc` \| `cve`<br>`node_id`**\*** _string_ — The entity id/value (TL- id, T-number, actor name, IOC value, or CVE id).<br>`limit` _integer_ — Neighbours in top_neighbors (default 20, max 100 over MCP). They are ordered by fidelity, so the rare low-fidelity edges are the ones a small limit drops.

### `get_correlation_subgraph`

The N-hop neighbourhood around any graph node — nodes, edges, and each edge's fidelity — for incremental exploration of the correlation graph. Start at depth 1 and expand: a whole-corpus graph exceeds every response budget. For a pre-aggregated single-entity view prefer get_entity_profile, which is cheaper and usually what you want; use this when you need the actual edge topology. Edges of the NPMI types (actor_technique, technique_cooccurrence) also carry the raw pmi, co_occurrence_count and the marginals {c, df_actor, df_tech, N} the score was computed from — use those, not the rounded fidelity, to compare two edges.

**Arguments:** `seed_type`**\*** = `threat` \| `technique` \| `actor` \| `ioc` \| `cve`<br>`seed_id`**\*** _string_ — The entity id/value to expand from.<br>`depth` _integer_ — Hops, 1-3 (default 1). Each hop multiplies the node count.<br>`min_fidelity` _number_ — Drop edges below this fidelity. Scale is 0-100, NOT 0-1 — typical NPMI edges sit between 5 and 30, so 0.5 filters nothing.<br>`edge_type` = `actor_technique` \| `technique_cooccurrence` \| `ioc_threat` \| `threat_similarity` — Keep only edges of this type (also prunes the traversal, so it changes which nodes are reachable). Omit for all types.<br>`limit_nodes` _integer_ — Default 40, max 60 over MCP.<br>`limit_edges` _integer_ — Default 80, max 120 over MCP.

### `get_pivotal_entities`

The hubs and bridges of the intelligence graph ranked by weighted degree and approximate betweenness — where a single detection buys the most coverage. NOTE: betweenness is an ego-bridge heuristic, not exact Brandes; the response says so in `note`. Do not present it as exact betweenness.

**Arguments:** `node_type` = `threat` \| `technique` \| `actor` \| `ioc` \| `cve`<br>`limit` _integer_ — Default 25, max 100.

### `get_graph_campaigns`

Campaign clusters the engine assembled from the similarity graph (connected components + label propagation): label, cohesion, top actors/techniques/IOCs/nation-states, and per-member {title, created_at, category, threat_actor}. Each cluster carries duplicate_risk plus its evidence (distinct_member_dates, date_span_days, shared_title_tokens) — a similarity-derived cluster of one event documented several times looks identical to a real multi-event campaign until you read those. Distinct from get_campaign_intelligence (looks up a NAMED campaign from threat text) and from list_campaigns (the roster of named campaigns); this one reports clusters the engine derived itself.

**Arguments:** `limit` _integer_ — Default 15, max 50.

### `get_correlations`

Read precomputed cross-dataset correlations. Choose an engine: 'overview' (rollup of all engines — default), 'mitre-heatmap', 'adversary-infra', 'ioc-consensus', 'cve-velocity', 'attribution', 'detection-debt', or 'enrichment'. Use 'overview' first to see what's available, then drill into a specific engine.

**Arguments:** `engine` = `overview` \| `mitre-heatmap` \| `adversary-infra` \| `ioc-consensus` \| `cve-velocity` \| `attribution` \| `detection-debt` \| `enrichment` — Which correlation engine to read (default 'overview')<br>`limit` _number_ — Paged engines only ('mitre-heatmap', 'ioc-consensus', 'detection-debt'): max rows, pre-ordered by score (default 50; max 200 for mitre-heatmap, 500 for the others). The summary block always covers the full set.<br>`offset` _number_ — Paged engines only: skip this many rows.


## L9 · Attack flow, D3FEND & ATLAS

Authored causal DAGs and their defensive twin. Flow similarity is ordered-sequence, NOT the blended correlation score — the channel is still gated off.

### `get_attack_flow`

Get the analyst-authored MITRE ATT&CK Flow for a threat: a causal DAG of actions, conditions, operators and assets, with per-node technique ids, tactics and descriptions. This is asserted causality — what actually caused what — not a flat technique list. Check `generator`: 'harness' is authored, 'derived' is timeline ORDERING and must not be read as causality. Use get_flow_similar_threats to find threats sharing a causal sequence.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-1916)<br>`view` = `ir` \| `nodes` — 'ir' (default) returns the compact flow IR plus validation findings; 'nodes' returns the denormalized node/edge/asset projection with technique and tactic columns already joined.

### `get_flow_similar_threats`

Find threats that share a causal SEQUENCE of techniques with this one, scored by ordered-bigram cosine over ATT&CK Flow transitions. This sees what no other channel can: every existing similarity signal compares flat sets, so two threats can share an identical attack ORDER while sharing no indicator, CVE or actor. Returns the shared transitions (e.g. 'T1003>T1021') so the claim is inspectable. Scored independently and NOT folded into get_similar_threats' blended score.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-1916)<br>`limit` _integer_ — Max neighbours (default 20, max 100)<br>`min_score` _number_ — Drop neighbours below this sim_flow (0-1)

### `get_flow_coverage`

How much of the corpus carries an authored ATT&CK Flow, split by provenance, plus flow node/transition/path-similarity totals and whether the flow similarity channel has met its coverage gate. Call this before reasoning over flow data so you know the denominator — flow-derived findings only speak to the covered slice.

**Arguments:** _takes no arguments_

### `get_d3fend_posture`

Get the defensive twin of a threat's ATT&CK mapping: offensive technique to digital artifact to D3FEND countermeasure, plus coverage by defensive tactic. Use to answer 'what would have stopped this'. COVERAGE: 197 of 1,891 threats carry a mapping, so absence is common and is not an error — a threat that exists with no mapping answers 200 with an empty `mappings` and a `reason` saying whether it has no techniques at all or techniques the ontology has no countermeasure for; only an unknown threat id answers 404. IMPORTANT: this is a deterministic projection of the threat's techniques through a static ontology — two threats sharing countermeasures almost always just share techniques, so never treat countermeasure overlap as independent correlation evidence.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-1916)<br>`limit` _integer_ — Raw technique x countermeasure pairs in `mappings` (default 60, max 500). `countermeasures` always rolls up ALL pairs regardless, so the default loses no information — raise this only if you need the individual pairings.

### `get_atlas_intelligence`

MITRE ATLAS technique co-occurrence for threats that attack AI/ML systems — prompt injection, agent-tool abuse, context and memory poisoning, cost harvesting. `data` returns pairs whose BOTH endpoints are real ATLAS ids (^AML.), with cooccurrence_count, support, confidence and lift; free-text publish labels ("Prompt Injection", "Tool Poisoning") are returned SEPARATELY in `tag_pairs` and are not ATLAS techniques. SMALL-N WARNING: the corpus holds 106 pairs of which only 10 were observed more than once, so min_cooccurrence defaults to 2. Lower it and you get rows where confidence=1.0 and lift=1/support are arithmetic on a single observation — those carry single_observation:true; do not report them as associations. Ranked by cooccurrence_count, then lift.

**Arguments:** `limit` _integer_ — Max pairs per list (default 50, max 100)<br>`min_cooccurrence` _integer_ — Minimum times the two techniques were seen together. Default 2 (the honest set). 1 includes single-observation pairs, which are flagged single_observation:true.


## L10 · Malware / tool / campaign

Route by entity kind; resolve_entity when unsure.

### `get_malware_intelligence`

Pivot on a malware FAMILY by name (e.g. "LockBit", "Vidar", "Emotet"). Returns the canonical family + type, prevalence (threat/actor counts, first/last seen), the threats deploying it, the actors using it, and its most-common ATT&CK techniques. For an offensive TOOL (Cobalt Strike, Mimikatz) use get_tool_intelligence instead. Call resolve_entity first if unsure of the canonical name.

**Arguments:** `name`**\*** _string_ — Malware family name (e.g. "LockBit", "Vidar")

### `get_tool_intelligence`

Pivot on an offensive tool / utility / RMM / LOLBin by name (e.g. "Cobalt Strike", "Mimikatz", "AnyDesk", "PsExec"). Returns the canonical tool + class, prevalence, the threats and actors using it, and its most-common ATT&CK techniques. prevalence.actor_count is the TRUE distinct-actor total; the actors[] array is clipped to the top 20 (see prevalence.actors_returned) — do not read its length as the population.

**Arguments:** `name`**\*** _string_ — Tool name (e.g. "Cobalt Strike", "Mimikatz")

### `get_campaign_intelligence`

Pivot on a named campaign / operation by name (e.g. "Snowflake campaign", "ClickFix"). Returns the threats in the campaign, the actors involved, prevalence, and common ATT&CK techniques. Membership is the UNION of the curated threat_campaign_refs table and threats whose own TITLE names the campaign, because the curated table is thin (ClickFix: 7 curated rows against 57 threats that name it). Each threat carries matched_via (grounded | title | grounded+title) and the response carries a `membership` breakdown — neither source is complete, so treat `title` rows as leads and check them before calling them members.

**Arguments:** `name`**\*** _string_ — Campaign / operation name

### `list_campaigns`

Roster of NAMED campaigns/operations referenced by the corpus, with the actors, nation-states, date range and member threats behind each. Answers the campaign-lineage question the other tools cannot: get_campaign_intelligence needs you to already know a name, and get_graph_campaigns only reports the engine's own similarity clusters. Filter with min_actors to find campaigns carrying two or more distinct actors. Each member carries `text_supported` — whether the campaign name literally occurs in that threat's own record — because the underlying table has no provenance column and at least one row attaches a threat to a campaign with no textual basis, manufacturing a cross-nation link. Check `unsupported` and `cross_nation` before treating campaign co-membership as correlation evidence.

**Arguments:** `min_actors` _integer_ — Only campaigns with at least this many DISTINCT actor labels (e.g. 2 for multi-actor campaigns).<br>`limit` _integer_ — Default 50, max 200.


## L11 · Community OSINT

Corroborating, never authoritative.

### `get_osint`

Community corroboration for a threat or an indicator from the TL_OSINT_Scan layer (tweetfeed.live, CC0). Given threat_id, returns the matched community tags, the corroborated indicator count, and whether the community saw an indicator BEFORE our report. Given ioc_value, returns sightings, reporters, tags and every linked threat. Community-sourced and heavily concentrated (~73% of recent submissions come from a single reporter) — treat as corroborating evidence, never as authoritative attribution.

**Arguments:** `threat_id` _string_ — Threat ID (e.g. TL-2026-1531). Returns the per-threat corroboration block.<br>`ioc_value` _string_ — Exact indicator (IP, domain, URL, MD5 or SHA256). Returns the community lookup + our linked threats.

### `search_xscan_indicators`

Search the canonical community-indicator set (TL_OSINT_Scan / tweetfeed.live, CC0) — indicators the community reported that were also matched against our corpus. Filter by tag, type, ASN, country, minimum linked-threat count, or a value substring. There is deliberately NO family filter: the upstream AI family field is populated on under 1% of rows, so a family argument would return nothing. Use tag instead (community tags carry the family signal). Community-sourced and heavily concentrated (~73% of recent submissions come from a single reporter) — corroborating, not authoritative.

**Arguments:** `tag` _string_ — Community tag substring, case-insensitive and normalized (e.g. phishing, asyncrat, c2)<br>`type` = `ip` \| `domain` \| `url` \| `sha256` \| `md5` — Indicator type<br>`asn` _string_ — Autonomous system, e.g. AS14061<br>`country` _string_ — Two-letter country code, e.g. RU<br>`min_threats` _number_ — Only indicators linked to at least this many of our threats<br>`q` _string_ — Substring match on the indicator value<br>`limit` _number_ — Max rows (default 25, max 100)<br>`offset` _number_ — Row offset for paging

### `get_osint_trends`

What the security community is surging on right now (tweetfeed.live, CC0), joined against our own corpus coverage: trending tags with movement, TLD distribution, novelty, top producers, daily volume — plus `corpus` (how much of our corpus the community corroborates) and `early_warning` (the lead-time distribution). The coverage-gap and lead-time read; the corpus join exists nowhere else. Keyed on community TAGS, not malware family (populated on <1% of upstream rows).

**Arguments:** _takes no arguments_

### `get_community_campaigns`

Campaign clusters from the community OSINT layer (tweetfeed.live, CC0): cluster name, confidence, targeted brand, first/last seen, indicator count and types, tags and reporters. Cluster labels are UPSTREAM AI output, not Threadlinqs attribution — do not present them as our assessment. On an upstream proxy failure the response carries community_error rather than erroring; report "community feed unavailable", not "no campaigns".

**Arguments:** `limit` _integer_ — Default 15, max 50.


## L12 · Reporting & landscape

One bundle usually beats four calls.

### `get_daily_intel_bundle`

One-shot "what happened" bundle: the day's debrief (latest by default, or pass date) plus platform stats, the top recent threats as LEAN summary rows, and the correlations overview. Drill into any listed threat with get_threat(id).

**Arguments:** `date` _string_ — Debrief date YYYY-MM-DD (default: latest)<br>`top_n` _number_ — How many top threats to include (default 5, max 10)

### `get_latest_debrief`

Get the most recent daily intelligence debrief in full detail (resolves the latest date for you).

**Arguments:** _takes no arguments_

### `get_debrief`

Get the full daily intelligence debrief for a specific calendar date (YYYY-MM-DD): posture summary, themes, threats grouped by severity, MITRE coverage, IOC distribution, actor attribution, and detection status. Find available dates first with list_debriefs.

**Arguments:** `date`**\*** _string_ — Debrief date in YYYY-MM-DD format (e.g. 2026-05-30)

### `list_debriefs`

List recent daily intelligence debriefs (newest first) with their per-day rollups: new/updated threats, the day's theme, top categories and actors, severity counts, mitre_technique_count (+ mitre_techniques_sample, the first 10 of an alphabetically-sorted ID list — NOT a top-10), and ioc_breakdown by type with ioc_total. Enough to pick the day worth drilling into without fetching each one; use get_debrief for a date's full detail (all techniques, per-threat lists, highlights). Pass limit (default 30, max 100); the result includes has_more (true when the page is full, so older debriefs may exist). NOTE: the debriefs endpoint does not yet honor offset — it serves the most recent window.

**Arguments:** `limit` _number_ — Max debriefs to return (default 30, max 100)

### `get_landscape_briefing`

Get the latest threat-landscape briefing — a synthesized posture summary of recent threat activity. `latest` is the most recent briefing that is a REAL synthesis: the narrative model currently fails on most hourly runs, and a failed run still writes a one-bullet automated posture stub, so the newest row is usually not a summary at all. When a fallback is served the response says so (latest_is_fallback + fallback_note naming both dates) and `latest_age_hours` gives its age; `briefings[0]` is always the newest regardless of quality, and every row carries is_synthesis. narrative_ok reports whether the newest run produced a real narrative.

**Arguments:** _takes no arguments_

### `get_daily_theme`

Get the recent daily landscape themes (newest first, 14 days) with each day's top 6 threat tags. `tags` is recomputed LIVE over that date's threats, ranked count-descending with an alphabetical tie-break, and `tags_source` says whether a row used the live rollup ('live'), the stored nightly snapshot ('snapshot') or had no tags at all ('none') — `tags_available` is the boolean. The theme SENTENCE is generated just after midnight ET, before the day's ingest finishes, so `theme_note`/`snapshot_threat_count` disclose how many of the day's threats it was actually written from; when they disagree, trust `tags`.

**Arguments:** _takes no arguments_

### `get_threat_level`

Get the computed current threat-landscape level (a 0–25 rating of overall posture).

**Arguments:** _takes no arguments_


## L13 · Standards export

For handing data to another system.

### `export_stix`

Export a threat, actor, or CVE as a STIX 2.1 bundle for ingestion into a TIP/SIEM. Provide at least one of threat_id, actor, or cve_id. Returns a {type:"bundle", objects:[...]} with indicator (per IOC), attack-pattern (per MITRE technique), intrusion-set (actor), vulnerability (CVE), malware/threat-actor, and relationship objects. Set include_osint=true to add `sighting` SROs for indicators the community independently reported (TL_OSINT_Scan / tweetfeed.live, CC0) — community-sourced and heavily concentrated, so they carry x_threadlinqs_trust="community-unverified". The bundle is capped (≤200 objects / ≤80KB); a note object is appended if truncated.

**Arguments:** `threat_id` _string_ — Threat ID to export (e.g. TL-2026-0042)<br>`actor` _string_ — Threat-actor name or alias to export (e.g. "APT29")<br>`cve_id` _string_ — CVE identifier to export (e.g. CVE-2024-3400)<br>`include_osint` _boolean_ — Add community `sighting` objects for corroborated indicators (default false)

### `export_attack_navigator`

Export a MITRE ATT&CK Navigator layer (enterprise-attack) for visualization. Pass actor=<name> to score techniques attributed to one actor, or all=true for platform-wide coverage. score is PER TECHNIQUE — the number of corpus threats using it (for the actor, or platform-wide) — so the heatmap ranks within a tactic, not just between tactics; the unit is stated in the layer's description and metadata. Returns {name, versions, domain, description, techniques:[{techniqueID, score, color, comment}], gradient, metadata}. Capped at 600 techniques; when the tail is dropped, metadata carries a 'truncated' entry saying so. ATLAS (AML.*) and non-enterprise ids are excluded, since the layer domain is enterprise-attack.

**Arguments:** `actor` _string_ — Threat-actor name or alias whose techniques to score (e.g. "APT29")<br>`all` _boolean_ — If true, build a platform-wide coverage layer from MITRE coverage instead of a single actor

