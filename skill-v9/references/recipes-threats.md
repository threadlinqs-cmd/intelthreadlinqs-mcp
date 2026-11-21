# Recipes: triage a threat, scope an indicator

Prompts with the same plan: `investigate_threat`, `hunt_ioc`, `pivot_infrastructure`, `osint_sweep`.

## Triage one threat

1. No id yet: `search_threats {q:"citrix bleed", severity:"critical"}` (filters AND together;
   no arguments = newest first). Open the best row.
2. `get_threat {id:"TL-2026-5315"}`: overview, attribution, techniques, iocs, detections by
   default. Unlocks the threat once (0 when held).
3. Add only what the question needs, in the same call (`sections` replaces the default):
   - attack chain `flow`; D3FEND countermeasures `defense`; hunt scoping `infrastructure`
   - neighbours `similar`, attribution evidence `assessment` (each takes the correlation pass)
   - `description`, `timeline`, `remediation`, `references`, `updates`, `tags`, `enrichment`
4. Rules: the detections section lists ids; `get_detection {id:"TL-2026-5315-SPL-002", format:"all"}`
   returns the full rule. One file of all rules: `export {kind:"detections", threat_id:"TL-2026-5315", lang:"kql"}`.
5. Lists stop at `limit` (default 15, max 100); `meta.truncated` names what was cut.

## Several threats

`get_threat {id:"TL-2026-5315,TL-2026-5101"}` with no sections gives lean rows for up to 20 ids
and unlocks nothing; unknown ids come back in `missing`. With `sections`, at most 5 ids, and it
may answer `confirmation_required` first. One failing id lands in `meta.partial`.

## Locked threat

`locked:true` with `unlock.code` `credits_required` (`cost`, `purchased_available`, `opt_in`) or
`api_cap_reached` (`reset_at`, `used`, `cap`). Tell the user and stop; threats already unlocked
keep working.

## Scope an indicator

1. `get_ioc {value:"185.220.101.4"}`: threats carrying it, actors, first seen, a consensus
   verdict. Buys the ioc_intel pass.
2. `include:["threats","radius"]` adds sibling indicators, techniques and actors (`depth` 1-3);
   `dns` adds stored records and pivots (never a live lookup; dns pass); `osint` community sightings.
3. Partial value: `search_iocs {value:"185.220."}` matches a prefix; `match:"substring"` a fragment
   anywhere, `match:"exact"` one value; `source:"community"` the unverified OSINT feed (osint pass).
4. Private, link-local and shared hosting or CDN addresses are flagged: not adversary-owned.
5. Keep anything from `osint` or `source:"community"` labelled community-sourced.

## Old names with no tool of their own

`get_threat_simulations`, `get_threat_transcripts` and `get_flow_similar_threats` read behind the
threat unlock; `list_simulations` takes the simulations_list pass. Legacy names: still callable,
not listed (`legacy-names.md`).
