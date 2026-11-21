#!/usr/bin/env node
/**
 * The built proxy against the REAL v9 server: `npm run dev:node` in packages/mcp-v9 (the embedded v9
 * server over recorded fixtures, no network, no credentials). Runs the proxy through the SDK's stdio
 * client and checks the live tool list, a native call, a legacy-name call, a structured tool error, and
 * prompts and resources.
 *
 * Skips cleanly (exit 0, with the reason) when the dev server cannot start: no packages/mcp-v9, no
 * node_modules there, Node older than 22, or no start within the deadline.
 *
 *   node tests/integration-v9.test.mjs        (after `npm run build`)
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const V9 = join(ROOT, "..", "mcp-v9");
const ENTRY = join(ROOT, "dist", "index.js");
const KEY = "tl_dev_fixture_key_000001"; // the dev server's fixture identity (a public test value, not a secret)

const skip = (why) => {
  console.log(`SKIP — ${why}`);
  process.exit(0);
};

if (!existsSync(join(V9, "scripts", "dev-server.ts"))) skip("packages/mcp-v9 is not next to this package");
if (!existsSync(join(V9, "node_modules"))) skip("packages/mcp-v9 has no node_modules (run npm ci there)");
if (Number(process.versions.node.split(".")[0]) < 22) skip(`the v9 dev server needs Node 22+ (this is ${process.versions.node})`);

const freePort = () =>
  new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, "localhost", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
    s.on("error", reject);
  });

const port = await freePort();
const dev = spawn(process.execPath, ["--import", "tsx", "scripts/dev-server.ts"], {
  cwd: V9,
  env: { ...process.env, PORT: String(port), LOG_LEVEL: "silent" },
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
dev.stdout.on("data", (d) => (log += d));
dev.stderr.on("data", (d) => (log += d));
const stop = () => {
  try {
    dev.kill("SIGTERM");
  } catch {
    /* already gone */
  }
};
process.on("exit", stop);

const started = await new Promise((resolve) => {
  const t = setTimeout(() => resolve(false), 45_000);
  const poll = setInterval(() => {
    if (/dev server: http/.test(log)) {
      clearTimeout(t);
      clearInterval(poll);
      resolve(true);
    }
  }, 100);
  dev.on("exit", () => {
    clearTimeout(t);
    clearInterval(poll);
    resolve(false);
  });
});
if (!started) {
  stop();
  skip(`the v9 dev server did not start (${log.trim().split("\n").slice(-2).join(" | ") || "no output"})`);
}

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
const text = (r) => r.content?.[0]?.text ?? "";

console.log(`proxy against the v9 dev server on :${port}`);
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [ENTRY],
  env: { PATH: process.env.PATH, THREADLINQS_API_URL: `http://localhost:${port}`, THREADLINQS_API_KEY: KEY },
  stderr: "pipe",
});
let stderr = "";
transport.stderr?.on("data", (d) => (stderr += d));
const client = new Client({ name: "integration-test", version: "0.0.0" }, { capabilities: {} });
try {
  await client.connect(transport);

  await test("startup reached the v9 server over SSE (version and protocol named on stderr)", async () => {
    assert.match(stderr, /remote v9\.\d+\.\d+/);
    assert.match(stderr, /2025-11-25/);
  });

  await test("tools/list is live: 25 tools, none stamped as a fallback", async () => {
    const { tools } = await client.listTools();
    assert.equal(tools.length, 25);
    assert.ok(tools.some((t) => t.name === "get_threat") && tools.some((t) => t.name === "account"));
    assert.ok(!tools.some((t) => t._meta?.["threadlinqs/catalog_source"]), "the live list must not carry a degraded stamp");
    assert.ok(!tools.some((t) => t.name === "get_platform_stats"), "legacy names are not listed");
  });

  await test("a native v9 tool call returns data", async () => {
    const r = await client.callTool({ name: "status", arguments: {} });
    assert.ok(!r.isError, text(r));
    assert.match(text(r), /"version":"9\./);
  });

  await test("a legacy v8 name stays callable (unlisted alias)", async () => {
    const r = await client.callTool({ name: "get_platform_stats", arguments: {} });
    assert.ok(!r.isError, text(r));
    assert.match(text(r), /"corpus"/);
  });

  await test("a v9 structured tool error passes through unchanged (code, retryable, hint)", async () => {
    const r = await client.callTool({ name: "get_threat", arguments: { id: "nope" } });
    assert.equal(r.isError, true);
    const e = JSON.parse(text(r)).error;
    assert.equal(e.code, "invalid_argument");
    assert.equal(e.retryable, false);
    assert.equal(typeof e.hint, "string");
    assert.deepEqual(r.structuredContent?.error?.code, "invalid_argument");
  });

  await test("prompts and resources are listed through the proxy", async () => {
    const { prompts } = await client.listPrompts();
    assert.ok(prompts.length > 10);
    const { resources } = await client.listResources();
    assert.ok(resources.some((r) => r.uri.startsWith("ui://threadlinqs/v9/")));
  });
} catch (e) {
  failed++;
  console.log(`  FAIL  proxy could not connect: ${e.message}\n        stderr: ${stderr.trim().split("\n").slice(-3).join(" | ")}`);
} finally {
  await client.close().catch(() => undefined);
  stop();
}

console.log(failed === 0 ? `\nPASS — ${pass} checks` : `\nFAIL — ${failed} problem(s), ${pass} ok`);
process.exit(failed === 0 ? 0 : 1);
