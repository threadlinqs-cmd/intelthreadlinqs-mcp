# Threadlinqs Intelligence — Claude plugin

Adds the Threadlinqs Intelligence MCP server to Claude (Claude Code, Desktop) as a plugin:
25 read-only cyber-threat-intelligence tools — threats, SPL/KQL/Sigma detections, IOCs,
MITRE ATT&CK, CVE/CWE, C2 infrastructure, and threat-actor attribution. Since 9.0.0 each tool
covers a family through a `view` or `sections` argument, and every earlier tool name stays
callable (it is just no longer listed).

> **Purple and Gold have full access; a free account has a daily allowance of calls**, and bundles,
> daily briefs and exports stay Purple or Gold. The server needs a valid API key for any call;
> there is no anonymous mode. An agent key (`tla_`) works once a person has claimed it, with that
> person's plan. Get a key at https://intel.threadlinqs.com/profile; the plans are on the pricing page.

## What it ships

This plugin (`.claude-plugin/plugin.json` + `.mcp.json`) declares a single stdio MCP server,
launched via `npx -y intelthreadlinqs-mcp@latest` (the published npm package). It reads your key from the
`THREADLINQS_API_KEY` environment variable. Requires Node ≥ 18 on PATH.

## Install

**1. Set your API key** (once, in your shell profile):

```bash
export THREADLINQS_API_KEY="tl_…"   # your Purple/Gold key from intel.threadlinqs.com → Profile → API
```

**2. Add the plugin.** Point Claude Code at this directory:

```bash
claude --plugin-dir /path/to/mcp-server/plugin
```

**3. Verify.** Ask Claude to list the Threadlinqs tools, or to call `status`.

## Alternatives

- **Zero-install remote connector (recommended for most users).** The same 25 tools are available
  as a remote OAuth 2.1 connector — no Node, no key file, no env var. Add a custom connector to
  `https://intel.threadlinqs.com/mcp` and authenticate with your account (Purple and Gold in full, a free account a daily allowance). To make this
  plugin use the remote server instead of stdio, replace `.mcp.json` with:

  ```json
  {
    "mcpServers": {
      "threadlinqs-intelligence": { "type": "http", "url": "https://intel.threadlinqs.com/mcp" }
    }
  }
  ```

- **Claude Desktop one-file install.** Use the MCPB bundle (`npm run mcpb:build` in the package writes `intelthreadlinqs-mcp-<version>.mcpb`)
  — drag it onto Claude Desktop and paste your key into the secure prompt (stored in the OS keychain).

## Links

- Docs / tool catalog: https://intel.threadlinqs.com/mcp
- npm package: https://www.npmjs.com/package/intelthreadlinqs-mcp
- Support: https://github.com/threadlinqs-cmd/intelthreadlinqs-mcp/issues
