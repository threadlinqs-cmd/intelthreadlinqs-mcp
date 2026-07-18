# Threadlinqs Intelligence — Claude plugin

Adds the Threadlinqs Intelligence MCP server to Claude (Claude Code, Desktop) as a plugin:
49 read-only cyber-threat-intelligence tools — threats, SPL/KQL/Sigma detections, IOCs,
MITRE ATT&CK, CVE/CWE, C2 infrastructure, and threat-actor attribution.

> **Purple/Gold feature (tier ≥ 3).** The server verifies your API key at startup and refuses to
> run without a valid Purple or Gold key — there is no free or anonymous mode. Get a key (or start
> a 7-day Purple trial) at https://intel.threadlinqs.com/profile.

## What it ships

This plugin (`.claude-plugin/plugin.json` + `.mcp.json`) declares a single stdio MCP server,
launched via `npx intelthreadlinqs-mcp@6.0.0`. It reads your key from the
`THREADLINQS_API_KEY` environment variable. Requires Node ≥ 18 on PATH.

## Install

**1. Set your API key** (once, in your shell profile):

```bash
export THREADLINQS_API_KEY="tl_…"   # your Purple/Gold key from intel.threadlinqs.com → Profile → API
```

**2. Add the plugin.** From a marketplace that hosts it:

```
/plugin marketplace add threadlinqs-cmd/intelthreadlinqs-mcp
/plugin install threadlinqs-intelligence
```

Or point Claude Code at this directory directly (local dev):

```bash
claude --plugin-dir /path/to/mcp-server/plugin
```

**3. Verify.** Ask Claude to call `get_started` (the tool catalog) or `health`.

## Alternatives

- **Zero-install remote connector (recommended for most users).** The same 49 tools are available
  as a remote OAuth 2.1 connector — no Node, no key file, no env var. Add a custom connector to
  `https://intel.threadlinqs.com/mcp` and authenticate with your Purple/Gold account. To make this
  plugin use the remote server instead of stdio, replace `.mcp.json` with:

  ```json
  {
    "mcpServers": {
      "threadlinqs-intelligence": { "type": "http", "url": "https://intel.threadlinqs.com/mcp" }
    }
  }
  ```

- **Claude Desktop one-file install.** Use the MCPB bundle (`../mcpb-build/intelthreadlinqs-mcp-6.0.0.mcpb`)
  — drag it onto Claude Desktop and paste your key into the secure prompt (stored in the OS keychain).

## Links

- Docs / tool catalog: https://intel.threadlinqs.com/mcp
- npm package: https://www.npmjs.com/package/intelthreadlinqs-mcp
- Support: contact@threadlinqs.com
