# Tool reference — all 73 tools

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

Health and coverage overview of the enrichment sources (CVE/EPSS/KEV, IOC reputation, DNS, etc.) feeding the platform.

**Arguments:** _takes no arguments_

### `get_changelog`

Get the recent platform changelog (new threats, detections, features). Pass limit (default 20, max 100).

**Arguments:** `limit` _number_ — Max entries (default 20, max 100)

### `get_roadmap`

Get the Threadlinqs Intelligence platform roadmap — shipped, in-progress, and planned capabilities.

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

Run a deterministic SIEM-style query over the pre-joined observation index (~106k rows across tool, malware, ioc, mitre, cve, attribution, dns and infra observations). Use this INSTEAD of chaining many search_threats calls when the question is an aggregate ("how many X grouped by Y") or crosses observation types ("threats using tool A that also have IOC type B"). Append "| stats count by <field>" to aggregate; without it you get matching rows. Call hunt_schema first if you do not know the field names.

**Arguments:** `query`**\*** _string_ — TLQL, e.g. `tool = "cobalt strike" AND sector = "healthcare" | stats count by nation`<br>`limit` _integer_ — Row cap for non-stats queries (default 50, max 150). Ignored in stats mode.

### `hunt_schema`

The hunt query grammar: every filterable field and alias, which fields are scoped observables vs denormalized, the operators, the stats-pipe form, worked examples, and how fresh the index is. Call once before writing a hunt query.

**Arguments:** _takes no arguments_

### `resolve_entity`

Normalize an actor / malware / tool / sector / region / technique name or alias to its canonical reference form + stable UUID (e.g. "fancy bear" → "APT28"). Call this BEFORE pivoting (get_actor / get_malware_intelligence / get_tool_intelligence / search_threats) when unsure of the canonical name. Optional type narrows the lookup.

**Arguments:** `name`**\*** _string_ — Name or alias to resolve<br>`type` _string_ — Optional: actor|malware|tool|sector|region|technique|campaign

### `list_threat_categories`

List every threat category with its threat count across the whole corpus. Use to discover valid category filters for search_threats.

**Arguments:** _takes no arguments_

### `get_recent_threats`

List the most recently published threats. Paginated: pass limit (default 15, max 100) and offset to page through older threats; the result includes has_more and an opaque next_cursor (reusable as offset/cursor).

**Arguments:** `limit` _number_ — Max results (default 15, max 100)<br>`offset` _number_ — Row offset for pagination (default 0). Or pass cursor from a prior result.<br>`cursor` _string_ — Opaque pagination cursor (next_cursor from a prior result). Decoded to an offset; ignored when offset is given.


## L2 · Threat dossier

Prefer a bundle over a chain.

### `get_threat`

Get the full detail for a single threat by its ID (e.g. TL-2026-0042): overview, MITRE techniques, IOCs, detections, timeline, and tags. For that threat's malware families, tools, targeted sectors/regions, affected OS and campaigns, call get_threat_enrichment.

**Arguments:** `id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)

### `get_threat_enrichment`

Reference-grounded enrichment for one threat by ID: the malware families and tools used, targeted sectors/regions, affected operating systems, named campaigns, AI/ML (ATLAS) techniques, and per-technique mitigations + detection data sources. Complements get_threat (overview/MITRE/IOCs/detections) — call this for the "what malware/tools were used and who was targeted" view.

**Arguments:** `id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)

### `get_threat_bundle`

One-shot dossier for a threat: the full threat detail plus its simulations and analysis transcripts (include="summary" returns just the threat). Fewer round-trips than calling get_threat + get_threat_simulations + get_threat_transcripts separately.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)<br>`include` _string_ — "full" (default) bundles simulations + transcripts; "summary" returns just the threat

### `get_threat_hunting_bundle`

Flagship one-call hunting dossier for a threat: full detail + similar threats + simulations + infrastructure pivots, composed server-side. Best single tool to scope a hunt around one threat.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)

### `bulk_get_threats`

Fetch up to 20 threats by ID in one call. Returns {threats, missing, count}. Use when you already have a list of threat IDs.

**Arguments:** `threat_ids`**\*** _array_ — Threat IDs (max 20)

### `get_threat_transcripts`

Get the AI agent analysis transcripts for a threat — the step-by-step reasoning the research agents produced while profiling it.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)


## L3 · Actor & attribution

Always check evidence state before repeating an attribution.

### `get_actor`

Get a lean threat-actor profile by name or alias: actor metadata, attribution counts, attributed-threat summary rows, MITRE tactic rollup + technique ids, IOC category counts (no raw values), CVE/CWE/tool summaries, and relationships. For heavy detail use the follow-up tools: get_threat(id) for a full threat, search_detections / get_detection_detail for detection bodies, search_iocs for IOC values, get_infrastructure_pivots for shared infrastructure.

**Arguments:** `name`**\*** _string_ — Actor name or alias (e.g. 'APT29', 'Lazarus Group')

### `search_actors`

List attributed threat actors with aggregate stats (threat_count, severity levels, categories, nation_state). Returns the full roster in one call, or narrow it with the optional tool / malware / sector filters (e.g. tool="Cobalt Strike" → only actors that used it). Use get_actor for a single actor's full profile. Not paginated; the response carries a total count.

**Arguments:** `tool` _string_ — Only actors with a threat using this tool (e.g. "Cobalt Strike")<br>`malware` _string_ — Only actors with a threat deploying this malware family (e.g. "LockBit")<br>`sector` _string_ — Only actors with a threat targeting this sector (e.g. "Healthcare")

### `get_actor_intelligence`

Composite intelligence picture for a threat actor: the full actor profile plus cross-actor attribution correlations in one call.

**Arguments:** `name`**\*** _string_ — Threat-actor name or alias (e.g. "APT29")

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

Map the blast radius of one indicator: the threats that contain it, the MITRE techniques those threats use, and the actors + sibling IOCs in the same campaigns. Use this to scope impact of a single IOC; for a richer multi-source dossier on one indicator use get_ioc_intelligence instead.

**Arguments:** `value`**\*** _string_ — Indicator value (IP, domain, hash, URL, or CVE-XXXX-NNNN)<br>`depth` _number_ — Traversal rings to expand (1–3, default 3): 1=threats, 2=+techniques, 3=+actors & sibling IOCs

### `get_infrastructure_pivots`

For a given threat, surface cross-threat infrastructure links — shared IPs/domains and DNS-derived overlaps that tie it to other campaigns. Use to widen from a single threat to its infrastructure neighborhood; use get_similar_threats for TTP/actor-based similarity instead.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)

### `get_c2`

Query the live C2 (command-and-control) intelligence center. Pick a view: 'beacons' (active C2 beacon snapshots — default), 'configs' (full extracted C2 configs), 'operators' (operator clusters), 'watermarks' (Cobalt Strike watermark index), 'correlations' (cross-C2 correlations), 'timeline' (activity over time), 'stats' (aggregate counts). Use generate_c2_blocklist when you want firewall-ready output rather than raw records.

**Arguments:** `view` = `beacons` \| `configs` \| `operators` \| `watermarks` \| `correlations` \| `timeline` \| `stats` — Which C2 dataset to return (default 'beacons')<br>`limit` _number_ — Max records for paginated views like beacons (default 50, max 100)

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

Look up a CVE by identifier (e.g. CVE-2024-3400): description, CVSS, affected products, references, and linked threats.

**Arguments:** `cve_id`**\*** _string_ — CVE identifier (e.g. CVE-2024-3400)

### `get_cve_intelligence`

Composite CVE dossier: the enriched CVE detail plus exploitation-velocity context and any detections that reference it, in one call.

**Arguments:** `cve_id`**\*** _string_ — CVE identifier (e.g. CVE-2024-3400)

### `bulk_get_cves`

Fetch up to 20 enriched CVEs by ID in one call. Returns {cves, missing, count}.

**Arguments:** `cve_ids`**\*** _array_ — CVE IDs (max 20)

### `get_cwe`

Look up a CWE by identifier (e.g. CWE-79): weakness name, description, severity, related CVEs, and mitigation guidance.

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

Get the adversary-emulation / simulation playbooks attached to a threat — step-by-step commands by platform for safely reproducing the behavior in a lab. Use to operationalize detection testing for a specific threat.

**Arguments:** `threat_id`**\*** _string_ — Threat ID (e.g. TL-2026-0042)

### `list_simulations`

List adversary-emulation simulation scenarios across the platform (atomic test commands grouped by threat). Pass limit (default 50, max 200).

**Arguments:** `limit` _number_ — Max results (default 50, max 200)

### `get_mitre_gap_analysis`

Prioritized list of MITRE ATT&CK techniques with the weakest detection coverage (detection debt), so you can target where to build detections next. Optionally filter by tactic.

**Arguments:** `tactic` _string_ — Filter to one ATT&CK tactic (e.g. "execution")<br>`limit` _number_ — Max techniques (default 20, max 100)


## L7 · MITRE ATT&CK

predict_mitre_transitions is sequence; get_technique_rules is co-occurrence.

### `get_mitre_coverage`

Get MITRE ATT&CK coverage across the platform. Optionally filter by tactic.

**Arguments:** `tactic` _string_ — Filter by ATT&CK tactic (e.g. "initial-access")

### `get_mitre_technique`

Get details for a specific MITRE ATT&CK technique by ID (e.g. T1059 or T1059.001).

**Arguments:** `technique_id`**\*** _string_ — Technique ID (e.g. T1059 or T1059.001)

### `predict_mitre_transitions`

Predict the MITRE ATT&CK techniques most likely to follow (or precede) a given technique, with observed probabilities and example threats. Use forward to anticipate the next step in a kill chain; reverse to infer what came before. Pair with get_mitre_technique for the technique definition.

**Arguments:** `technique_id` _string_ — Source technique ID (e.g. T1059 or T1059.001)<br>`direction` = `forward` \| `reverse` — 'forward' = techniques that typically follow (default); 'reverse' = techniques that typically precede<br>`top_n` _number_ — Max transitions to return (default 5, max 20)

### `get_technique_rules`

MITRE ATT&CK technique PAIRS mined from the corpus with support, confidence and lift — which techniques travel together far above chance. Complements predict_mitre_transitions exactly: that answers sequence (what follows what), this answers co-occurrence (what appears alongside what).

**Arguments:** `limit` _integer_ — Default 50, max 200.


## L8 · Correlation graph

Start shallow. Depth multiplies node count.

### `get_similar_threats`

Threats similar to a given threat, with the EVIDENCE behind each link: per-channel score breakdown, which signal dominates, the concrete shared techniques / IOCs / CVEs, and quality flags for stale or high-confidence-low-evidence links. Use explain_correlation for a full decomposition of one specific pair.

**Arguments:** `id`**\*** _string_ — Source threat ID (e.g. TL-2026-0042)<br>`limit` _number_ — Max results (default 10, max 50)

### `explain_correlation`

Why two threats are linked: the per-channel similarity decomposition (techniques, IOCs, CVEs, products, CWEs, context), which channel dominates and by how much, the concrete shared artifacts, the signal count, and quality flags for high-confidence/low-evidence and stale links. Use when get_similar_threats gives a score and you need the evidence behind it. Pass the pair in either order. Returns 404 when the engine has no edge between them.

**Arguments:** `threat_a`**\*** _string_ — First threat ID.<br>`threat_b`**\*** _string_ — Second threat ID.

### `get_correlation_path`

Shortest evidence path between two threats across the similarity graph: the intermediate threats, each hop's dominant linking signal and shared artifacts, and the weakest-link strength of the whole path. Answers "is this incident connected to that campaign, and through what". Returns found:false with a reason (no edges vs different components) rather than an empty array.

**Arguments:** `from`**\*** _string_ — Starting threat ID.<br>`to`**\*** _string_ — Target threat ID.<br>`max_hops` _integer_ — Search depth, 1-8 (default 6).

### `get_entity_profile`

One-call dossier for any node in the intelligence graph — threat, technique, actor, IOC or CVE. Returns its centrality/pivot rank, top graph neighbours with edge fidelity, and type-specific rollups (linked threats, techniques with risk scores, IOCs with consensus and rarity, campaigns, related CVEs). Best token-per-call ratio in the graph family: replaces five or six separate lookups.

**Arguments:** `node_type`**\*** = `threat` \| `technique` \| `actor` \| `ioc` \| `cve`<br>`node_id`**\*** _string_ — The entity id/value (TL- id, T-number, actor name, IOC value, or CVE id).

### `get_correlation_subgraph`

The N-hop neighbourhood around any graph node — nodes, edges, and each edge's fidelity — for incremental exploration of the correlation graph. Start at depth 1 and expand: a whole-corpus graph exceeds every response budget. For a pre-aggregated single-entity view prefer get_entity_profile, which is cheaper and usually what you want; use this when you need the actual edge topology.

**Arguments:** `seed_type`**\*** = `threat` \| `technique` \| `actor` \| `ioc` \| `cve`<br>`seed_id`**\*** _string_ — The entity id/value to expand from.<br>`depth` _integer_ — Hops, 1-3 (default 1). Each hop multiplies the node count.<br>`min_fidelity` _number_ — Drop edges below this fidelity (0-1).<br>`limit_nodes` _integer_ — Default 40, max 60 over MCP.<br>`limit_edges` _integer_ — Default 80, max 120 over MCP.

### `get_pivotal_entities`

The hubs and bridges of the intelligence graph ranked by weighted degree and approximate betweenness — where a single detection buys the most coverage. NOTE: betweenness is an ego-bridge heuristic, not exact Brandes; the response says so in `note`. Do not present it as exact betweenness.

**Arguments:** `node_type` = `threat` \| `technique` \| `actor` \| `ioc` \| `cve`<br>`limit` _integer_ — Default 25, max 100.

### `get_graph_campaigns`

Campaign clusters the engine assembled from the similarity graph (connected components + label propagation): label, member count, cohesion, member threat IDs, top actors, top techniques, shared IOCs and nation-states. Distinct from get_campaign_intelligence, which looks up a NAMED campaign mentioned in threat text — this one reports clusters the engine derived itself.

**Arguments:** `limit` _integer_ — Default 15, max 50.

### `get_correlations`

Read precomputed cross-dataset correlations. Choose an engine: 'overview' (rollup of all engines — default), 'mitre-heatmap', 'adversary-infra', 'ioc-consensus', 'cve-velocity', 'attribution', 'detection-debt', or 'enrichment'. Use 'overview' first to see what's available, then drill into a specific engine.

**Arguments:** `engine` = `overview` \| `mitre-heatmap` \| `adversary-infra` \| `ioc-consensus` \| `cve-velocity` \| `attribution` \| `detection-debt` \| `enrichment` — Which correlation engine to read (default 'overview')


## L9 · Malware / tool / campaign

Route by entity kind; resolve_entity when unsure.

### `get_malware_intelligence`

Pivot on a malware FAMILY by name (e.g. "LockBit", "Vidar", "Emotet"). Returns the canonical family + type, prevalence (threat/actor counts, first/last seen), the threats deploying it, the actors using it, and its most-common ATT&CK techniques. For an offensive TOOL (Cobalt Strike, Mimikatz) use get_tool_intelligence instead. Call resolve_entity first if unsure of the canonical name.

**Arguments:** `name`**\*** _string_ — Malware family name (e.g. "LockBit", "Vidar")

### `get_tool_intelligence`

Pivot on an offensive tool / utility / RMM / LOLBin by name (e.g. "Cobalt Strike", "Mimikatz", "AnyDesk", "PsExec"). Returns the canonical tool + class, prevalence, the threats and actors using it, and its most-common ATT&CK techniques.

**Arguments:** `name`**\*** _string_ — Tool name (e.g. "Cobalt Strike", "Mimikatz")

### `get_campaign_intelligence`

Pivot on a named campaign / operation by name (e.g. "Snowflake campaign", "ClickFix"). Returns the threats in the campaign, the actors involved, prevalence, and common ATT&CK techniques.

**Arguments:** `name`**\*** _string_ — Campaign / operation name


## L10 · Community OSINT

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


## L11 · Reporting & landscape

One bundle usually beats four calls.

### `get_daily_intel_bundle`

One-shot "what happened" bundle: the day's debrief (latest by default, or pass date) plus platform stats, the top recent threats, and the correlations overview.

**Arguments:** `date` _string_ — Debrief date YYYY-MM-DD (default: latest)<br>`top_n` _number_ — How many top threats to include (default 5, max 10)

### `get_latest_debrief`

Get the most recent daily intelligence debrief in full detail (resolves the latest date for you).

**Arguments:** _takes no arguments_

### `get_debrief`

Get the full daily intelligence debrief for a specific calendar date (YYYY-MM-DD): posture summary, themes, threats grouped by severity, MITRE coverage, IOC distribution, actor attribution, and detection status. Find available dates first with list_debriefs.

**Arguments:** `date`**\*** _string_ — Debrief date in YYYY-MM-DD format (e.g. 2026-05-30)

### `list_debriefs`

List recent daily intelligence debriefs (newest first) with their per-day rollups: new/updated threats, themes, MITRE techniques, IOC breakdown, actors, and severity counts. Use to scan recent days; use get_debrief for the full detail of one date. Pass limit (default 30, max 100); the result includes has_more (true when the page is full, so older debriefs may exist). NOTE: the debriefs endpoint does not yet honor offset — it serves the most recent window.

**Arguments:** `limit` _number_ — Max debriefs to return (default 30, max 100)

### `get_landscape_briefing`

Get the latest threat-landscape briefing — a synthesized posture summary of recent threat activity.

**Arguments:** _takes no arguments_

### `get_daily_theme`

Get the day's landscape theme and top threat tags.

**Arguments:** _takes no arguments_

### `get_threat_level`

Get the computed current threat-landscape level (a 0–25 rating of overall posture).

**Arguments:** _takes no arguments_


## L12 · Standards export

For handing data to another system.

### `export_stix`

Export a threat, actor, or CVE as a STIX 2.1 bundle for ingestion into a TIP/SIEM. Provide at least one of threat_id, actor, or cve_id. Returns a {type:"bundle", objects:[...]} with indicator (per IOC), attack-pattern (per MITRE technique), intrusion-set (actor), vulnerability (CVE), malware/threat-actor, and relationship objects. Set include_osint=true to add `sighting` SROs for indicators the community independently reported (TL_OSINT_Scan / tweetfeed.live, CC0) — community-sourced and heavily concentrated, so they carry x_threadlinqs_trust="community-unverified". The bundle is capped (≤200 objects / ≤80KB); a note object is appended if truncated.

**Arguments:** `threat_id` _string_ — Threat ID to export (e.g. TL-2026-0042)<br>`actor` _string_ — Threat-actor name or alias to export (e.g. "APT29")<br>`cve_id` _string_ — CVE identifier to export (e.g. CVE-2024-3400)<br>`include_osint` _boolean_ — Add community `sighting` objects for corroborated indicators (default false)

### `export_attack_navigator`

Export a MITRE ATT&CK Navigator layer (enterprise-attack) for visualization. Pass actor=<name> to score techniques attributed to one actor, or all=true for platform-wide coverage. Returns {name, versions, domain, techniques:[{techniqueID, score, color, comment}]}, capped at 600 techniques.

**Arguments:** `actor` _string_ — Threat-actor name or alias whose techniques to score (e.g. "APT29")<br>`all` _boolean_ — If true, build a platform-wide coverage layer from MITRE coverage instead of a single actor

