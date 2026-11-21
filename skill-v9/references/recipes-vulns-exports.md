# Recipes: vulnerabilities, exports, C2, the daily brief

Prompts with the same plan: `triage_cve`, `sweep_vulnerabilities`, `assess_exposure`,
`export_for_tooling`, `build_c2_blocklist`, `daily_brief`, `period_review`.

## Triage one CVE

1. `get_cve {id:"CVE-2025-53770"}`: description, CVSS, EPSS, CISA KEV status with dates, patch
   availability, linked threats, and by default the exploitation section (PoCs, nuclei).
2. Corpus context: `sections:["exploitation","threats","actors","techniques","detections"]`
   (detections is a roster, not rule text). These take the correlation day pass and work for at
   most 5 CVEs per call. `products` and `references` are plain sections.
3. Coverage: `search_detections {q:"CVE-2025-53770"}` or by the techniques from step 2; open a
   rule with `get_detection`.
4. Up to 20 CVEs at once: `get_cve {id:"CVE-2025-53770,CVE-2024-3400"}`.
5. The weakness class: `get_cwe {id:"CWE-502"}` (definition, mitigations by phase, corpus CVEs).
6. Rank by exploitation (KEV, EPSS, public PoC), not by CVSS alone.

## "What should we patch first?"

1. `search_cves {kev:true, sort:"priority", window_days:30}`; filter further with `vendor`,
   `severity`, `epss_min`, `has_poc`, `nuclei`, `cwe`. Cards are compact; details via `get_cve`.
2. `sort:"velocity"` ranks by days from publication to first weaponisation (correlation day pass).
3. Pages with `cursor`; a note says when the feed stops paging, then add a filter.

## Exports for a SIEM or TIP

`export` never returns the file inline: it returns a summary and `download_url` (valid 15 minutes,
for this account only; send the same Authorization header used for MCP). To read it in-band,
`resources/read` the `resource_uri` with `?part=1..N`. Give the user the link.

| Want | Call | Spend |
|---|---|---|
| STIX 2.1 bundle | `export {kind:"stix", threat_id:"TL-2026-5315"}` (or `actor`, `cve_id`; `include_osint`) | threat: its unlock; actor: actor_intel pass; CVE: none |
| ATT&CK Navigator layer | `export {kind:"navigator", actor:"APT28"}` | actor_intel pass |
| Rule pack | `export {kind:"detections", threat_id:"TL-2026-5315", lang:"spl"}` | the threat's unlock |
| C2 blocklist | `export {kind:"blocklist"}` | none |

An export that would spend a lot answers `confirmation_required` first. A rule pack whose rules
all stay locked answers `credits_required`.

## C2 infrastructure

`c2 {view:"summary"}` first (counts and feed health), then `beacons`, `configs`, `operators`,
`watermarks`, `correlations`, `timeline`, or `dns` (domains on each beacon IP with
`fidelity` dedicated, mixed or shared; dns day pass). Always read `meta.freshness`: when the feed
is offline the result is a dated snapshot, and say so.

## The daily brief

`brief` gives the posture score with its drivers, the day's theme, severity counts and threats,
most severe first (`top`, default 8). `brief {date:"2026-11-12"}` for another day (not_found
names the nearest days), `history:7` for a trend, `include:["watch"]` for the analyst watch-line.
