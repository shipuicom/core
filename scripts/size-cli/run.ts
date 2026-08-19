/**
 * Per-component size report built with the real Angular CLI pipeline.
 *
 * For each entry point it writes a one-line import into the harness app
 * (scripts/size-cli/app/main.ts), runs `ng build size-harness` in production
 * mode (AOT, esbuild, tree-shaking — the same pipeline a consumer app uses),
 * and reports the bundle growth over an empty baseline app. That delta is the
 * true cost of shipping the component, including any shared dependencies it
 * pulls in beyond the Angular core baseline.
 *
 * Usage:
 *   bun run size:cli                 # all components (slow: one ng build each)
 *   bun run size:cli ship-tree ...   # only the listed components
 *   bun run size:cli a+b             # one build importing both a and b — the
 *                                    # size of a small app using them together
 *   bun run size:cli --list          # list measurable entry points
 */
import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..', '..');
const MAIN = join(import.meta.dir, 'app', 'main.ts');
const OUT = join(ROOT, 'dist', 'size-harness', 'browser');
const MARKER = '// __SIZE_IMPORT__';

const kb = (bytes: number) => (bytes / 1024).toFixed(1).padStart(8) + ' kB';

async function discoverEntries(): Promise<string[]> {
  const dirs = await readdir(join(ROOT, 'projects', 'ship-ui'), { withFileTypes: true });
  const entries: string[] = [];
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    try {
      await readFile(join(ROOT, 'projects', 'ship-ui', d.name, 'public-api.ts'));
      entries.push(d.name);
    } catch {
      // not an entry point
    }
  }
  return entries.sort();
}

async function build(importLine: string): Promise<{ total: number; gzip: number }> {
  const baseline = await readFile(MAIN, 'utf8');
  await writeFile(MAIN, baseline.replace(MARKER, importLine));
  try {
    await rm(OUT, { recursive: true, force: true });
    const proc = Bun.spawn(
      ['node', 'node_modules/@angular/cli/bin/ng.js', 'build', 'size-harness'],
      { cwd: ROOT, stdout: 'pipe', stderr: 'pipe' }
    );
    const code = await proc.exited;
    if (code !== 0) {
      throw new Error(await new Response(proc.stderr).text());
    }

    let total = 0;
    let gzip = 0;
    for (const file of await readdir(OUT)) {
      if (!file.endsWith('.js') && !file.endsWith('.css')) continue;
      const content = await readFile(join(OUT, file));
      total += content.length;
      gzip += gzipSync(content).length;
    }
    return { total, gzip };
  } finally {
    await writeFile(MAIN, baseline);
  }
}

const args = process.argv.slice(2);
const all = await discoverEntries();

if (args.includes('--list')) {
  console.log(all.join('\n'));
  process.exit(0);
}

const targets = args.length ? args : all;
const unknown = targets.flatMap((t) => t.split('+')).filter((t) => !all.includes(t));
if (unknown.length) {
  console.error(`Unknown entry point(s): ${unknown.join(', ')} — try \`bun run size:cli --list\`.`);
  process.exit(1);
}

console.log(`Building baseline app...`);
const baseline = await build('');
console.log(`baseline (empty zoneless app): ${kb(baseline.total).trim()} raw, ${kb(baseline.gzip).trim()} gzip\n`);

type Row = { name: string; total: number; gzip: number };
const rows: Row[] = [];

for (const [i, name] of targets.entries()) {
  process.stdout.write(`[${i + 1}/${targets.length}] ng build with ${name}... `);
  try {
    // Namespace import + reference keeps every export of the entry alive, so
    // the number reflects the whole component the way `size` does. A `+` in
    // the target imports several entries into the same build, so shared code
    // is counted once — the size of a small app using them together.
    const parts = name.split('+');
    const { total, gzip } = await build(
      parts
        .map((p, idx) => `import * as __mod${idx} from '@ship-ui/core/${p}';`)
        .concat(parts.map((_, idx) => `(globalThis as any).__keep${idx} = __mod${idx};`))
        .join('\n')
    );
    rows.push({ name, total: total - baseline.total, gzip: gzip - baseline.gzip });
    console.log(`+${((gzip - baseline.gzip) / 1024).toFixed(1)} kB gzip`);
  } catch (e) {
    console.log('FAILED');
    console.error(String(e).split('\n').slice(0, 8).join('\n'));
  }
}

rows.sort((a, b) => b.gzip - a.gzip);

const nameWidth = Math.max(...rows.map((r) => r.name.length), 'component'.length);
const line = (name: string, raw: string, gz: string) => console.log(`${name.padEnd(nameWidth)}  ${raw}  ${gz}`);

console.log();
line('component', '  raw delta'.padStart(11), 'gzip delta'.padStart(11));
line('-'.repeat(nameWidth), '-'.repeat(11), '-'.repeat(11));
for (const r of rows) line(r.name, kb(r.total), kb(r.gzip));
