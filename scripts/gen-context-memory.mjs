#!/usr/bin/env node
// Splits the canonical .context.md into per-section fragments + an INDEX so the
// raag-* agents can load only the slice they need instead of re-reading the whole
// 1,200-line log. Fragments are GENERATED — never hand-edited. .context.md is the
// single source of truth.
//
// Usage:  node scripts/gen-context-memory.mjs
// Output: .claude/context/  (git-ignored — see .gitignore)
//
// Robustness notes:
//  - Dependency-free (Node built-ins only).
//  - Splits on existing level-2 (`## `) headings — no assumptions about ordering,
//    phase numbering, or which sections exist. New/removed sections just work.
//  - Rebuilds the output dir every run, so a deleted section can't leave a stale
//    fragment behind. Idempotent: same input → byte-identical output.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, '.context.md');
const OUT = join(ROOT, '.claude', 'context');
const BANNER =
  '<!-- GENERATED from .context.md — do not edit by hand. Regenerate: node scripts/gen-context-memory.mjs -->';

function fail(msg) {
  console.error(`gen-context-memory: ${msg}`);
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(SRC, 'utf8');
} catch {
  fail(`cannot read ${SRC} — is .context.md present? (it is git-ignored / local-only)`);
}

const lines = raw.split('\n');

// --- split into level-2 sections (everything before the first `## ` is preamble) ---
const sections = [];
let cur = null;
for (const line of lines) {
  const m = /^## (.+?)\s*$/.exec(line);
  if (m) {
    if (cur) sections.push(cur);
    cur = { heading: m[1].trim(), body: [line] };
  } else if (cur) {
    cur.body.push(line);
  }
}
if (cur) sections.push(cur);

if (sections.length === 0) fail('no `## ` sections found — has the .context.md format changed?');

// --- slug + dedupe ---
const used = new Map();
function slugFor(heading) {
  const pm = /^Phase\s+(\d+)\b/i.exec(heading);
  let base = pm
    ? `phase-${pm[1].padStart(2, '0')}`
    : heading
        .toLowerCase()
        .replace(/[`'"()]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'section';
  const n = (used.get(base) || 0) + 1;
  used.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}

function firstLine(body) {
  for (let i = 1; i < body.length; i++) {
    const t = body[i].trim();
    if (t && !t.startsWith('#')) return t.replace(/[*_`]/g, '').slice(0, 90);
  }
  return '';
}

// --- rebuild output dir from scratch ---
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const entries = [];
let phaseHi = -1;
let phaseHiBody = null;
for (const s of sections) {
  const slug = slugFor(s.heading);
  const file = `${slug}.md`;
  const content = `${BANNER}\n\n${s.body.join('\n').replace(/\s+$/, '')}\n`;
  writeFileSync(join(OUT, file), content);
  entries.push({ heading: s.heading, file, desc: firstLine(s.body) });

  const pm = /^Phase\s+(\d+)\b/i.exec(s.heading);
  if (pm && Number(pm[1]) > phaseHi) {
    phaseHi = Number(pm[1]);
    phaseHiBody = s.body;
  }
}

// --- INDEX.md: cheap "what exists & where" map agents load first ---
const indexBody = [
  BANNER,
  '',
  '# Context Index',
  '',
  'Load this first, then read only the fragment(s) you need.',
  '`.context.md` (in the repo root) is the canonical source; these are generated slices.',
  '',
  '| Section | Fragment | Summary |',
  '| --- | --- | --- |',
  ...entries.map(
    (e) => `| ${e.heading.replace(/\|/g, '\\|')} | \`${e.file}\` | ${e.desc.replace(/\|/g, '\\|')} |`
  ),
  '',
].join('\n');
writeFileSync(join(OUT, 'INDEX.md'), indexBody);

// --- TEMPLATE.md: skeleton derived from the latest phase, so raag-docs never has
//     to read the whole .context.md just to copy the format ---
let templateInner;
if (phaseHiBody) {
  const subs = phaseHiBody.filter((l) => /^### /.test(l));
  templateInner = [
    '## Phase N — <Title>',
    '',
    ...subs.flatMap((h) => [h, '']),
  ].join('\n');
} else {
  templateInner = '## Phase N — <Title>\n\n### Problem\n\n### Solution\n\n### Modified files\n\n### Gotchas\n';
}
writeFileSync(
  join(OUT, 'TEMPLATE.md'),
  `${BANNER}\n\n<!-- Canonical Phase-section skeleton (derived from the latest phase). raag-docs writes a new Phase entry into .context.md following this shape, then reruns this generator. -->\n\n${templateInner}\n`
);

const indexBytes = Buffer.byteLength(indexBody);
console.log(
  `gen-context-memory: wrote ${entries.length} fragments + INDEX.md (${indexBytes} bytes) + TEMPLATE.md to .claude/context/`
);
if (indexBytes > 8192) console.warn('  warning: INDEX.md exceeds 8KB — consider trimming summaries');
