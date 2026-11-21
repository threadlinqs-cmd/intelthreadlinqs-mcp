# Caveats: results, errors, locks, prices, cache

## Result vocabulary

One JSON object per result (the text block equals `structuredContent`).

- `page {returned, total?, has_more, next_cursor, query?}`: pass `next_cursor` back as `cursor` to
  the same tool with the same filters. Tools that page: {{paged.list}}. Others answer once: narrow
  the request or raise `limit`.
- `meta`, present only when it has something to say:
  - `as_of`, `freshness[] {source, status, last_computed?, age_h?}` (ok, stale, offline, empty,
    unknown): quote staleness, never present a stale engine as current.
  - `truncated[] {path, unit, kept, of, more?}`: what the size budget cut; `more` says how to get it.
  - `partial[] {section, code, message, id?, retryable?}`: one part failed, the rest is valid.
  - `spend[] {kind, key?, count, creds_each?, note}`: what the call may have charged.
  - `notes[]`: read them. `deprecated {alias, use}`: a legacy name was called; use `use`.
- Errors: `isError:true` and `error {code, message, retryable, retry_after_s?, reset_at?, hint?, details?}`.

| code | Do |
|---|---|
| `invalid_argument` | Fix the arguments as `message` and `hint` say |
| `not_found` | Check the id where the hint says; do not guess |
| `confirmation_required` | Ask the user; repeat with `confirm:true` only if they agree |
| `credits_required` | Stop; report `details.cost`, `purchased_available`, `opt_in_url` |
| `api_cap_reached` | Stop until `details.reset_at`; report `used` of `cap` |
| `tier_required`, `unauthenticated` | Stop: plan or credential |
| `rate_limited` | Wait `retry_after_s` when `retryable`; else stop |
| `upstream_overloaded` | Retry once after `retry_after_s`, with fewer parallel calls |
| `upstream_unavailable`, `upstream_timeout` | Retry once later; says nothing about the data |
| `unsupported` | Narrow it (one threat, one actor) |
| `internal` | Report it; do not loop |

Free-plan refusals keep the platform's shape: `structuredContent.error` is the string
`free_mcp_tool_excluded`, `free_mcp_limit_reached` or `free_mcp_unavailable` (`setup.md`).

## Locked threats

`locked:true` plus `unlock {code, ...}`: `credits_required` (`held`, `min_level`, `cost?`,
`purchased_available?`, `opt_in?`) or `api_cap_reached` (`reset_at`, `used`, `cap`, `scope?`).
IOCs become a defanged sample; sections behind the unlock are in `meta.partial`. Do not retry.

## Prices

At build time (`account` has the live list): a threat unlock through the API/MCP costs
{{facts.api_per_threat}} TL Creds, once per threat. Day passes, once per Toronto day: correlation {{facts.tools.correlation}}, actor_intel
{{facts.tools.actor_intel}}, ioc_intel {{facts.tools.ioc_intel}}, dns {{facts.tools.dns}}, osint {{facts.tools.osint}} (TL Creds each). Semantic search, every call: {{facts.tools.ai_semantic}} TL Creds. API/MCP spending is
capped per day and plan (Gold is metered, not capped; a claimed agent key has its own ceiling).
Daily creds go first, then earned; purchased creds only if the account allows API/MCP spending.

## Cache

A short in-memory cache: reference data (ATT&CK, CWE, posture) is shared, dossiers are per
account. Never cached: locked results, errors, per-call metered reads (semantic search) and every
free-plan call. A cached read charges nothing now. Trust `meta.freshness` and `as_of`.

## Empty results

Not an error: usually a misspelt filter value or an alias. Normalise with `resolve_entity`, list
categories with `status {include:["categories"]}`, relax one filter at a time, and only then say
the corpus has nothing.
