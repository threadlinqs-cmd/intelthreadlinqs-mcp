#!/usr/bin/env node
/**
 * The built proxy (dist/index.js) against local fake servers that answer like the platform's two
 * /mcp surfaces, driven through the SDK's stdio client exactly as a host would:
 *
 *   v9-like: SSE for a client that accepts it (406 for JSON-only), notifications before the
 *            result, JSON-RPC errors -32001 (HTTP 401) and -32002 (HTTP 403, also as a 200),
 *            a 503 carrying retry_after_s, structured tool errors as ordinary tool results.
 *   v8-like: plain JSON for everything, no Accept check.
 *
 * Proves: tools/list is the LIVE list (not the bundled snapshot) on both; tools/call returns the
 * result; legacy aliases are rewritten; codes and data survive; the headers are right
 * (dual Accept, intelthreadlinqs-mcp/<version> User-Agent, Bearer); the offline fallback works.
 *
 *   node tests/proxy.test.mjs        (after `npm run build`)
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = join(ROOT, "dist", "index.js");
const VERSION = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;
const { CATALOG_SNAPSHOT } = await import("../dist/catalog-snapshot.js");

let pass = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`  ok    ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${String(e.stack || e).split("\n").slice(0, 5).join("\n        ")}`);
  }
}

// ── fake platform ───────────────────────────────────────────────────────────
function fakePlatform(surface) {
  const seen = { requests: [], hits: {} };
  const liveTools =
    surface === "v9"
      ? [{ name: "fake_nine_a", inputSchema: { type: "object" } }, { name: "fake_nine_b", inputSchema: { type: "object" } }, { name: "get_c2", inputSchema: { type: "object" } }]
      : [{ name: "fake_eight_a", inputSchema: { type: "object" } }, { name: "get_c2", inputSchema: { type: "object" } }];

  const sse = (res, status, messages, extraHeaders = {}) => {
    res.writeHead(status, { "content-type": "text/event-stream", "cache-control": "no-store", ...extraHeaders });
    // the last event deliberately has no trailing blank line
    res.end(messages.map((m, i) => `event: message\ndata: ${JSON.stringify(m)}${i < messages.length - 1 ? "\n\n" : "\n"}`).join(""));
  };
  const reply = (res, status, id, payload, extraHeaders = {}) => {
    const msg = { jsonrpc: "2.0", id, ...payload };
    if (surface === "v9") return sse(res, status, [{ jsonrpc: "2.0", method: "notifications/message", params: { level: "info", data: "working" } }, msg], extraHeaders);
    res.writeHead(status, { "content-type": "application/json", ...extraHeaders });
    res.end(JSON.stringify(msg));
  };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/mcp/catalog.json") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ tools: liveTools, prompts: [{ name: "p" }], resources: [{ uri: "r://x", name: "x" }], resourceTemplates: [{ uriTemplate: "t://{id}", name: "t" }] }));
    }
    if (url.pathname !== "/mcp" || req.method !== "POST") {
      res.writeHead(404).end();
      return;
    }
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    seen.requests.push({ method: body.method, name: body.params?.name, args: body.params?.arguments, headers: req.headers });
    const accept = String(req.headers.accept || "");
    if (surface === "v9" && !(accept.includes("application/json") && accept.includes("text/event-stream"))) {
      res.writeHead(406, { "content-type": "application/json" });
      return res.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "Not Acceptable: Client must accept both application/json and text/event-stream" } }));
    }
    const id = body.id;
    switch (body.method) {
      case "initialize":
        return reply(res, 200, id, { result: { protocolVersion: "2025-11-25", capabilities: { tools: {} }, serverInfo: { name: "fake", version: surface === "v9" ? "9.0.0" : "8.2.1" } } });
      case "tools/list":
        return reply(res, 200, id, { result: { tools: liveTools } });
      case "prompts/list":
      case "resources/list":
      case "resources/templates/list":
        return reply(res, 200, id, { result: { [body.method.split("/")[0] === "resources" && body.method.endsWith("templates/list") ? "resourceTemplates" : body.method.split("/")[0]]: [] } });
      case "tools/call": {
        const name = body.params?.name;
        seen.hits[name] = (seen.hits[name] || 0) + 1;
        switch (name) {
          case "boom_32001":
            return reply(res, 401, id, { error: { code: -32001, message: "Authentication required.", data: { auth_required: true, upgrade_url: "https://intel.example/up" } } });
          case "boom_32002_claim":
            return reply(res, 403, id, { error: { code: -32002, message: "This agent key has not been claimed by a person yet.", data: { claim_required: true, required_tier: 3 } } });
          case "boom_32002_200":
            return reply(res, 200, id, { error: { code: -32002, message: "Verify your email to use MCP.", data: { email_unverified: true } } });
          case "boom_403_plain":
            res.writeHead(403, { "content-type": "application/json" });
            return res.end(JSON.stringify({ error: "forbidden", error_description: "Exports are not part of the free MCP plan." }));
          case "boom_503":
            return reply(res, 503, id, { error: { code: -32603, message: "The intelligence store is temporarily overloaded.", data: { code: "upstream_overloaded", retry_after_s: 1 } } });
          case "boom_429":
            return reply(res, 429, id, { error: { code: -32000, message: "Too many requests." } }, { "retry-after": "60" });
          case "tool_error":
            return reply(res, 200, id, {
              result: {
                isError: true,
                content: [{ type: "text", text: '{"error":{"code":"rate_limited","retryable":false,"retry_after_s":30}}' }],
                structuredContent: { error: { code: "rate_limited", message: "used up", retryable: false, retry_after_s: 30, details: { code: "free_mcp_limit_reached" } } },
              },
            });
          default:
            return reply(res, 200, id, { result: { content: [{ type: "text", text: JSON.stringify({ name, args: body.params?.arguments ?? {} }) }] } });
        }
      }
      default:
        return reply(res, 200, id, { error: { code: -32601, message: `Method not found: ${body.method}` } });
    }
  });
  return new Promise((resolve) => server.listen(0, "localhost", () => resolve({ server, seen, url: `http://localhost:${server.address().port}` })));
}

async function withProxy(baseUrl, env, fn) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [ENTRY],
    env: { PATH: process.env.PATH, THREADLINQS_API_URL: baseUrl, ...env },
    stderr: "pipe",
  });
  const stderr = [];
  transport.stderr?.on("data", (d) => stderr.push(String(d)));
  const client = new Client({ name: "proxy-test", version: "0.0.0" }, { capabilities: {} });
  await client.connect(transport);
  try {
    return await fn(client, () => stderr.join(""));
  } finally {
    await client.close().catch(() => undefined);
  }
}

const text = (r) => r.content?.[0]?.text ?? "";

for (const surface of ["v9", "v8"]) {
  console.log(`\nproxy against a ${surface}-like server`);
  const fake = await fakePlatform(surface);
  const KEY = "tl_proxy_test_key_0000000001";
  try {
    await withProxy(fake.url, { THREADLINQS_API_KEY: KEY }, async (client) => {
      await test("initialize reports this package's version", async () => {
        assert.equal(client.getServerVersion()?.version, VERSION);
        assert.equal(client.getServerVersion()?.name, "threadlinqs-intelligence");
      });

      await test("tools/list is the live list, not the bundled snapshot, and carries no degraded stamp", async () => {
        const { tools } = await client.listTools();
        const names = tools.map((t) => t.name).sort();
        assert.deepEqual(names, surface === "v9" ? ["fake_nine_a", "fake_nine_b", "get_c2"] : ["fake_eight_a", "get_c2"]);
        assert.ok(!tools.some((t) => t._meta?.["threadlinqs/catalog_source"]), "a live list must not be stamped");
      });

      await test("requests carry the dual Accept, the User-Agent and the Bearer key", async () => {
        const call = fake.seen.requests.find((r) => r.method === "tools/list");
        assert.ok(call, "no tools/list reached the fake server");
        assert.equal(call.headers.accept, "application/json, text/event-stream");
        assert.equal(call.headers["user-agent"], `intelthreadlinqs-mcp/${VERSION}`);
        assert.equal(call.headers.authorization, `Bearer ${KEY}`);
        assert.equal(call.headers["mcp-protocol-version"], "2025-11-25");
        assert.ok(!/node|darwin|linux|win32/i.test(call.headers["user-agent"]), "no machine details in the UA");
      });

      await test("tools/call returns the remote result", async () => {
        const r = await client.callTool({ name: "get_c2", arguments: { view: "stats" } });
        assert.ok(!r.isError);
        assert.deepEqual(JSON.parse(text(r)), { name: "get_c2", args: { view: "stats" } });
      });

      await test("a v7 legacy name is rewritten to its canonical tool and arguments", async () => {
        const r = await client.callTool({ name: "list_c2_beacons", arguments: { limit: 3 } });
        assert.deepEqual(JSON.parse(text(r)), { name: "get_c2", args: { view: "beacons", limit: 3 } });
      });

      await test("a structured tool error (code, retryable, retry_after_s) passes through unchanged", async () => {
        const r = await client.callTool({ name: "tool_error", arguments: {} });
        assert.equal(r.isError, true);
        assert.deepEqual(r.structuredContent.error, { code: "rate_limited", message: "used up", retryable: false, retry_after_s: 30, details: { code: "free_mcp_limit_reached" } });
        assert.match(text(r), /"retry_after_s":30/);
      });

      await test("-32001 over HTTP 401: key hint, code and data survive in _meta", async () => {
        const r = await client.callTool({ name: "boom_32001", arguments: {} });
        assert.equal(r.isError, true);
        assert.match(text(r), /Authentication required/);
        assert.match(text(r), /THREADLINQS_API_KEY was rejected/);
        const m = r._meta["threadlinqs/error"];
        assert.equal(m.rpc_code, -32001);
        assert.equal(m.kind, "key");
        assert.equal(m.http_status, 401);
        assert.equal(m.data.auth_required, true);
      });

      await test("-32002 over HTTP 403 (unclaimed agent key): plan hint, code and data survive", async () => {
        const r = await client.callTool({ name: "boom_32002_claim", arguments: {} });
        assert.match(text(r), /claimed/);
        assert.match(text(r), /claim-link/);
        const m = r._meta["threadlinqs/error"];
        assert.equal(m.rpc_code, -32002);
        assert.equal(m.kind, "plan");
        assert.equal(m.data.claim_required, true);
      });

      await test("-32002 delivered with HTTP 200 (a tl_ key refusal): unverified-email hint", async () => {
        const r = await client.callTool({ name: "boom_32002_200", arguments: {} });
        assert.match(text(r), /not verified its email/);
        assert.equal(r._meta["threadlinqs/error"].rpc_code, -32002);
      });

      await test("a 403 that is not JSON-RPC keeps its message and counts as a plan refusal", async () => {
        const r = await client.callTool({ name: "boom_403_plain", arguments: {} });
        assert.match(text(r), /not part of the free MCP plan/);
        assert.equal(r._meta["threadlinqs/error"].kind, "plan");
        assert.equal(r._meta["threadlinqs/error"].http_status, 403);
      });

      await test("503 with retry_after_s: retried, then reported with the wait and the code", async () => {
        const before = fake.seen.hits.boom_503 || 0;
        const r = await client.callTool({ name: "boom_503", arguments: {} });
        assert.equal(fake.seen.hits.boom_503 - before, 3, "two retries after the first attempt");
        assert.match(text(r), /overloaded/);
        assert.match(text(r), /Retry in 1s/);
        const m = r._meta["threadlinqs/error"];
        assert.equal(m.kind, "busy");
        assert.equal(m.rpc_code, -32603);
        assert.equal(m.retry_after_s, 1);
        assert.equal(m.data.code, "upstream_overloaded");
      });

      await test("429 with a long Retry-After fails fast and says how long to wait", async () => {
        const before = fake.seen.hits.boom_429 || 0;
        const t0 = Date.now();
        const r = await client.callTool({ name: "boom_429", arguments: {} });
        assert.equal(fake.seen.hits.boom_429 - before, 1, "no retry past the sleep cap");
        assert.ok(Date.now() - t0 < 3000);
        assert.match(text(r), /Retry in 60s/);
      });

      await test("the key never appears in an error", async () => {
        const r = await client.callTool({ name: "boom_32001", arguments: {} });
        assert.ok(!JSON.stringify(r).includes(KEY));
      });
    });

    await test("without a key the list comes from the public catalog and says so", async () => {
      await withProxy(fake.url, {}, async (client) => {
        const { tools } = await client.listTools();
        assert.equal(tools.length, surface === "v9" ? 3 : 2);
        assert.ok(tools.every((t) => t._meta?.["threadlinqs/catalog_source"] === "public_catalog"));
        const r = await client.callTool({ name: "boom_32001", arguments: {} });
        assert.match(text(r), /Set THREADLINQS_API_KEY/);
      });
    });
  } finally {
    fake.server.close();
  }
}

console.log("\noffline fallback");
await test("an unreachable platform serves the bundled snapshot, stamped as such", async () => {
  await withProxy("http://localhost:1", { THREADLINQS_API_KEY: "tl_offline_key_000000001" }, async (client, stderr) => {
    const { tools } = await client.listTools();
    assert.equal(tools.length, CATALOG_SNAPSHOT.tools.length);
    assert.deepEqual(tools.map((t) => t.name).sort(), CATALOG_SNAPSHOT.tools.map((t) => t.name).sort());
    assert.ok(tools.every((t) => t._meta?.["threadlinqs/catalog_source"] === "bundled_snapshot"));
    assert.match(stderr(), /bundled/);
  });
});

console.log(failed === 0 ? `\nPASS — ${pass} checks` : `\nFAIL — ${failed} of ${pass + failed} checks`);
process.exit(failed === 0 ? 0 : 1);
