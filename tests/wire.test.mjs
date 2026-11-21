#!/usr/bin/env node
/**
 * Unit tests for dist/wire.js: the SSE parser, the response reader (JSON and SSE), the failure
 * parser and the hint text. No network, no process spawn.
 *
 *   node tests/wire.test.mjs        (after `npm run build`)
 */
import assert from "node:assert/strict";
import {
  RemoteError,
  SseParser,
  explainFailure,
  failureKind,
  failureMeta,
  parseFailure,
  parseSse,
  pickResponse,
  readRpcResponse,
  readTextCapped,
  retryAfterOf,
  rpcMessagesOf,
  WIRE_LIMITS,
} from "../dist/wire.js";
import { readFileSync } from "node:fs";

let pass = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`  ok    ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${String(e.stack || e).split("\n").slice(0, 4).join("\n        ")}`);
  }
}

const rpc = (id, result) => JSON.stringify({ jsonrpc: "2.0", id, result });
const sseResponse = (text, status = 200, headers = {}) =>
  new Response(text, { status, headers: { "content-type": "text/event-stream", ...headers } });

/** A Response whose body arrives in the given chunks, to exercise incremental parsing. */
const chunked = (chunks, headers = { "content-type": "text/event-stream" }) => {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(c) {
        for (const ch of chunks) c.enqueue(enc.encode(ch));
        c.close();
      },
    }),
    { status: 200, headers },
  );
};

console.log("SSE parser");

await test("single event", () => {
  const ev = parseSse(`event: message\ndata: ${rpc(1, { ok: true })}\n\n`);
  assert.equal(ev.length, 1);
  assert.equal(ev[0].event, "message");
  assert.deepEqual(JSON.parse(ev[0].data).result, { ok: true });
});

await test("multi-line data is joined with newlines before JSON.parse", () => {
  const ev = parseSse('data: {"jsonrpc":"2.0",\ndata: "id":7,\ndata: "result":{"a":1}}\n\n');
  assert.equal(ev.length, 1);
  assert.equal(ev[0].data, '{"jsonrpc":"2.0",\n"id":7,\n"result":{"a":1}}');
  assert.deepEqual(rpcMessagesOf(ev[0])[0].result, { a: 1 });
});

await test("notifications before the result: the answer is the event whose id matches", () => {
  const text =
    `event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", method: "notifications/progress", params: { progress: 1 } })}\n\n` +
    `event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", id: 99, result: { other: true } })}\n\n` +
    `event: message\ndata: ${rpc(5, { mine: true })}\n\n`;
  const msgs = parseSse(text).flatMap(rpcMessagesOf);
  assert.equal(msgs.length, 3);
  assert.deepEqual(pickResponse(msgs, 5).result, { mine: true });
  assert.equal(pickResponse(msgs, 6), undefined);
});

await test("no trailing blank line: flush dispatches the last event", () => {
  const p = new SseParser();
  assert.deepEqual(p.push(`data: ${rpc(3, { late: true })}`), []);
  const tail = p.flush();
  assert.equal(tail.length, 1);
  assert.deepEqual(JSON.parse(tail[0].data).result, { late: true });
});

await test("CRLF, comments, a BOM, a chunk split inside a line and inside CRLF", () => {
  const p = new SseParser();
  const out = [];
  const doc = `﻿: keep-alive\r\nevent: message\r\ndata: {"id":1,\r\ndata: "result":{}}\r\n\r\n`;
  for (const ch of doc) out.push(...p.push(ch)); // one character at a time
  out.push(...p.flush());
  assert.equal(out.length, 1);
  assert.equal(out[0].data, '{"id":1,\n"result":{}}');
});

await test("an event with no data line is not dispatched; a space after the colon is optional", () => {
  const ev = parseSse("event: ping\n\ndata:{\"id\":1,\"result\":1}\n\n");
  assert.equal(ev.length, 1);
  assert.equal(ev[0].data, '{"id":1,"result":1}');
});

await test("a batch array in one event yields every message", () => {
  const ev = parseSse(`data: [${rpc(1, 1)},${rpc(2, 2)}]\n\n`);
  assert.equal(rpcMessagesOf(ev[0]).length, 2);
});

await test("unparseable data is skipped, not thrown", () => {
  assert.deepEqual(rpcMessagesOf({ event: "message", data: "{nope" }), []);
});

console.log("\nreadRpcResponse");

await test("plain JSON (v8)", async () => {
  const res = new Response(rpc(4, { tools: [] }), { headers: { "content-type": "application/json" } });
  assert.deepEqual((await readRpcResponse(res, 4)).result, { tools: [] });
});

await test("plain JSON with a JSON-RPC error keeps code and data", async () => {
  const res = new Response(JSON.stringify({ jsonrpc: "2.0", id: 4, error: { code: -32001, message: "no", data: { auth_required: true } } }));
  const m = await readRpcResponse(res, 4);
  assert.equal(m.error.code, -32001);
  assert.deepEqual(m.error.data, { auth_required: true });
});

await test("SSE (v9): result after a notification, no trailing blank line", async () => {
  const body =
    `event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", method: "notifications/message", params: {} })}\n\n` +
    `event: message\ndata: ${rpc(8, { content: [{ type: "text", text: "hi" }] })}`;
  const m = await readRpcResponse(sseResponse(body), 8);
  assert.equal(m.result.content[0].text, "hi");
});

await test("SSE arriving in small chunks, split mid-event", async () => {
  const doc = `event: message\ndata: ${rpc(2, { n: 1 })}\n\n`;
  const cut = [doc.slice(0, 11), doc.slice(11, 40), doc.slice(40)];
  assert.deepEqual((await readRpcResponse(chunked(cut), 2)).result, { n: 1 });
});

await test("SSE: the call returns as soon as the answer is complete, even if the stream stays open", async () => {
  const enc = new TextEncoder();
  const res = new Response(
    new ReadableStream({
      start(c) {
        c.enqueue(enc.encode(`event: message\ndata: ${rpc(1, { done: true })}\n\n`)); // never closed
      },
    }),
    { headers: { "content-type": "text/event-stream" } },
  );
  const m = await Promise.race([readRpcResponse(res, 1), new Promise((_, rej) => setTimeout(() => rej(new Error("hung")), 1500))]);
  assert.deepEqual(m.result, { done: true });
});

await test("SSE: a stream with no answer to the request is an error, not a hang", async () => {
  await assert.rejects(readRpcResponse(sseResponse(`data: ${rpc(2, 1)}\n\n`), 1), (e) => e instanceof RemoteError && /ended without an answer/.test(e.message));
});

await test("SSE: a lone response with a null id is accepted once the stream ends (unparseable request)", async () => {
  const body = `data: ${JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } })}\n\n`;
  const m = await readRpcResponse(sseResponse(body), 1);
  assert.equal(m.error.code, -32700);
});

await test("not JSON-RPC at all", async () => {
  await assert.rejects(readRpcResponse(new Response("<html>"), 1), (e) => e instanceof RemoteError && /not JSON-RPC/.test(e.message));
});

console.log("\nparseFailure");

await test("a JSON-RPC error body keeps code, data and the retry hint", () => {
  const body = JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32002, message: "MCP access requires Purple or Gold tier.", data: { required_tier: 3, claim_required: true } } });
  const f = parseFailure(403, "Forbidden", body, "application/json");
  assert.equal(f.code, -32002);
  assert.equal(f.message, "MCP access requires Purple or Gold tier.");
  assert.equal(f.data.claim_required, true);
});

await test("503 with retry_after_s in the error data (and the header wins when both exist)", () => {
  const body = JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32603, message: "busy", data: { retry_after_s: 2 } } });
  assert.equal(parseFailure(503, "Service Unavailable", body, "application/json").retryAfterS, 2);
  assert.equal(parseFailure(503, "Service Unavailable", body, "application/json", 9).retryAfterS, 9);
});

await test("a platform REST-style body keeps its fields as data", () => {
  const body = JSON.stringify({ error: "quota", message: "The agent's daily request quota is used up.", used: 5, limit: 5, retry_after: 30 });
  const f = parseFailure(429, "Too Many Requests", body, "application/json");
  assert.match(f.message, /daily request quota/);
  assert.equal(f.data.used, 5);
  assert.equal(f.retryAfterS, 30);
});

await test("a JSON-RPC error delivered as SSE on a non-2xx", () => {
  const body = `event: message\ndata: ${JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code: -32001, message: "Authentication required." } })}\n\n`;
  const f = parseFailure(401, "Unauthorized", body, "text/event-stream");
  assert.equal(f.code, -32001);
});

await test("an HTML error page becomes a clipped excerpt", () => {
  const f = parseFailure(502, "Bad Gateway", "<html>" + "x".repeat(1000), "text/html");
  assert.ok(f.message.startsWith("MCP 502 Bad Gateway"));
  assert.ok(f.message.length < 460);
  assert.equal(f.code, undefined);
});

await test("retryAfterOf reads the common shapes and ignores junk", () => {
  assert.equal(retryAfterOf({ retry_after_s: 3 }), 3);
  assert.equal(retryAfterOf({ error: { data: { retry_after_s: 4 } } }), 4);
  assert.equal(retryAfterOf({ retry_after: 5 }), 5);
  assert.equal(retryAfterOf({ retry_after_s: "soon" }), undefined);
  assert.equal(retryAfterOf(null), undefined);
});

console.log("\nexplainFailure");

const err = (message, code, data, meta) => new RemoteError(message, code, data, meta);

await test("-32001 without a key: tells you to set one; with a key: says it was rejected", () => {
  assert.match(explainFailure(err("Authentication required.", -32001), false), /Set THREADLINQS_API_KEY/);
  assert.match(explainFailure(err("Authentication required.", -32001), true), /was rejected/);
  assert.equal(failureKind(err("x", undefined, undefined, { status: 401 })), "key");
});

await test("-32002 unclaimed agent key", () => {
  const t = explainFailure(err("This agent key has not been claimed", -32002, { claim_required: true }), true);
  assert.match(t, /claim_link|claim-link/);
  assert.match(t, /person/);
});

await test("-32002 unverified email, free plan off, plan too low", () => {
  assert.match(explainFailure(err("Verify your email", -32002, { email_unverified: true }), true), /verified its email|verification/);
  assert.match(explainFailure(err("off", -32002, { free_plan_on: false }), true), /free plan is switched off/);
  assert.match(explainFailure(err("low", -32002, { required_tier: 3 }), true), /does not cover the call/);
  assert.equal(failureKind(err("x", undefined, undefined, { status: 403 })), "plan");
});

await test("an excluded tool and a used-up allowance, when they arrive as a protocol error", () => {
  assert.match(explainFailure(err("x", -32002, { error: "free_mcp_tool_excluded" }), true), /not part of the free plan/);
  assert.match(explainFailure(err("x", -32002, { code: "free_mcp_limit_reached" }), true), /daily calls are used up/);
});

await test("the upgrade URL from the platform's data is used when present", () => {
  assert.match(explainFailure(err("low", -32002, { upgrade_url: "https://example.test/up" }), true), /example\.test\/up/);
});

await test("503 says when to retry; 429 too", () => {
  assert.match(explainFailure(err("busy", -32603, undefined, { status: 503, retryAfterS: 2 }), true), /Retry in 2s/);
  assert.match(explainFailure(err("slow down", undefined, undefined, { status: 429, retryAfterS: 60 }), true), /Retry in 60s/);
});

await test("no hint restates a price or a typed count", () => {
  const all = [
    explainFailure(err("a", -32001), false),
    explainFailure(err("a", -32001), true),
    explainFailure(err("a", -32002, { claim_required: true }), true),
    explainFailure(err("a", -32002, { email_unverified: true }), true),
    explainFailure(err("a", -32002, { free_plan_on: false }), true),
    explainFailure(err("a", -32002), true),
  ].join("\n");
  assert.ok(!/\$\s?\d|\b\d+\s+(tool )?calls? a day\b/i.test(all), all);
});

await test("failureMeta carries the machine-readable fields", () => {
  const m = failureMeta(err("busy", -32603, { retry_after_s: 2 }, { status: 503, retryAfterS: 2 }));
  assert.deepEqual(m, { kind: "busy", rpc_code: -32603, http_status: 503, retry_after_s: 2, data: { retry_after_s: 2 } });
});

console.log("\nlimits (Wave 4 review 11)");

const SMALL = { maxResponseBytes: 64 * 1024, maxEventChars: 4096, maxErrorBytes: 256 };

await test("one event past maxEventChars is abandoned with a RemoteError (no blank line ever comes)", async () => {
  const chunks = ["data: ", ...Array.from({ length: 10 }, () => "x".repeat(1000))];
  await assert.rejects(readRpcResponse(chunked(chunks), 1, SMALL), (e) => e instanceof RemoteError && /exceeded 4096 characters/.test(e.message));
  const p = new SseParser(100);
  assert.throws(() => p.push("data: " + "y".repeat(200)), RemoteError);
});

await test("a stream past maxResponseBytes is abandoned (many small events, none the answer)", async () => {
  const note = `data: ${JSON.stringify({ jsonrpc: "2.0", method: "notifications/progress", params: { p: "z".repeat(100) } })}\n\n`;
  const chunks = Array.from({ length: 1000 }, () => note).concat([`data: ${rpc(1, { ok: true })}\n\n`]);
  await assert.rejects(readRpcResponse(chunked(chunks), 1, SMALL), (e) => e instanceof RemoteError && /exceeded 65536 bytes/.test(e.message));
  // Under the default ceiling the same stream answers.
  assert.deepEqual((await readRpcResponse(chunked(chunks), 1)).result, { ok: true });
});

await test("a JSON answer past maxResponseBytes is refused; under it, read as before", async () => {
  const big = JSON.stringify({ jsonrpc: "2.0", id: 1, result: { pad: "q".repeat(70 * 1024) } });
  await assert.rejects(readRpcResponse(chunked([big], { "content-type": "application/json" }), 1, SMALL), /exceeded 65536 bytes/);
  assert.equal((await readRpcResponse(chunked([big], { "content-type": "application/json" }), 1)).result.pad.length, 70 * 1024);
});

await test("readTextCapped reads at most maxBytes of an error body and cancels the rest", async () => {
  let pulled = 0;
  const res = new Response(new ReadableStream({ pull(c) { pulled++; c.enqueue(new TextEncoder().encode("e".repeat(100))); if (pulled > 1000) c.close(); } }), { status: 500 });
  const r = await readTextCapped(res, 256);
  assert.equal(r.truncated, true);
  assert.equal(r.text, "e".repeat(256));
  assert.ok(pulled < 20, "stopped pulling after the cap: " + pulled);
  const small = await readTextCapped(new Response("short"), 256);
  assert.deepEqual(small, { text: "short", truncated: false });
  assert.ok(WIRE_LIMITS.maxErrorBytes > 0 && WIRE_LIMITS.maxResponseBytes >= WIRE_LIMITS.maxEventChars);
  const src = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
  assert.ok(src.includes("readTextCapped(res, WIRE_LIMITS.maxErrorBytes)") && !/await res\.text\(\)/.test(src), "the proxy reads a non-2xx body through the cap");
});

await test("one large event costs linear time (16 MB in 16 KB chunks), and blank lines split across chunks still end events", async () => {
  const p = new SseParser(32 * 1024 * 1024);
  const chunk = "x".repeat(16384);
  const t0 = performance.now();
  p.push("data: ");
  for (let i = 0; i < 1024; i++) assert.equal(p.push(chunk).length, 0);
  const ev = p.push("\n\n");
  const ms = performance.now() - t0;
  assert.equal(ev.length, 1);
  assert.equal(ev[0].data.length, 16 * 1024 * 1024);
  assert.ok(ms < 400, "16 MB event took " + ms.toFixed(0) + " ms (quadratic rescans take seconds)");
  const q = new SseParser();
  assert.deepEqual([...q.push("data: a\n"), ...q.push("\ndata: b\r"), ...q.push("\n\r"), ...q.push("\n")].map((e) => e.data), ["a", "b"]);
  const r = new SseParser();
  assert.deepEqual([...r.push("data: c\r"), ...r.push("\rdata: d\n\n")].map((e) => e.data), ["c", "d"]);
  const f = new SseParser();
  assert.deepEqual([...f.push("data: e\r"), ...f.flush()].map((e) => e.data), ["e"]);
});

console.log(failed === 0 ? `\nPASS — ${pass} checks` : `\nFAIL — ${failed} of ${pass + failed} checks`);
process.exit(failed === 0 ? 0 : 1);
