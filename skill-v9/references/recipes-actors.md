# Recipes: actors, malware, campaigns, attribution, correlation

Prompts with the same plan: `profile_actor`, `malware_dossier`, `map_campaign`,
`review_attribution`, `explain_link`.

## Profile an actor

1. Unsure of the name: `resolve_entity {name:"fancy bear", type:"actor"}`; `aliases:true` also
   lists aliases (actor_intel pass). An alias shared with other entities is the source's claim,
   not a settled identity.
2. `get_actor {name:"APT28"}`: identity, counts, recent threats, tactic profile and arsenal.
   Buys the actor_intel pass (per actor, per Toronto day).
3. `include` picks parts: `cves` (with KEV/EPSS), `targets`, `relationships` (shared
   infrastructure or tooling; commodity tools are marked, not links), `attribution` (how much
   labelling is research-backed; adds the correlation pass). No relationship means unrecorded,
   never "unrelated".
4. Navigator layer: `export {kind:"navigator", actor:"APT28"}`.

## Find actors

`search_actors {tool:"cobalt strike"}`, or `q`, `malware`, `sector`, `nation`; pages with
`cursor`. Role "co-mention" is never a primary attribution; `also_grounded_as` marks a name the
corpus also records as malware or a tool.

## Is the actor on a threat evidence-backed?

1. `get_threat {id:"TL-2026-5315", sections:["overview","attribution"]}`: `actor.assessment.state`
   is assessed, pending_research, none or unknown; `actor.basis` "source_label" is the feed's label.
2. The evidence: `sections:["assessment"]` (correlation pass).
3. Write "the feed labels it X" or "assessed as X"; never turn a label into a finding.

## Malware, tools, campaigns

1. `get_entity {kind:"malware", name:"QakBot"}` (or kind tool or campaign): threats, actors,
   techniques, related indicators. Resolve aliases first.
2. `list_campaigns`: `source:"named"` (default; actor_intel pass), `source:"engine"` (similarity
   clusters; correlation pass), `source:"community"` (unverified; osint pass); `min_actors:2` for
   multi-actor campaigns. `supported:false` on a member: the name is not in that threat's text.

## Are two threats related?

1. `correlate {mode:"explain", a:"TL-2026-5315", b:"TL-2026-5101"}`: per-channel scores and the
   shared techniques, IOCs and CVEs. Quote the channel carrying the claim.
2. `mode:"path"` (`max_hops`) gives the shortest evidence path; `mode:"similar"` the neighbours of `a`.
3. Around an entity: `graph {view:"profile", type:"actor", id:"APT28"}`; `view:"subgraph"` with
   `depth:1` first; `view:"pivotal"` for bridging entities. Scores rank candidates; graph data
   is often days old (`meta.freshness`).
4. All take the correlation pass and are machine-derived: "the engine links", never "same campaign".

## Old names with no tool of their own

`get_actor_intelligence` (cross-actor attribution for one actor), `get_actor_relationships`
(recorded actor-to-actor rows) and the `get_correlations` engines other than mitre-heatmap,
detection-debt and cve-velocity: legacy names, still callable, not listed (`legacy-names.md`).
