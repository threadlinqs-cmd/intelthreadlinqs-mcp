# Recipes: counts, coverage, detection rules

Prompts with the same plan: `hunt_corpus`, `review_detection_gaps`, `map_detections_to_mitre`,
`write_detection`, `predict_next_move`, `plan_purple_team`.

## "How many X by Y"

1. One `hunt` query (`hunt-cheatsheet.md`). Unsure of a field: `hunt {query:"?"}` returns fields,
   operators and examples; a syntax error returns them too.
2. `hunt {query:"tool = \"cobalt strike\" | stats count_distinct(threat) by nation", limit:50}`.
3. Report groups as returned. Nation, severity and tactic labels are merged into canonical groups
   (`merged` counts the raw labels). When `meta.notes` says only the largest raw groups came back,
   totals may be low: narrow the filter or raise `limit` (max 100).
4. To see the threats in a group, filter `search_threats` on it, or open ids as lean rows.

## Where is detection weakest?

1. `attack_coverage` (view gaps, the default): techniques ranked by detection debt, exposure
   weighted by KEV/EPSS over rule count. Buys the correlation pass.
2. `view:"tactics"` totals per tactic (no pass); `view:"heatmap"` techniques by risk;
   `view:"matrix"` tactic columns for display. `tactic:"stealth"` narrows (ATT&CK v19 names;
   legacy labels merged). Pages with `cursor`.
3. For a gap: `search_detections {technique:"T1190"}` lists rules mapped to it or its
   sub-techniques. An empty list is the gap: say so.

## Find and deliver rules

1. `search_detections` needs `q`, `threat_id` or `technique`; add `lang` (spl, kql, sigma) or
   `severity`. Rows carry no rule text; rows marked `locked` are on threats not yet unlocked.
2. `get_detection {id:"TL-2026-5315-SPL-002"}` returns the native language; `format` spl, kql,
   sigma, cql or all. A locked rule unlocks its threat (once, 0 when held). Rule text is never
   truncated: if all flavours do not fit, a note names the ones to request separately.
3. All rules of a threat in one file: `export {kind:"detections", threat_id:"TL-2026-5315", lang:"sigma"}`.
4. When tuning, keep the rule's logic, adapt field names, quote its false-positive notes.

## A technique and what follows it

`get_technique {id:"T1059.001"}`: name, tactics, mitigations, data sources, corpus count (no
charge). `include:["threats"]` lists threats using it (paged); `include:["next"]` or
`["previous"]` gives likely neighbouring techniques with a probability (correlation pass). Prefer
rows from authored attack flows; transitions are statistical, so say "likely".

## Purple-team plan

`get_threat {id, sections:["overview","flow","techniques","detections"]}` gives the ordered chain
and its rules; steps without a rule are the gaps. Emulation plans: the legacy name
`get_threat_simulations` (callable, not listed). Never write working exploit code.

## Co-occurrence and ATLAS

`get_technique_rules` and `get_atlas_intelligence` have no listed tool: legacy names, still
callable, not listed; each takes the correlation pass.
