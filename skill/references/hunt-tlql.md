# TLQL — the `hunt` query grammar

`hunt` runs a deterministic SIEM-style query over `hunt_index`, a pre-joined observation
table (~106k rows). One row = one **observation**, not one threat: a threat with 4 tools
and 30 IOCs contributes 34 rows. Every count you report must account for that.

Tool names here are bare. Hosts may prefix them (`mcp__threadlinqs-intel__hunt`) — match by
suffix.

**Call `hunt_schema` once per session before your first `hunt`.** It returns the field list
derived from the server's own field map (so it cannot go stale), the display columns, and
`rebuilt_at` / `row_count` for index freshness. The index is materialized by the nightly
cron — it is as fresh as the last rebuild, not live.

Both tools need tier ≥ 3 (Purple/Gold), like every tool call. `-32001` = missing/invalid
key, `-32002` = authenticated but under-tier. Both terminal.

---

## Query shape

```
<filter expression> [ | stats <func> [by <field>[, <field>[, <field>[, <field>]]]] ]
```

Without a `| stats` pipe you get matching observation **rows**. With one you get
aggregated **groups**. The split happens on the first `| stats` (case-insensitive);
anything before it is the filter.

| Limit | Value | Enforced where |
|---|---|---|
| Query string | 2000 chars | `query` arg |
| Leaf terms per query | 48 | parser (`Query too complex (max 48 terms)`) |
| Values per `IN (…)` | 100 | parser |
| Value length | 200 chars (silently truncated) | compiler |
| `by` fields | 4 (extras dropped) | stats parser |
| `limit` arg | default 50, clamped to 100 | MCP layer |
| Response | 90,000 chars, then a `... [truncated: response exceeded 90000 chars — narrow your query` marker | MCP layer |

`limit` caps **rows** in row mode and **groups** in `stats … by` mode (the tool description
says it is ignored in stats mode — that is true only for a bare `| stats count` with no
`by`). Rows are ordered `ts DESC`; groups are ordered `count DESC`.

## Fields (37 names, aliases share a column)

| Field name(s) | Column | Case | Scoped | Multi | Notes |
|---|---|---|---|---|---|
| `actor` | `actor_lc` | ci | | | Attributed actor, denormalized onto every row of the threat |
| `actor_uuid` | `actor_uuid` | exact | | | MISP UUID |
| `tool`, `malware`, `arsenal` | `tool_lc` | ci | ✅ | | **One column.** `tool=` and `malware=` are the same filter — separate them with `type = tool` / `type = malware` |
| `ioc`, `ioc_value` | `ioc_value` | ci | | | Raw indicator |
| `ioc_type` | `ioc_type` | ci | | | Values come from the corpus — discover with `\| stats count by ioc_type`, never guess |
| `cve` | `cve` | UPPER | ✅ | | |
| `mitre`, `technique` | `mitre_technique` | UPPER | ✅ | | Technique **id** (`T1059.001`), not the name |
| `tactic` | `mitre_tactic` | ci | ✅ | | |
| `nation`, `nationstate`, `country` | `nation_state` | ci | | | `country` is the **threat's** nation-state attribution, *not* the C2 beacon's geo column |
| `severity` | `severity` | ci | | | |
| `category` | `category` | ci | | | Use `list_threat_categories` for the vocabulary |
| `type`, `obs` | `obs_type` | ci | | | `tool malware ioc mitre cve attribution c2_beacon dns infra` |
| `source` | `source_table` | ci | | | `threat_tools threat_malware threat_iocs threat_mitre threats threat_attribution c2_beacon_snapshots dns_enrichment ioc_infrastructure_links` |
| `threat`, `threat_id` | `threat_id` | **exact** | | | Case-sensitive — `"TL-2026-0989"` uppercase, quoted |
| `sector`, `sectors`, `target_sector`, `target_sectors` | `target_sectors` | ci | | ✅ | Target sector |
| `region`, `regions`, `target_region`, `target_regions` | `target_regions` | ci | | ✅ | Target region |
| `seen`, `first_seen`, `ts` | `ts` | time | | | Epoch seconds |
| `c2_ip` | `c2_ip` | exact | | | tier-3 obs only |
| `watermark` | `c2_watermark` | exact | | | tier-3 obs only |
| `domain` | `dns_domain` | ci | | | tier-3 obs only |
| `dns_ip` | `dns_ip` | exact | | | tier-3 obs only |

Any other name is rejected with `Unknown hunt field: <name>`.

**Row output columns** (21): `obs_type threat_id actor tool ioc_type ioc_value cve
mitre_technique mitre_tactic nation_state target_sectors target_regions c2_ip c2_watermark
dns_domain dns_ip severity category confidence ts_raw label`.

### Scoped observables — why cross-type questions work

`tool` / `malware` / `arsenal` / `cve` / `mitre` / `technique` / `tactic` are **scoped**.
Those values live only on their own `obs_type` row (`tool_lc` is NULL on an IOC row), so a
same-row match could never be crossed with a group-by on a different observation type.
A scoped predicate is therefore re-compiled as a threat-level subquery:

```sql
threat_id IN (SELECT threat_id FROM hunt_index WHERE <predicate>)
```

It means **"threats that have this observable"**. That is exactly why
`malware = "qakbot" | stats count by ioc_type` works: the filter selects threats, the
group-by reads their IOC rows.

The unscoped fields are already denormalized onto every row of the threat
(`actor`, `nation`, `severity`, `category`, `sector`, `region`) or are per-row facts
(`ioc`, `ioc_type`, `c2_ip`, `domain`, …). `ioc` is **not** scoped, so
`ioc = "x" | stats count by tool` returns nothing — the IOC row has a NULL `tool` and
NULL groups are dropped. Put the scoped field on the filter side.

### Multi-value columns

`sector*` and `region*` hold several values in one delimited lowercased string.
There, `=` compiles to a **contains** match (`LIKE '%value%'`) and `!=` to `NOT LIKE`.
Consequence: short values over-match against the surrounding JSON text. Use the full
label — `sector = "healthcare"`, not `sector = "care"`.

## Operators

| Operator | Applies to | Compiles to |
|---|---|---|
| `=` | all | equality; **contains** on multi fields |
| `!=` | all | inequality; `NOT LIKE` on multi fields |
| `CONTAINS` | text | `LIKE '%value%'` |
| `LIKE` | text | `LIKE value` with `*` translated to `%` (`actor LIKE "lazarus*"`) |
| `IN (a, b, …)` | all | `IN` list, ≤ 100 values |
| `NOT IN (a, b, …)` | all | `NOT IN` list — **see the scoped-negation trap below** |
| `>` `>=` `<` `<=` | time fields | epoch comparison |
| `>` `>=` `<` `<=` | other fields | `CAST(col AS REAL)` comparison — meaningless on text; `severity > "high"` casts both sides to 0 |

There is **no `~` operator**. `hunt_schema`'s `operators` array lists `~ (contains)`; the
tokenizer rejects the character. Write `CONTAINS`.

### Boolean composition

`AND`, `OR`, `NOT`, and parentheses. Keywords are case-insensitive. Adjacent terms with no
keyword between them are **implicitly AND-ed**. Precedence is strictly left-to-right — the
parser folds left, so `a OR b AND c` parses as `(a OR b) AND c`. **Always parenthesize a
mixed AND/OR expression.**

`NOT` binds to the following term: `NOT (cve IN ("CVE-2024-3400"))`.

### The scoped-negation trap

For a scoped field, `NOT IN` is wrapped *inside* the subquery:

```
cve NOT IN ("CVE-2024-3400")     →  threats having SOME cve that is not CVE-2024-3400
NOT (cve IN ("CVE-2024-3400"))   →  threats having NONE of those CVEs
```

To exclude, negate the whole term. The same applies to `!=` on any scoped field.

### Bare quoted strings = fuzzy

A quoted string with no field is a fuzzy term across five columns —
`actor_lc`, `tool_lc`, `ioc_value`, `cve`, `label` — as `LIKE '%term%'`:

```
"cobalt strike"
"cobalt strike" AND severity = "critical"
```

An **unquoted** bare word is parsed as a field name and fails with `Unknown hunt field`.

### Quoting rule

Single or double quotes; `\` escapes the delimiter. Unquoted values are allowed only for
bare alphanumeric/underscore/dot words (`type = ioc`, `severity = critical`,
`mitre = T1059.001`). **Anything containing a hyphen or a space must be quoted** — the
tokenizer splits `CVE-2024-3400` into an identifier and a negative number and the query
dies with `Trailing token`. Safest habit: quote every value.

`//` line comments and `/* */` block comments are stripped. Only `| stats` is a supported
pipe — any other `|` in the filter is silently discarded (and a following `search` word
with it), so it will not do what an SPL habit expects.

### Relative time

```
seen > "7d"     within the last 7 days
seen > "24h"    last 24 hours
seen < "365d"   older than a year
seen > 1750000000   bare epoch seconds also accepted
```

Units are `s` `m` `h` `d` only — no `w`, no `y`; use `"30d"`, `"90d"`, `"365d"`.
The relative form **must be quoted** (`seen > 7d` parses `7` as a number and `d` as a
field name). A relative value resolves to `now − N`, so `>` means "more recent than".

Honesty: for most observation types `ts` is derived from `threats.created_at` — the date
the threat entered the corpus (date-only, midnight UTC), not when the indicator was first
seen in the wild. Only `c2_beacon`, `dns` and `infra` rows carry a real first-seen /
discovered-at timestamp.

## `| stats`

```
| stats count
| stats count by <field>
| stats count_distinct(<field>) by <field>[, <field>…]
| stats dc(threat) by actor          // dc is an alias for count_distinct
```

| Form | Meaning |
|---|---|
| `count` | `COUNT(*)` — number of **observation rows** |
| `count_distinct(threat)` / `dc(threat)` | distinct threats — what you almost always want |
| `count_distinct` with no argument | defaults to distinct `threat_id` |

`by` takes 1–4 comma-separated fields and produces a pivot table. Grouping on a time field
buckets by **day** (`date(ts,'unixepoch')`). Rows whose group column is NULL or blank are
dropped — otherwise a single empty-keyed group would swallow the whole count.

## When `hunt`, when `search_threats`

| Use `hunt` | Use `search_threats` |
|---|---|
| "how many / which is most common" — anything that ends in a number or a ranking | "show me the threats about X" — you want readable summary rows |
| Crossing observation types (tool → IOC type, technique → nation) | Free-text over title/summary/description |
| You would otherwise fire N `search_threats` calls and count the rows yourself | You need pagination through a result set (`hunt` has no cursor) |
| Grouping by actor / nation / sector / region / day | You want the fields `get_threat` would then expand |

`hunt` returns observations, not threat cards. Once a hunt names the threats you care
about, pivot with `bulk_get_threats` (≤ 20 ids) or `get_threat_hunting_bundle`.
Resolve aliases with `resolve_entity` **before** hunting on a name — `actor = "fancy bear"`
matches the literal string, not APT28.

---

## Worked queries

**Anything in the corpus mentioning Cobalt Strike, any observation type**
```
"cobalt strike"
```

**Threats that use Cobalt Strike as tooling**
```
tool = "cobalt strike"
```

**Every IOC recorded for one threat**
```
threat = "TL-2026-0989" AND type = ioc
```

**Critical healthcare threats from the last 30 days**
```
severity = "critical" AND sector = "healthcare" AND seen > "30d"
```

**Actor spelling unknown — prefix match**
```
actor LIKE "lazarus*"
```

**North-American or European targets attributed to a nation-state, excluding one CVE**
```
(region = "north america" OR region = "europe") AND nation != "" AND NOT (cve IN ("CVE-2024-3400"))
```

**How many IOC observations at each severity**
```
type = ioc | stats count by severity
```

**Which actors drive the critical corpus — distinct threats, not observation rows**
```
severity = "critical" | stats count_distinct(threat) by actor
```

**Daily volume of new threats over the last quarter**
```
seen > "90d" | stats count_distinct(threat) by seen
```

**Two-dimensional pivot: actor × region inside healthcare**
```
sector = "healthcare" | stats count_distinct(threat) by actor, region
```

**Cross-type — what kinds of indicator do QakBot threats carry?**
(`malware` is scoped, so the filter selects threats and the group-by reads their IOC rows)
```
malware = "qakbot" | stats count by ioc_type
```

**Cross-type — which nation-states use PowerShell execution (T1059.001)?**
```
mitre = "T1059.001" | stats count_distinct(threat) by nation
```

**Cross-type — Cobalt Strike threats with an observed beacon, grouped by watermark**
```
tool = "cobalt strike" AND type = c2_beacon | stats count by watermark
```

**Coverage question — which threat categories exercise the Execution tactic?**
```
tactic = "execution" | stats count_distinct(threat) by category
```

**Ransomware volume by nation and month-scale day bucket, top 100 groups**
```
category = "RANSOMWARE" AND seen > "180d" | stats count_distinct(threat) by nation, seen
```
(with `limit: 100` — otherwise you see only the top 50 groups)

**Multi-tool OR set, excluding a sector, aggregated**
```
(tool = "sliver" OR tool = "brute ratel" OR tool = "cobalt strike") AND NOT (sector = "government") | stats count_distinct(threat) by tool
```

## Failure modes and what they mean

| Error / symptom | Cause |
|---|---|
| `Unknown hunt field: X` | Not in the field table — or an unquoted bare word used as a fuzzy term |
| `Trailing token` | Unquoted value containing a hyphen (`CVE-2024-3400`, `TL-2026-0989`) |
| `Expected operator after <field>` | Field with no comparison |
| `Query too complex (max 48 terms)` | > 48 leaf terms — aggregate instead of enumerating |
| `IN list exceeds 100 values` | Split the query or filter differently |
| `Unsupported stats pipe` | Only `count` / `count_distinct` / `dc`, optional `by` with ≤ 4 fields |
| Empty result, filter looks right | Group-by field is NULL on the filtered rows — the filter field is unscoped (see *Scoped observables*) |
| One group with a blank key holding everything | Older behaviour; blank groups are now dropped — re-run and check the filter is scoped |
| `... [truncated: response exceeded 90000 chars` | Add predicates, lower `limit`, or switch to `| stats` |
| `tier_gated_included: false` in the response | The caller was below tier 3, so `c2_beacon` / `dns` / `infra` rows were excluded. MCP callers are tier ≥ 3 by definition, so this should read `true` |

If a query returns nothing, relax **one** predicate at a time rather than rewriting it —
that identifies which term is empty. Report the exact TLQL you ran alongside the answer.
