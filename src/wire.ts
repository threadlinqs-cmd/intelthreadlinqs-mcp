/**
 * Wire layer of the stdio proxy: everything that turns an HTTP answer from the remote `/mcp`
 * into either a JSON-RPC result or a structured failure. Pure (no environment, no side effects)
 * so tests/wire.test.mjs can drive it directly.
 *
 * Two server surfaces answer on the same URL and the flag that picks one can change between two
 * runs of this proxy, so both are handled:
 *   - v8 answers `application/json` (one JSON-RPC object per POST);
 *   - v9 answers `text/event-stream` to a client that accepts it (the SDK's legacy transport
 *     frames every reply as SSE), and a plain JSON-RPC object for a JSON-only Accept.
 * The proxy sends the dual Accept and branches on the response content type.
 *
 * @author Threadlinqs Team
 */

export interface RpcErrorBody {
  code: number;
  message: string;
  data?: unknown;
}

export interface RpcMessage {
  jsonrpc?: string;
  id?: unknown;
  method?: string;
  result?: unknown;
  error?: RpcErrorBody;
}

/** A failed remote call. `code` / `data` are the JSON-RPC error's own, when the server sent one. */
export class RemoteError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly data?: unknown,
    readonly meta: { status?: number; retryAfterS?: number } = {},
  ) {
    super(message);
    this.name = "RemoteError";
  }
}

// ---------------------------------------------------------------------------
// SSE
// ---------------------------------------------------------------------------
export interface SseEvent {
  event: string;
  data: string;
  id?: string;
}

// ---------------------------------------------------------------------------
// LIMITS
// ---------------------------------------------------------------------------
/**
 * Ceilings on what one answer may make the proxy hold. THREADLINQS_API_URL may name any https host,
 * and the only other bound is the request timeout, so a server that keeps streaming (or one huge
 * answer) must not be able to hold the proxy's memory and CPU for the whole window.
 */
export const WIRE_LIMITS = Object.freeze({
  /** Bytes of one answer, JSON or the whole event stream. */
  maxResponseBytes: 32 * 1024 * 1024,
  /** Characters of one SSE event (an event still waiting for its blank line). */
  maxEventChars: 16 * 1024 * 1024,
  /** Bytes of a non-2xx body read for its error (the rest is not read). */
  maxErrorBytes: 64 * 1024,
});
export type WireLimits = { maxResponseBytes: number; maxEventChars: number; maxErrorBytes: number };

/**
 * Read a body as text, at most `maxBytes` bytes; the stream is cancelled past the cap.
 * Returns the text read and whether the body was longer.
 */
export async function readTextCapped(res: Response, maxBytes: number): Promise<{ text: string; truncated: boolean }> {
  if (!res.body) {
    const text = await res.text().catch(() => "");
    return text.length > maxBytes ? { text: text.slice(0, maxBytes), truncated: true } : { text, truncated: false };
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  let truncated = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const room = maxBytes - bytes;
      if (value.byteLength > room) {
        text += decoder.decode(value.subarray(0, Math.max(0, room)), { stream: true });
        truncated = true;
        break;
      }
      bytes += value.byteLength;
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch {
    /* a broken stream: keep what was read */
  } finally {
    reader.cancel().catch(() => undefined);
  }
  return { text, truncated };
}

/**
 * Incremental Server-Sent-Events parser. Feed it text as it arrives with `push`; `flush` at the
 * end of the stream dispatches a final event that was not followed by a blank line.
 *
 * Follows the WHATWG rules the proxy needs: events end at a blank line, a line starting with ":"
 * is a comment, `data:` lines of one event are joined with "\n" (one optional space after the
 * colon is dropped), CRLF / CR / LF all terminate a line, an event with no `data:` line is not
 * dispatched, and a leading BOM is ignored.
 *
 * Linear in the input: line endings are normalised on each new chunk only (a trailing "\r" is held
 * back, it may be the first half of "\r\n"), and the search for the blank line resumes where the
 * previous one stopped. An event that grows past `maxEventChars` without ending throws a
 * RemoteError instead of growing the buffer without bound.
 */
export class SseParser {
  /** Text of the event still waiting for its blank line, kept as the chunks it arrived in. */
  private parts: string[] = [];
  private size = 0;
  private last = "";
  private first = true;
  private heldCR = false;

  constructor(private readonly maxEventChars: number = WIRE_LIMITS.maxEventChars) {}

  push(chunk: string): SseEvent[] {
    if (this.first && chunk.length > 0) {
      this.first = false;
      if (chunk.charCodeAt(0) === 0xfeff) chunk = chunk.slice(1);
    }
    if (this.heldCR) {
      chunk = "\r" + chunk;
      this.heldCR = false;
    }
    if (chunk.endsWith("\r")) {
      this.heldCR = true;
      chunk = chunk.slice(0, -1);
    }
    const c = chunk.replace(/\r\n?/g, "\n");
    const out: SseEvent[] = [];
    const emit = (block: string) => {
      const ev = parseBlock(block);
      if (ev) out.push(ev);
    };
    let start = 0;
    // A blank line split across chunks: the pending text ends with "\n" and this chunk starts with one.
    if (this.size > 0 && this.last === "\n" && c.startsWith("\n")) {
      emit(this.take().slice(0, -1));
      start = 1;
    }
    // Only the new chunk is searched; the pending text is joined once, when its event ends.
    let at: number;
    while ((at = c.indexOf("\n\n", start)) >= 0) {
      emit(this.take() + c.slice(start, at));
      start = at + 2;
    }
    if (start < c.length) {
      const rest = start > 0 ? c.slice(start) : c;
      this.parts.push(rest);
      this.size += rest.length;
      this.last = rest[rest.length - 1];
    }
    if (this.size > this.maxEventChars) {
      this.take();
      throw new RemoteError(`An event from the Threadlinqs MCP endpoint exceeded ${this.maxEventChars} characters; the answer was abandoned.`);
    }
    return out;
  }

  flush(): SseEvent[] {
    const rest = (this.take() + (this.heldCR ? "\n" : "")).replace(/\n+$/, "");
    this.heldCR = false;
    if (!rest) return [];
    const ev = parseBlock(rest);
    return ev ? [ev] : [];
  }

  private take(): string {
    const text = this.parts.length === 1 ? this.parts[0] : this.parts.join("");
    this.parts = [];
    this.size = 0;
    this.last = "";
    return text;
  }
}

function parseBlock(block: string): SseEvent | null {
  let event = "message";
  let id: string | undefined;
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (line === "" || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "data") data.push(value);
    else if (field === "event") event = value;
    else if (field === "id") id = value;
  }
  if (data.length === 0) return null;
  return { event, data: data.join("\n"), id };
}

/** The JSON-RPC messages carried by one SSE event (a JSON array is a batch). Unparseable data is skipped. */
export function rpcMessagesOf(ev: SseEvent): RpcMessage[] {
  let v: unknown;
  try {
    v = JSON.parse(ev.data);
  } catch {
    return [];
  }
  const list = Array.isArray(v) ? v : [v];
  return list.filter((m): m is RpcMessage => !!m && typeof m === "object");
}

const isResponse = (m: RpcMessage) => m.method === undefined && ("result" in m || "error" in m);

/**
 * The answer to request `id` among `messages`. Notifications and server-initiated requests (they
 * carry a `method`) are never the answer. A lone response with a null id is accepted as a last
 * resort: that is how a server reports a request it could not parse.
 */
export function pickResponse(messages: RpcMessage[], id: unknown): RpcMessage | undefined {
  const responses = messages.filter(isResponse);
  const exact = responses.find((m) => m.id === id);
  if (exact) return exact;
  const loose = responses.filter((m) => m.id === null || m.id === undefined);
  return loose.length === 1 && responses.length === 1 ? loose[0] : undefined;
}

/** Parse a complete SSE document (tests, and the error path where the body is already text). */
export function parseSse(text: string): SseEvent[] {
  const p = new SseParser();
  return [...p.push(text), ...p.flush()];
}

const isSse = (contentType: string | null) => /text\/event-stream/i.test(contentType || "");

/**
 * Read the JSON-RPC response to request `id` from an HTTP response, JSON or SSE. For SSE the
 * stream is read incrementally and abandoned as soon as the matching response has arrived, so a
 * server that keeps the stream open after its answer cannot hang the call. Either way the answer
 * is bounded by `limits` (WIRE_LIMITS): past maxResponseBytes, or one event past maxEventChars,
 * the read stops with a RemoteError.
 */
export async function readRpcResponse(res: Response, id: unknown, limits: WireLimits = WIRE_LIMITS): Promise<RpcMessage> {
  const tooLarge = () =>
    new RemoteError(`The answer from the Threadlinqs MCP endpoint exceeded ${limits.maxResponseBytes} bytes; it was abandoned.`);
  if (!isSse(res.headers.get("content-type"))) {
    const { text, truncated } = await readTextCapped(res, limits.maxResponseBytes);
    if (truncated) throw tooLarge();
    let v: unknown = null;
    try {
      v = JSON.parse(text);
    } catch {
      /* handled below */
    }
    const list = Array.isArray(v) ? v : v && typeof v === "object" ? [v] : [];
    const hit = pickResponse(list as RpcMessage[], id);
    if (!hit) throw new RemoteError("Malformed response from the Threadlinqs MCP endpoint (not JSON-RPC).");
    return hit;
  }

  if (!res.body) throw new RemoteError("The Threadlinqs MCP endpoint answered with an empty event stream.");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const parser = new SseParser(limits.maxEventChars);
  // Only responses are kept (notifications and server requests are never the answer), and each
  // message is looked at once, when it arrives.
  const responses: RpcMessage[] = [];
  const take = (events: SseEvent[]): RpcMessage | undefined => {
    for (const ev of events) {
      for (const m of rpcMessagesOf(ev)) {
        if (!isResponse(m)) continue;
        // A null-id response only counts once the stream is over (see the end of this function).
        if (m.id === id) return m;
        responses.push(m);
      }
    }
    return undefined;
  };
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limits.maxResponseBytes) throw tooLarge();
      const hit = take(parser.push(decoder.decode(value, { stream: true })));
      if (hit) return hit;
    }
    const tail = decoder.decode();
    const hit = take([...(tail ? parser.push(tail) : []), ...parser.flush()]);
    if (hit) return hit;
    const loose = pickResponse(responses, id);
    if (loose) return loose;
  } finally {
    reader.cancel().catch(() => undefined);
  }
  throw new RemoteError("The event stream from the Threadlinqs MCP endpoint ended without an answer to the request.");
}

// ---------------------------------------------------------------------------
// FAILURES
// ---------------------------------------------------------------------------
export interface Failure {
  message: string;
  code?: number;
  data?: unknown;
  retryAfterS?: number;
}

const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined);
const obj = (v: unknown): Record<string, unknown> | undefined =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;

/** The retry hint a body carries: v9's `retry_after_s`, the platform's `retry_after`, nested in error / data or not. */
export function retryAfterOf(body: unknown): number | undefined {
  const b = obj(body);
  if (!b) return undefined;
  const e = obj(b.error);
  const d = obj(e?.data) ?? obj(b.data);
  return num(b.retry_after_s) ?? num(b.retry_after) ?? num(e?.retry_after_s) ?? num(d?.retry_after_s) ?? num(d?.retry_after);
}

/**
 * Make sense of a non-2xx answer. A JSON-RPC error body (JSON or a one-event SSE document) keeps
 * its `code` and `data`; a platform REST-style body (`{error: "quota", message, ...}`) keeps its
 * fields as `data`; anything else becomes a clipped excerpt.
 */
export function parseFailure(
  status: number,
  statusText: string,
  bodyText: string,
  contentType: string | null,
  retryAfterHeader?: number,
): Failure {
  let body: unknown;
  const trimmed = bodyText.trim();
  if (isSse(contentType) || /^(event|data):/.test(trimmed)) {
    for (const ev of parseSse(trimmed)) {
      const hit = rpcMessagesOf(ev).find((m) => m.error);
      if (hit) {
        body = hit;
        break;
      }
    }
  } else {
    try {
      body = JSON.parse(trimmed);
    } catch {
      /* excerpt below */
    }
  }
  const retryAfterS = retryAfterHeader ?? retryAfterOf(body);
  const b = obj(body);
  const rpc = obj(b?.error);
  if (rpc && typeof rpc.message === "string") {
    return {
      message: rpc.message,
      code: typeof rpc.code === "number" ? rpc.code : undefined,
      data: rpc.data,
      retryAfterS,
    };
  }
  if (b) {
    const text = typeof b.message === "string" ? b.message : typeof b.error_description === "string" ? b.error_description : typeof b.error === "string" ? b.error : undefined;
    if (text) return { message: `MCP ${status} ${statusText} — ${text}`.trim(), data: b, retryAfterS };
  }
  return { message: `MCP ${status} ${statusText} — ${bodyText.slice(0, 400)}`.trim(), retryAfterS };
}

// ---------------------------------------------------------------------------
// HINTS
// ---------------------------------------------------------------------------
export const PROFILE_URL = "https://intel.threadlinqs.com/profile";
export const PRICING_URL = "https://threadlinqs.com/#pricing";

export type FailureKind = "key" | "plan" | "rate" | "busy" | "other";

/** What kind of failure this is, from the JSON-RPC code first, then the HTTP status. */
export function failureKind(e: RemoteError): FailureKind {
  if (e.code === -32001 || e.meta.status === 401) return "key";
  if (e.code === -32002 || e.meta.status === 403) return "plan";
  if (e.meta.status === 429) return "rate";
  if (typeof e.meta.status === "number" && e.meta.status >= 500) return "busy";
  return "other";
}

/**
 * The text a person sees for a failed call: the platform's own message, then one actionable
 * paragraph. The platform's -32002 messages already name the allowance and the reason; this adds
 * the remedy for the stdio setup, without restating any price or count (those live in the
 * platform's message and in the `account` tool).
 */
export function explainFailure(e: RemoteError, hasKey: boolean): string {
  const data = obj(e.data) ?? {};
  const kind = failureKind(e);
  const upgrade = typeof data.upgrade_url === "string" ? data.upgrade_url : PRICING_URL;
  switch (kind) {
    case "key":
      return hasKey
        ? `${e.message}\n\nThe configured THREADLINQS_API_KEY was rejected (mistyped, revoked or expired). Check it at ${PROFILE_URL}`
        : `${e.message}\n\nSet THREADLINQS_API_KEY to your Threadlinqs key (get one at ${PROFILE_URL}; a free account has a small daily allowance, Purple and Gold have full access) and restart the MCP server.`;
    case "plan": {
      let hint: string;
      if (data.claim_required === true) {
        hint =
          "This is an agent key (tla_) that no person has claimed yet. Ask the person who runs the agent to claim it with the claim_url from POST /api/v1/agents/claim-link; once claimed it acts with that person's plan.";
      } else if (data.email_unverified === true) {
        hint = `The account behind this key has not verified its email. Open the verification link in the sign-up email (or request a new one at ${PROFILE_URL}), then retry.`;
      } else if (data.free_plan_on === false) {
        hint = `The free plan is switched off right now. Purple and Gold keys still work: ${upgrade}`;
      } else if (data.error === "free_mcp_tool_excluded" || data.code === "free_mcp_tool_excluded") {
        hint = `This tool is not part of the free plan (bundles and exports need Purple or Gold; single lookups are still open). Plans: ${upgrade}`;
      } else if (data.error === "free_mcp_limit_reached" || data.code === "free_mcp_limit_reached") {
        hint = `The free plan's daily calls are used up; they renew daily. Purple and Gold have no daily call limit: ${upgrade}`;
      } else {
        hint = `This key's plan does not cover the call. Plans: ${upgrade}`;
      }
      return `${e.message}\n\n${hint}`;
    }
    case "rate":
      return e.meta.retryAfterS !== undefined
        ? `${e.message}\n\nRetry in ${Math.ceil(e.meta.retryAfterS)}s.`
        : e.message;
    case "busy":
      return e.meta.retryAfterS !== undefined
        ? `${e.message}\n\nThe service is busy or restarting. Retry in ${Math.ceil(e.meta.retryAfterS)}s.`
        : `${e.message}\n\nThe service is busy or restarting. Try again shortly.`;
    default:
      return e.message;
  }
}

/** Machine-readable twin of the text, for `_meta` (never `structuredContent`, which hosts validate against outputSchema). */
export function failureMeta(e: RemoteError): Record<string, unknown> {
  const out: Record<string, unknown> = { kind: failureKind(e) };
  if (e.code !== undefined) out.rpc_code = e.code;
  if (e.meta.status !== undefined) out.http_status = e.meta.status;
  if (e.meta.retryAfterS !== undefined) out.retry_after_s = e.meta.retryAfterS;
  if (e.data !== undefined) out.data = e.data;
  return out;
}
