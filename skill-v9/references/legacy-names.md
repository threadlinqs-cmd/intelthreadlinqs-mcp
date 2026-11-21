# Legacy names: callable, not listed

GENERATED from packages/mcp-v9/src/legacy/aliases.ts by `npm run build:skill-v9`. Do not edit.

All 81 tool names of the previous server still work. 11 of them are tools of this
server under the same name. The other 70, below, are legacy names: still callable, not
listed in `tools/list`, and every result names the tool to use instead in `meta.deprecated`.
Call the listed tool in new work. A client that must enumerate them can list them with
`POST https://intel.threadlinqs.com/mcp?surface=v8`.

## No equivalent tool: legacy name, still callable, not listed

`get_actor_intelligence`, `get_actor_relationships`, `get_atlas_intelligence`, `get_flow_similar_threats`, `get_technique_rules`, `get_threat_level`, `get_threat_simulations`, `get_threat_transcripts`, `list_simulations`.

These reach the original handler; the output is bounded and repaired.

## Mapped to a listed tool

- `attack_coverage`: `get_correlations`\* (or `search_cves`), `get_mitre_coverage`, `get_mitre_gap_analysis`
- `brief`: `get_daily_intel_bundle`, `get_daily_theme`, `get_debrief`, `get_landscape_briefing`, `get_latest_debrief`, `list_debriefs`
- `c2`: `get_c2`\*, `get_c2_dns_intel`\*
- `correlate`: `explain_correlation`, `get_correlation_path`, `get_similar_threats`
- `export`: `export_attack_navigator`\*, `export_stix`, `generate_c2_blocklist`
- `get_cve`: `bulk_get_cves`, `get_cve_intelligence`
- `get_detection`: `export_detection`, `get_detection_detail`
- `get_entity`: `get_campaign_intelligence`, `get_malware_intelligence`, `get_tool_intelligence`
- `get_ioc`: `get_ioc_blast_radius`, `get_ioc_dns`\*, `get_ioc_intelligence`, `get_osint`\* (or `osint`)
- `get_technique`: `get_mitre_technique`\*, `predict_mitre_transitions`\*
- `get_threat`: `bulk_get_threats`, `get_attack_flow`, `get_attribution_evidence`, `get_d3fend_posture`, `get_infrastructure_pivots`, `get_threat_bundle`, `get_threat_enrichment`, `get_threat_hunting_bundle`
- `graph`: `get_correlation_subgraph`\*, `get_entity_profile`, `get_pivotal_entities`
- `hunt`: `hunt_schema`
- `list_campaigns`: `get_community_campaigns`, `get_graph_campaigns`
- `osint`: `get_osint_trends`
- `resolve_entity`: `get_entity_aliases`\*
- `search_cves`: `search_vulnerabilities`\*
- `search_detections`: `get_detections`\*
- `search_iocs`: `search_xscan_indicators`\*
- `search_threats`: `get_recent_threats`\*, `search_corpus_semantic`
- `status`: `get_attribution_coverage`\*, `get_changelog`, `get_engine_status`, `get_enrichment_overview`, `get_flow_coverage`, `get_platform_stats`, `get_roadmap`, `get_started`, `health`, `list_threat_categories`

\* Some argument shapes of this name (paging offsets, filters the listed tool does not take)
go to the original handler instead.
