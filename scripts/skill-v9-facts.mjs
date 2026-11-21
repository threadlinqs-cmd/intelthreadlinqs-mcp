/**
 * Facts the v9 skill build reads from the local v9 package source (never from the network).
 * Run by build-skill-v9.mjs as `node --import tsx <this file> '<json cases>'` with cwd
 * packages/mcp-v9, so tsx and the v9 dependencies resolve from that package.
 *
 * Prints one JSON object:
 *   legacy: [{ name, tools, passthrough }]  every v8 name that is not a v9 tool, with the v9 tools its
 *           route reaches (aliasTargets) and whether some argument shapes go to the original handler
 *   free:   [{ tool, args, excluded }]       freeExcluded() evaluated for each case passed in argv[2]
 */
const aliases = await import("../../mcp-v9/src/legacy/aliases.ts");
const free = await import("../../mcp-v9/src/core/free.ts");

const cases = JSON.parse(process.argv[2] || "[]");
const out = {
  legacy: aliases.LEGACY_TOOL_NAMES.map((name) => ({ name, ...aliases.aliasTargets(name) })),
  v8_names: aliases.V8_TOOL_NAMES,
  free: cases.map(([tool, args]) => ({ tool, args, excluded: free.freeExcluded(tool, args) })),
};
process.stdout.write(JSON.stringify(out));
