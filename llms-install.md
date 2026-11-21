# Installing the Threadlinqs Intelligence MCP server

This file is for AI coding assistants (Cline and others) that set the server up for a user.

## What you need

- Node.js 18 or newer (`node --version`).
- A Threadlinqs API key. It starts with `tl_`. The user creates it at https://intel.threadlinqs.com/profile (a free account works and includes a small daily allowance of calls; Purple and Gold plans have full access). Ask the user for the key. Do not invent one.

Nothing has to be cloned or built. The server runs from npm.

## Configuration

Add this entry to the MCP settings file (for Cline: `cline_mcp_settings.json`), replacing the key with the user's:

```json
{
  "mcpServers": {
    "threadlinqs-intelligence": {
      "command": "npx",
      "args": ["-y", "intelthreadlinqs-mcp@latest"],
      "env": {
        "THREADLINQS_API_KEY": "tl_your_key_here"
      }
    }
  }
}
```

There is one environment variable and it is required: `THREADLINQS_API_KEY`.

## Check that it works

1. After saving the settings the server should list 25 tools. It lists them even with a wrong key, so the list alone proves nothing.
2. Call the tool `status` with no arguments. A working key returns the platform's health and counts.
3. If the answer says authentication is required or the key was rejected, the key is missing or wrong: ask the user to copy it again from their profile.
4. If the answer says the free daily allowance is used up, the setup is correct. The allowance resets at midnight Toronto time.

## Alternative: no local process

Clients that support remote MCP servers with OAuth can connect to `https://intel.threadlinqs.com/mcp` directly and sign in, with no key and no npm.
