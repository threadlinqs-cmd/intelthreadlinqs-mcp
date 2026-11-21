# Setup: connect, keys, plans

Endpoint: `https://intel.threadlinqs.com/mcp` (Streamable HTTP). Protocol {{protocol.current}};
{{protocol.older}} are also served. Tool names, results and plan rules are the same on every
connection below. Register one connection only, or the host shows every tool twice.

## Connect

- **Connector UI (OAuth).** Add the endpoint as a custom connector. The first request gets a
  401 with a `WWW-Authenticate` challenge naming
  `https://intel.threadlinqs.com/.well-known/oauth-protected-resource/mcp`; the host then runs
  OAuth 2.1 with PKCE S256, scope `mcp`, identifying itself with a client-ID metadata document.
- **API key.** Profile, then API Key, at `https://intel.threadlinqs.com/profile` gives a `tl_` key.
  Send `Authorization: Bearer tl_...`. For Claude Code:
  `claude mcp add --transport http threadlinqs-intel https://intel.threadlinqs.com/mcp --header "Authorization: Bearer tl_your_key"`.
- **Local stdio proxy.** `npx -y intelthreadlinqs-mcp` with `THREADLINQS_API_KEY=tl_...` in its
  environment, for hosts that only launch subprocesses (Claude Desktop, Cursor, VS Code). From
  version 9 it lists the same {{tools.count}} tools; the old names stay callable without being listed.
  `THREADLINQS_API_URL` is for development only; leave it unset.

Keys are bearer credentials: keep them in an environment variable or the host's secret store.
Without a credential only `initialize`, `ping` and the view documents answer;
`https://intel.threadlinqs.com/mcp/catalog.json` is the public catalog.

## Plans

| Plan | MCP |
|---|---|
| Purple, Gold | Every tool, every resource |
| Free (Blue or Red, verified email) | {{free.daily_calls}} tool calls per Toronto day |
| Unverified email | Refused (`-32002`) |

On the free plan:

- Each tool call counts once, whatever it reads; an old tool name counts once too. A call that
  fails, or delivers nothing, gives the call back. Calls still spend TL Creds like any account.
- Refused up front, before anything is spent: `brief` (every form), `export` with kind stix,
  navigator or detections, `get_threat` with more than one id, `correlate` with mode explain,
  `get_cve` with more than one id or with the sections threats, actors, techniques or detections,
  and the old names that reach them or were already Purple-only. The result is `isError:true` with
  `structuredContent.error` `free_mcp_tool_excluded`: use a single lookup instead.
- `export {kind:"blocklist"}` runs, but downloading the file and reading data resources need
  Purple: report the summary instead.
- When the day's calls are spent the result is `free_mcp_limit_reached`: tell the user, give
  {{platform.upgrade_url}}, and stop until midnight Toronto time.

## Agent keys

A program with no human account can self-register a `tla_` key
(`POST https://intel.threadlinqs.com/api/v1/agents/register`; see
`https://intel.threadlinqs.com/auth.md`). Until a human claims it with its `claim_url`, `/mcp`
refuses it (`-32002`, `claim_required`). Once claimed it acts with that person's plan, under its
own daily spending ceiling.

## Refusals before any tool runs

| Error | Meaning | Do |
|---|---|---|
| `-32001` | No credential, or an invalid, expired or revoked one | Say so; point to the profile page; stop |
| `-32002` | Refused: unverified email, unclaimed agent key, free plan switched off, or below Blue | Report `message`; stop |

Both are terminal: other tools will not succeed either.
