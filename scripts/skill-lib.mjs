/**
 * Shared by the two skill builds: scripts/build-skill.mjs (the v8 skill, served while the
 * cfg:mcp-v9 flag is not "on") and scripts/build-skill-v9.mjs (the lean v9 skill).
 *
 * Everything here is byte-for-byte what build-skill.mjs did inline before the v9 build existed,
 * so the v8 artefacts did not change when it moved here.
 */
import { deflateRawSync, crc32 } from "node:zlib";

/**
 * Validates the SKILL.md frontmatter and returns { name, description }, or throws.
 *
 * The worker's /.well-known/agent-skills/index.json lists the skill with SKILL_META's name and
 * description, and the Agent Skills spec / Claude skill upload require the index to match what a
 * YAML parser reads out of the zip's SKILL.md. Only one shape is accepted:
 *   name: <spec name>
 *   description: >-
 *     <two-space-indented folded lines, no blank / more-indented / tab lines>
 * For exactly that shape, trim + join with single spaces equals YAML `>-` folding.
 */
export function parseSkillMeta(skillMd) {
  const die = (msg) => {
    throw new Error(msg);
  };
  const fm = skillMd.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) die("missing or malformed --- block");
  const lines = fm[1].split("\n");
  const nm = /^name: (\S+)$/.exec(lines[0] || "");
  if (!nm) die("line 1 must be `name: <name>`");
  if (lines[1] !== "description: >-") die("line 2 must be `description: >-` (folded block)");
  const body = lines.slice(2);
  if (body.length === 0) die("description block is empty");
  for (const l of body) {
    if (!/^  [^ \t]/.test(l) || /\t/.test(l)) {
      die(`description block lines must be indented by exactly two spaces, non-blank, no tabs: ${JSON.stringify(l)}`);
    }
  }
  const name = nm[1];
  const description = body.map((l) => l.trim()).join(" ");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64 || /anthropic|claude/.test(name)) {
    die(`invalid name ${JSON.stringify(name)} (a-z0-9 and single hyphens, <= 64 chars, no reserved words)`);
  }
  if (description.length < 1 || description.length > 1024) die(`description is ${description.length} chars (1-1024)`);
  if (/[<>]/.test(description)) die("description must not contain '<' or '>'");
  return { name, description };
}

// Frontmatter is stripped: the flat file is pasted into arbitrary assistants and a stray
// YAML block reads as content. The body is written to stand alone without it.
export const stripFm = (s) => s.replace(/^---\n[\s\S]*?\n---\n+/, "");

/** The single-file skill: `header`, then SKILL.md and the references (sorted), separated by rules. */
export function flatten(files, header) {
  const order = ["SKILL.md", ...Object.keys(files).filter((f) => f.startsWith("references/")).sort()];
  let flat = header;
  for (const f of order) {
    flat += stripFm(files[f]).trim() + "\n\n---\n\n";
  }
  return flat.replace(/\n---\n\n$/, "\n");
}

/** Stored/deflated ZIP of a { path: text } map (no external deps), entries in insertion order. */
export function zip(map) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
  const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };
  // Fixed DOS timestamp — a build-time clock would make the artifact non-reproducible.
  const DOS_TIME = u16(0);
  const DOS_DATE = u16(((2026 - 1980) << 9) | (1 << 5) | 1);

  for (const [name, content] of Object.entries(map)) {
    const raw = Buffer.from(enc.encode(content));
    const comp = deflateRawSync(raw, { level: 9 });
    const useDeflate = comp.length < raw.length;
    const body = useDeflate ? comp : raw;
    const nameBuf = Buffer.from(enc.encode(name));
    const crc = crc32(raw);
    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(useDeflate ? 8 : 0),
      DOS_TIME, DOS_DATE, u32(crc), u32(body.length), u32(raw.length),
      u16(nameBuf.length), u16(0), nameBuf,
    ]);
    chunks.push(local, body);
    central.push(Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(useDeflate ? 8 : 0),
      DOS_TIME, DOS_DATE, u32(crc), u32(body.length), u32(raw.length),
      u16(nameBuf.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBuf,
    ]));
    offset += local.length + body.length;
  }
  const cd = Buffer.concat(central);
  return Buffer.concat([
    ...chunks, cd,
    Buffer.concat([
      u32(0x06054b50), u16(0), u16(0),
      u16(central.length), u16(central.length),
      u32(cd.length), u32(offset), u16(0),
    ]),
  ]);
}

/** The ES module the worker imports: SKILL_FLAT, SKILL_ZIP_B64, SKILL_META after a comment header. */
export function skillModule(headerLines, flat, zipBuf, meta) {
  return (
    headerLines.map((l) => `// ${l}\n`).join("") +
    `export const SKILL_FLAT = ${JSON.stringify(flat)};\n` +
    `export const SKILL_ZIP_B64 = ${JSON.stringify(zipBuf.toString("base64"))};\n` +
    `export const SKILL_META = ${JSON.stringify(meta)};\n`
  );
}
