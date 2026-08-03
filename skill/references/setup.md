# Setup — installation and access

Two transports reach the same 73 tools, the same resources, and the same prompt set. Pick one;
running both at once just gives the host duplicate tool names.

| | Local stdio | Remote Streamable-HTTP |
|---|---|---|
| Endpoint | `npx -y intelthreadlinqs-mcp` (subprocess) | `https://intel.threadlinqs.com/mcp` |
| Auth | `THREADLINQS_API_KEY=tl_…` env var | `Authorization: Bearer tl_…`, or OAuth 2.1 + PKCE |
| Needs Node ≥ 18 | yes | no |
| Best for | Claude Code, Cursor, VS Code, any stdio host | hosts with a remote-connector UI; zero install |
| Optional override | `THREADLINQS_API_URL` (defaults to `https://intel.threadlinqs.com`) | — |

The stdio package is a thin proxy: it forwards every call to the same worker endpoint. Tool
names, schemas and behaviour are identical across transports, so nothing else in this skill
changes based on which one you install.

**Tool names in this skill are bare** (`get_threat`, `hunt`). Hosts commonly prefix them —
`mcp__threadlinqs-intel__get_threat`, `mcp__claude_ai_threadlinqs__get_threat`. Match by
suffix after the last `__`; the prefix is the host's server label, not part of the name.

---

## 1. Get a key first

Nothing below works without one. **Tool CALLS require tier ≥ 3 (Purple or Gold).**

1. Sign up at <https://intel.threadlinqs.com>.
2. Verify the email — an unverified account is tier 0 and every MCP method is refused.
3. Go to **Profile → API Key** and create a key. It starts with `tl_`.
4. **Signing up alone does not grant MCP access.** A new account lands on Blue (tier 1);
   tool calls need tier >= 3, so they return `-32002` until you upgrade. The 7-day Purple
   trial is offered at checkout on the pricing page, not on signup.

| Tier | Name | MCP tool calls |
|---|---|---|
| 0 | Unverified | no |
| 1 | Blue (free) | no |
| 2 | Red | no |
| 3 | Purple ($11.99/mo) | yes — all 73 tools |
| 4 | Gold (enterprise) | yes — all 73 tools |

The gate is enforced server-side on every call. It is not a client setting, and no
configuration flag bypasses it. When the trial lapses, in-flight sessions start returning
`-32002` on the next call.

Treat the key as a secret: it is a bearer credential with your account's full read scope. Put
it in an env var or the host's secret store, never in a file you commit.

---

## 2. Host configuration

### Claude Code — stdio

```bash
claude mcp add threadlinqs-intel \
  -e THREADLINQS_API_KEY=tl_your_key_here \
  -- npx -y intelthreadlinqs-mcp
```

Add `-s user` to register it for every project instead of the current one.

### Claude Code — remote

```bash
claude mcp add --transport http threadlinqs-intel \
  https://intel.threadlinqs.com/mcp \
  --header "Authorization: Bearer tl_your_key_here"
```

Omit `--header` to let the host run the OAuth 2.1 + PKCE flow instead (section 4).

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "threadlinqs-intel": {
      "command": "npx",
      "args": ["-y", "intelthreadlinqs-mcp"],
      "env": {
        "THREADLINQS_API_KEY": "tl_your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop after editing. On Windows, `command` may need to be `npx.cmd`.

### Cursor

`.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "threadlinqs-intel": {
      "command": "npx",
      "args": ["-y", "intelthreadlinqs-mcp"],
      "env": {
        "THREADLINQS_API_KEY": "tl_your_key_here"
      }
    }
  }
}
```

### VS Code

`.vscode/mcp.json` — note the key is `servers`, not `mcpServers`, and the entry declares its
`type`:

```json
{
  "servers": {
    "threadlinqs-intel": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "intelthreadlinqs-mcp"],
      "env": {
        "THREADLINQS_API_KEY": "${env:THREADLINQS_API_KEY}"
      }
    }
  }
}
```

Using `${env:…}` keeps the key out of a file that may be committed.

### Generic stdio host

Any client that can launch a subprocess and speak MCP over stdio:

```
command: npx
args:    ["-y", "intelthreadlinqs-mcp"]
env:     THREADLINQS_API_KEY=tl_your_key_here
         THREADLINQS_API_URL=https://intel.threadlinqs.com   # optional
```

`THREADLINQS_API_URL` must be `https://` or `http://localhost` — the server refuses anything
else at startup. It exists for pointing at a dev worker; leave it unset in normal use.

Startup behaviour worth knowing: with no key, or a key below Purple, the server still starts
and still lists its tools. It writes a warning to stderr and every call fails. A host that
shows the tools but errors on use is in exactly this state.

### Alternatives

| Package | What it is | When to use it |
|---|---|---|
| `.mcpb` bundle | Desktop extension — bundles the server, prompts for the key in a dialog, stores it in the OS keychain | Claude Desktop users who do not want to hand-edit JSON |
| Claude Code plugin | `plugin/.claude-plugin/plugin.json` + `plugin/.mcp.json`, declares the same stdio server; reads `THREADLINQS_API_KEY` from the environment | `/plugin marketplace add threadlinqs-cmd/intelthreadlinqs-mcp` then `/plugin install threadlinqs-intelligence`, or `claude --plugin-dir <repo>/mcp-server/plugin` for local work |

Both are the same server with the same gate. Neither changes tiering.

---

## 3. Verify the install

Two cheap calls, in order:

1. `get_started` — returns the server info, tiering block, tool catalog and category map
   **inline**, with no downstream database round-trip. It is the cheapest tool on the server,
   but it is still tier-gated: if it returns `-32001`/`-32002`, the key is the problem, not the
   transport.
2. `health` — round-trips the backend. A pass here means the data path works.

Then, before any aggregate work, call `hunt_schema` **once** to load the TLQL field grammar.
`hunt` queries written without it guess field names and return empty.

For the prompt playbooks, call `prompts/list` rather than assuming a count — the set is
actively growing and any number written down here goes stale.

---

## 4. Remote transport details

Endpoint: `POST https://intel.threadlinqs.com/mcp` (Streamable HTTP, JSON-RPC 2.0).
Protocol version `2025-11-25`; `2025-06-18`, `2025-03-26` and `2024-11-05` are also accepted.

**Static key.** Send `Authorization: Bearer tl_…`. Simplest option, and the one to use for
scripts and CI.

**OAuth 2.1 + PKCE.** For hosts with a connector UI. Discovery is standard:

| Document | URL |
|---|---|
| Protected-resource metadata (RFC 9728) | `/.well-known/oauth-protected-resource` (also `…/mcp`) |
| Authorization-server metadata (RFC 8414) | `/.well-known/oauth-authorization-server` (also `…/mcp`) |
| Authorize | `https://intel.threadlinqs.com/oauth/authorize` |
| Token | `https://intel.threadlinqs.com/oauth/token` |

Constraints the flow enforces:

- **PKCE `S256` is mandatory.** `plain` and a missing `code_challenge` are both rejected at
  `/oauth/authorize`.
- Scope is `mcp`. Grants are `authorization_code` and `refresh_token`.
- Token-endpoint auth is `none` (public client).
- Client identity uses a **client-ID metadata document** — there is no dynamic client
  registration endpoint. Hosts that only implement DCR should use the static Bearer key.
- The OAuth endpoints are rate-limited to 40 requests/min per IP.

An unauthenticated request that carries no `Authorization` header gets HTTP 401 plus a
`WWW-Authenticate: Bearer` header pointing at the protected-resource metadata — that is the
signal for a host to begin the flow.

Whichever path is used, the resulting identity is resolved to a live account tier on every
call. OAuth does not grant a different tier than the same account's `tl_` key.

---

## 5. What is readable without a key

`tools/list` **is tier-gated** — an unauthenticated caller gets `-32001`, not an empty list.
Some hosts render that as "this server has no tools". The unauthenticated twins exist for
exactly this case:

| Surface | Content |
|---|---|
| `GET https://intel.threadlinqs.com/mcp/catalog.json` | All 73 tools with full `inputSchema` + annotations, the prompt list, 14 resources, 3 resource templates, category map, server instructions |
| `GET https://intel.threadlinqs.com/mcp.md` | The same documentation as Markdown |
| `resources/read` on a `ui://…` URI | Renderer shells only — inline HTML/CSS/JS with zero threat content, served before the gate so widgets do not render blank |

Everything else — `tools/call`, `prompts/get`, and `resources/read` on a `threadlinqs://` URI
— requires Purple or Gold.

`catalog.json` is the authority on names, arguments and enums. When a tool name from a README,
a blog post or model memory disagrees with the catalog, the catalog is right.

---

## 6. Runtime limits that look like setup bugs

| Limit | Behaviour | What to do |
|---|---|---|
| 90,000 characters per response | The payload is cut and the string `... [truncated: response exceeded 90000 chars — narrow your query (add filters, lower limit, or use a more specific tool) and retry]` is appended | Detect that marker, then narrow: add filters, lower `limit`, or switch to a more specific tool. Do not parse the truncated JSON — it is cut mid-structure |
| Paging honored | `search_threats`, `get_recent_threats`, `get_detections`, `search_xscan_indicators` accept `offset`/`cursor` and return `has_more` + `next_cursor` | Page these when you genuinely need more rows |
| Paging **not** honored | `search_iocs`, `list_debriefs`, `search_actors` | Narrow the query instead — a second call with an offset returns the same rows |
| `hunt` without `hunt_schema` | Invented field names match nothing; result set is empty, not an error | Call `hunt_schema` once per session, first |

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| JSON-RPC error `-32001` | No key, malformed key, revoked key, or the header never reached the server | Set `THREADLINQS_API_KEY` (stdio) or the `Authorization: Bearer tl_…` header (remote) and restart the host. **Terminal — do not retry other tools.** Surface the sign-up/upgrade path instead |
| JSON-RPC error `-32002` | Authenticated, but tier < 3 — free/Blue/Red account, or a lapsed Purple trial or subscription | Upgrade at <https://threadlinqs.com/landing.html#pricing>. The `data` block carries `your_tier` and `required_tier`. **Terminal — no other tool will succeed.** Do not probe the rest of the catalog |
| Query returns `results: []` with no error | A guessed enum value. Filters are matched literally, so an invalid `category` or `severity` silently matches nothing | Call `list_threat_categories` for the live category vocabulary; use `resolve_entity` before pivoting on an actor/malware/tool alias. Never invent enum values |
| Response ends in the truncation marker | Result exceeded 90,000 characters | Narrow — filters, lower `limit`, a more specific tool, or a `hunt … \| stats count by …` aggregate instead of pulling rows |
| Host shows an empty tool list | `tools/list` was refused (`-32001`), or the process is offline/sandboxed | Fix auth first. Since 8.1.0 the npm package falls back through authenticated `tools/list` → public `/mcp/catalog.json` → a **catalog snapshot bundled in the package**, so a network-isolated sandbox still lists the real tools. An older installed version returns an empty array here — pin `intelthreadlinqs-mcp@latest` |
| Tools list fine, every call errors | Server started without a valid Purple/Gold key — this is by design so registries can introspect | Check stderr for the startup warning, then fix the key |
| `spawn npx ENOENT` | Node is not on the host's PATH | Install Node ≥ 18; on Windows use `npx.cmd`; or use an absolute path to `node` with the `.mcpb` bundle |
| Server refuses to start, complains about the URL | `THREADLINQS_API_URL` is set to something that is neither `https://` nor `http://localhost` | Unset it — it defaults correctly |
| Duplicate tool names in the host | Both transports registered at once | Remove one connector |

---

## 8. Links

- Interactive docs: <https://intel.threadlinqs.com/mcp> (Markdown twin: `/mcp.md`)
- Machine-readable catalog: <https://intel.threadlinqs.com/mcp/catalog.json>
- Key + trial: <https://intel.threadlinqs.com/profile>
- Pricing: <https://threadlinqs.com/landing.html#pricing>
- Changelog: <https://intel.threadlinqs.com/changelog>

Maintained by the Threadlinqs Team, Threadlinqs Intelligence.
