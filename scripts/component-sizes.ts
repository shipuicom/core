/**
 * Reports the shipped size of every @ship-ui/core component entry point.
 *
 * The published package intentionally contains readable, unminified FESM
 * bundles (Angular Package Format) — consumers minify. This script answers
 * "what does each component actually cost a consumer" by minifying each
 * per-component bundle in isolation (imports kept external, so shared
 * Angular/rxjs code is not counted) and gzipping the result.
 *
 * Usage: bun run size   (requires a prior `bun run build`)
 */
import { readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, basename } from 'node:path';

const FESM_DIR = join(import.meta.dir, '..', 'dist', 'ship-ui', 'fesm2022');

const kb = (bytes: number) => (bytes / 1024).toFixed(1).padStart(8) + ' kB';

let files: string[];
try {
  files = (await readdir(FESM_DIR)).filter((f) => f.endsWith('.mjs'));
} catch {
  console.error(`No build found at ${FESM_DIR} — run \`bun run build\` first.`);
  process.exit(1);
}

type Row = { name: string; raw: number; min: number; gzip: number };
const rows: Row[] = [];

for (const file of files.sort()) {
  const path = join(FESM_DIR, file);
  const raw = Bun.file(path).size;

  const result = await Bun.build({
    entrypoints: [path],
    minify: true,
    target: 'browser',
    // Only measure this component's own code, not its imports.
    external: ['*'],
  });

  if (!result.success) {
    console.error(`Failed to minify ${file}:`, result.logs.join('\n'));
    continue;
  }

  const minified = await result.outputs[0].arrayBuffer();
  rows.push({
    name: basename(file, '.mjs').replace(/^ship-ui-core-/, ''),
    raw,
    min: minified.byteLength,
    gzip: gzipSync(Buffer.from(minified)).length,
  });
}

rows.sort((a, b) => b.gzip - a.gzip);

const nameWidth = Math.max(...rows.map((r) => r.name.length), 'component'.length);
const line = (name: string, raw: string, min: string, gz: string) =>
  console.log(`${name.padEnd(nameWidth)}  ${raw}  ${min}  ${gz}`);

line('component', '     raw'.padStart(11), 'minified'.padStart(11), 'min+gzip'.padStart(11));
line('-'.repeat(nameWidth), '-'.repeat(11), '-'.repeat(11), '-'.repeat(11));
for (const r of rows) line(r.name, kb(r.raw), kb(r.min), kb(r.gzip));

const total = rows.reduce((acc, r) => ({ raw: acc.raw + r.raw, min: acc.min + r.min, gzip: acc.gzip + r.gzip }), {
  raw: 0,
  min: 0,
  gzip: 0,
});
line('-'.repeat(nameWidth), '-'.repeat(11), '-'.repeat(11), '-'.repeat(11));
line('total', kb(total.raw), kb(total.min), kb(total.gzip));
