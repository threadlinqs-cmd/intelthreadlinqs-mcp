# Hunt cheat sheet (TLQL)

`hunt` queries a pre-joined observation index. One row is one observation (a tool, an IOC, a
technique, a CVE, an attribution, a beacon...) of one threat, so a threat with 30 IOCs is 30 rows.
`hunt {query:"?"}` returns the live field list, operators and examples; a syntax error returns
them in `error.details.grammar`. The index is rebuilt nightly, not live.

## Shape

```
<filter> [ | stats count | count_distinct(<field>) [by <field>[, <field>...]] ]
```

- No `| stats`: matching observation rows (newest first). With it: groups (largest first).
- `count` counts observations; `count_distinct(threat)` (alias `dc(threat)`) counts threats,
  which is almost always what "how many threats" means.
- `by` takes up to 4 fields. Grouping on `seen` buckets by day. Blank groups are dropped.
- `limit` (default 20, max 100) caps rows or groups. There is no cursor: narrow, or aggregate.
- Query text up to 1000 characters.

## Fields worth knowing

| Field | Notes |
|---|---|
| `actor`, `nation`, `severity`, `category`, `sector`, `region` | On every row of the threat |
| `tool` / `malware` (one column), `cve`, `mitre` (technique id), `tactic` | Scoped: the filter selects threats that have it |
| `ioc`, `ioc_type`, `type` (observation type), `threat` | Per row; `threat` is exact and case-sensitive |
| `seen` | Time: `seen > "30d"` (units s, m, h, d) |
| `c2_ip`, `watermark`, `domain`, `dns_ip` | Beacon and DNS observations |

Scoped fields are why cross-type questions work: `malware = "qakbot" | stats count by ioc_type`
selects QakBot threats, then counts their IOC rows. The reverse (`ioc = "x" | stats count by tool`)
returns nothing, because an IOC row has no tool: put the scoped field on the filter side.

## Operators and quoting

- `=` `!=` `IN (a, b)` `NOT IN (...)` `CONTAINS` `LIKE "lazarus*"` (`*` is the wildcard),
  `>` `<` `>=` `<=` for time. On `sector` and `region`, `=` means contains: use the full label.
- `AND`, `OR`, `NOT`, parentheses. Evaluation folds left: always parenthesise mixed AND/OR.
- To exclude on a scoped field, negate the whole term: `NOT (cve IN ("CVE-2024-3400"))`.
  `cve NOT IN (...)` means "has some other CVE".
- Quote every value. Unquoted hyphens break the query (`"CVE-2024-3400"`, `"TL-2026-0989"`);
  relative times must be quoted (`"7d"`). A bare quoted string is a fuzzy match across actor,
  tool, IOC, CVE and label; an unquoted bare word is read as a field name and fails.
- `seen` is when the threat entered the corpus for most rows; only beacon, DNS and infrastructure
  rows carry a real first-seen time. Say so when reporting time trends.
- Resolve aliases first: `actor = "fancy bear"` matches that literal text, not APT28.

## Worked queries

```
tool = "cobalt strike" | stats count_distinct(threat) by nation
severity = "critical" AND sector = "healthcare" AND seen > "30d"
malware = "qakbot" | stats count by ioc_type
mitre = "T1059.001" | stats count_distinct(threat) by nation
tool = "cobalt strike" AND type = c2_beacon | stats count by watermark
seen > "90d" | stats count_distinct(threat) by seen
(tool = "sliver" OR tool = "brute ratel") AND NOT (sector = "government") | stats dc(threat) by tool
```

When a query returns nothing, relax one predicate at a time, and report the exact query you ran
with the answer.
