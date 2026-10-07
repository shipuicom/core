/**
 * ship-code performance benchmarks.
 *
 *   bun run bench:code              # run + compare against baseline.json
 *   bun run bench:code -- --save    # run + save as the new baseline
 *   bun run bench:code -- --seed 7  # reproduce a run order
 *   bun run bench:code -- --filter typing
 *
 * The script bundles this file with esbuild and runs it on Node with `--expose-gc`, the runtime the baseline was
 * taken on (Bun's array copies differ by ~3x, so the two must not be compared).
 *
 * Method, so a regression is not lost in noise:
 * - every case gets a time-based warmup, so the JIT has compiled it before it is timed;
 * - cases run in a shuffled order (seeded, printed), so no size always runs cold first;
 * - each case is timed in several samples, each long enough to dwarf timer resolution, and reports the median and
 *   p95 per operation; a regression is a median more than 20% above the baseline median;
 * - `gc()` runs between cases when exposed, so one case's garbage is not collected on the next one's clock;
 * - sequential cases (a chain of edits on one document) restart from the same document every sample;
 * - cases compare only at equal document size.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createDocument, getText, insertText, deleteRange, applyTransaction, type CodeDocument } from '../core/document';
import { caret } from '../core/selection';
import { moveCaretRight, moveCaretDown, moveWordRight } from '../core/caret-motion';
import { applyFlatChangesBatched } from '../core/flat-edit';
import { indexFor, LineIndex, type FlatChange } from '../core/line-index';
import { flatCaret, flatMoveDown, flatMoveRight, type FlatSelection } from '../core/flat-motion';
import { mapSelectionThroughChanges } from '../core/flat-multi';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const argOf = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const SAVE = args.includes('--save');
const SEED = Number(argOf('--seed') ?? Math.floor(Math.random() * 1e6));
const FILTER = argOf('--filter');
const WARMUP_MS = 150;
const SAMPLES = 15;
const SAMPLE_MS = 20;
const REGRESSION = 1.2;

const DIR = resolve(process.cwd(), 'projects/ship-ui/ship-code/benchmarks');
const BASELINE_JSON = resolve(DIR, 'baseline.json');
const RESULTS_JSON = resolve(DIR, 'latest.json');
const RESULTS_CSV = resolve(DIR, 'latest.csv');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Case {
  name: string;
  category: string;
  docLines: number;
  /** Ops performed per call of `run` (a sequential case chains several). */
  opsPerRun?: number;
  /** Builds fresh state and returns the timed function; called once per sample. It returns its result so the JIT
   * cannot drop the work as dead code. */
  setup: () => () => unknown;
}

interface BenchmarkResult {
  name: string;
  category: string;
  docLines: number;
  samples: number;
  opsPerSample: number;
  medianMs: number;
  p95Ms: number;
  opsPerSec: number;
}

interface BenchmarkReport {
  timestamp: string;
  runtime: string;
  seed: number;
  results: BenchmarkResult[];
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

/** mulberry32: a small seeded PRNG for a reproducible shuffle. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const rand = prng(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const gc = (globalThis as { gc?: () => void }).gc;
/** Every timed result lands here, so no case is optimized away; it is printed once at the end. */
let sink: unknown;
const quantile = (sorted: number[], q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]!;
const round = (ms: number) => Math.round(ms * 1e6) / 1e6;

function measure(c: Case): BenchmarkResult {
  const opsPerRun = c.opsPerRun ?? 1;
  gc?.();

  // Warmup, and calibrate how many runs fill one sample.
  let fn = c.setup();
  let runs = 0;
  const warmStart = performance.now();
  while (performance.now() - warmStart < WARMUP_MS) {
    sink = fn();
    if (++runs % 64 === 0) fn = c.setup();
  }
  const perRunMs = (performance.now() - warmStart) / runs;
  const runsPerSample = Math.max(1, Math.ceil(SAMPLE_MS / perRunMs));

  const perOp: number[] = [];
  for (let s = 0; s < SAMPLES; s++) {
    fn = c.setup();
    const start = performance.now();
    for (let i = 0; i < runsPerSample; i++) sink = fn();
    perOp.push((performance.now() - start) / (runsPerSample * opsPerRun));
  }
  perOp.sort((a, b) => a - b);
  const median = quantile(perOp, 0.5);
  return {
    name: c.name,
    category: c.category,
    docLines: c.docLines,
    samples: SAMPLES,
    opsPerSample: runsPerSample * opsPerRun,
    medianMs: round(median),
    p95Ms: round(quantile(perOp, 0.95)),
    opsPerSec: Math.round(1000 / median),
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function generateCodeDoc(lines: number): string {
  const result: string[] = [];
  for (let i = 0; i < lines; i++) {
    switch (i % 5) {
      case 0: result.push(`  const value${i} = computeSomething(${i});`); break;
      case 1: result.push(`  if (value${i} > threshold) {`); break;
      case 2: result.push(`    results.push(value${i});`); break;
      case 3: result.push(`  }`); break;
      case 4: result.push(''); break;
    }
  }
  return result.join('\n');
}

const SIZES = [1_000, 10_000, 50_000];
const texts = new Map(SIZES.map((n) => [n, generateCodeDoc(n)] as const));
const docs = new Map(SIZES.map((n) => [n, createDocument(texts.get(n)!)] as const));

/**
 * One keystroke as `ShipCode` handles it (`#applyChanges` + the caret read the next render does): batched apply,
 * selection mapping, the history entry, and the line index of the new document. The value serialization is no
 * longer on this path (see `valueSync`), so it is measured separately as `idle value flush`.
 */
function keystroke(state: { doc: CodeDocument; sel: FlatSelection; history: unknown[] }, insert: string) {
  const head = state.sel.ranges[state.sel.primary]!.head;
  const changes: FlatChange[] = [{ from: head, to: head, insert }];
  const { doc, inverse } = applyFlatChangesBatched(state.doc, changes);
  const selAfter = mapSelectionThroughChanges(state.sel, changes);
  state.history.push({ inverse, redo: [...changes], selBefore: state.sel, selAfter });
  state.doc = doc;
  state.sel = selAfter;
  indexFor(doc).pointAt(selAfter.ranges[selAfter.primary]!.head);
}

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

function cases(): Case[] {
  const out: Case[] = [];
  const per = (fn: (n: number, doc: CodeDocument, mid: number) => Omit<Case, 'docLines'>) =>
    SIZES.forEach((n) => out.push({ docLines: n, ...fn(n, docs.get(n)!, n >> 1) }));

  // Typing: model + caret + history together, the per-keystroke total.
  per((n, doc, mid) => ({
    name: `typing keystroke (${n} lines)`,
    category: 'typing.keystroke',
    opsPerRun: 50,
    setup: () => {
      const state = { doc, sel: flatCaret(indexFor(doc).posOf(caret(mid, 5))), history: [] as unknown[] };
      return () => {
        for (let i = 0; i < 50; i++) keystroke(state, 'x');
        return state.sel;
      };
    },
  }));
  per((n, doc) => ({
    name: `idle value flush (${n} lines)`,
    category: 'typing.flush',
    // A new document every run: getText caches per document, and the flush serializes an edited one.
    setup: () => {
      let d = doc;
      return () => {
        d = insertText(d, caret(0, 0), 'x');
        return getText(d);
      };
    },
  }));

  // The flat path the component uses.
  per((n, doc, mid) => ({
    name: `flat insert char (${n} lines)`,
    category: 'flat.insertChar',
    setup: () => {
      const at = indexFor(doc).posOf(caret(mid, 5));
      return () => applyFlatChangesBatched(doc, [{ from: at, to: at, insert: 'x' }]);
    },
  }));
  per((n, doc) => ({
    name: `line index build (${n} lines)`,
    category: 'flat.indexBuild',
    setup: () => () => new LineIndex(doc),
  }));
  per((n, doc, mid) => ({
    name: `flat caret right 100x (${n} lines)`,
    category: 'flat.moveRight',
    opsPerRun: 100,
    setup: () => {
      const start = indexFor(doc).posOf(caret(mid, 0));
      return () => {
        let pos = start;
        for (let i = 0; i < 100; i++) pos = flatMoveRight(doc, pos).head;
        return pos;
      };
    },
  }));
  per((n, doc, mid) => ({
    name: `flat caret down 100x (${n} lines)`,
    category: 'flat.moveDown',
    opsPerRun: 100,
    setup: () => {
      const start = indexFor(doc).posOf(caret(mid - 200, 3));
      return () => {
        let pos = start;
        let goal: number | undefined;
        for (let i = 0; i < 100; i++) {
          const r = flatMoveDown(doc, pos, goal);
          pos = r.head;
          goal = r.goalColumn;
        }
        return pos;
      };
    },
  }));

  // Line/column model API.
  per((n) => ({
    name: `createDocument (${n} lines)`,
    category: 'document.create',
    setup: () => () => createDocument(texts.get(n)!),
  }));
  per((n, doc, mid) => ({
    name: `insertText char (${n} lines)`,
    category: 'document.insertChar',
    setup: () => () => insertText(doc, caret(mid, 5), 'x'),
  }));
  per((n, doc, mid) => ({
    name: `sequential insert char (${n} lines)`,
    category: 'document.seqInsert',
    opsPerRun: 100,
    setup: () => () => {
      let d = doc;
      for (let i = 0; i < 100; i++) d = insertText(d, caret(mid, i % 30), 'a');
      return d;
    },
  }));
  per((n, doc, mid) => ({
    name: `insertText newline (${n} lines)`,
    category: 'document.insertNewline',
    setup: () => () => insertText(doc, caret(mid, 5), '\n'),
  }));
  per((n, doc, mid) => ({
    name: `deleteRange single line (${n} lines)`,
    category: 'document.deleteSingle',
    setup: () => () => deleteRange(doc, caret(mid, 2), caret(mid, 10)),
  }));
  per((n, doc, mid) => ({
    name: `deleteRange multi-line (${n} lines)`,
    category: 'document.deleteMulti',
    setup: () => () => deleteRange(doc, caret(mid, 0), caret(mid + 10, 0)),
  }));
  per((n, doc) => ({
    name: `getText uncached (${n} lines)`,
    category: 'document.getText',
    // getText caches per document; a fresh document object with the same lines measures the join itself.
    setup: () => () => getText({ lines: doc.lines }),
  }));
  per((n, doc) => {
    const changes = Array.from({ length: 10 }, (_, i) => ({
      from: caret(Math.floor(n / 4) + i * 50, 2),
      to: caret(Math.floor(n / 4) + i * 50, 2),
      insert: `/* change ${i} */`,
    }));
    return {
      name: `applyTransaction 10 changes (${n} lines)`,
      category: 'document.transaction',
      setup: () => () => applyTransaction(doc, { changes }),
    };
  });
  per((n, doc, mid) => ({
    name: `moveCaretRight 100x (${n} lines)`,
    category: 'caret.moveRight',
    opsPerRun: 100,
    setup: () => () => {
      let pos = caret(mid, 0);
      for (let i = 0; i < 100; i++) pos = moveCaretRight(doc, pos);
      return pos;
    },
  }));
  per((n, doc) => ({
    name: `moveCaretDown 100x (${n} lines)`,
    category: 'caret.moveDown',
    opsPerRun: 100,
    setup: () => () => {
      let pos = caret(0, 5);
      for (let i = 0; i < 100; i++) pos = moveCaretDown(doc, pos);
      return pos;
    },
  }));
  per((n, doc, mid) => ({
    name: `moveWordRight 100x (${n} lines)`,
    category: 'caret.moveWordRight',
    opsPerRun: 100,
    setup: () => () => {
      let pos = caret(mid, 0);
      for (let i = 0; i < 100; i++) pos = moveWordRight(doc, pos);
      return pos;
    },
  }));

  return FILTER ? out.filter((c) => c.name.includes(FILTER) || c.category.includes(FILTER)) : out;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function toCSV(results: BenchmarkResult[]): string {
  const header = 'name,category,docLines,samples,opsPerSample,medianMs,p95Ms,opsPerSec';
  const rows = results.map(
    (r) => `"${r.name}","${r.category}",${r.docLines},${r.samples},${r.opsPerSample},${r.medianMs},${r.p95Ms},${r.opsPerSec}`,
  );
  return [header, ...rows].join('\n');
}

const fmt = (ms: number) => (ms >= 1 ? `${ms.toFixed(2)} ms` : ms >= 0.001 ? `${(ms * 1000).toFixed(2)} µs` : `${(ms * 1e6).toFixed(0)} ns`);

function printTable(results: BenchmarkResult[], baseline?: BenchmarkReport): number {
  const prev = new Map((baseline?.results ?? []).map((r) => [r.name, r]));
  console.log('\n' + '═'.repeat(104));
  console.log(`  ship-code benchmarks · seed ${SEED} · ${SAMPLES} samples · median / p95 per op`);
  console.log('═'.repeat(104));
  console.log('Name'.padEnd(46), 'Median'.padStart(12), 'p95'.padStart(12), 'Ops/sec'.padStart(12), 'vs baseline'.padStart(18));
  console.log('─'.repeat(104));
  let regressions = 0;
  const ordered = [...results].sort((a, b) => a.category.localeCompare(b.category) || a.docLines - b.docLines);
  for (const r of ordered) {
    const base = prev.get(r.name);
    let delta = '';
    if (base?.medianMs) {
      const ratio = r.medianMs / base.medianMs;
      if (ratio > REGRESSION) {
        delta = `⚠️  ${ratio.toFixed(2)}x slower`;
        regressions++;
      } else if (ratio < 1 / REGRESSION) delta = `✅ ${(1 / ratio).toFixed(2)}x faster`;
      else delta = '~same';
    }
    console.log(r.name.padEnd(46), fmt(r.medianMs).padStart(12), fmt(r.p95Ms).padStart(12), String(r.opsPerSec).padStart(12), delta.padStart(18));
  }
  console.log('─'.repeat(104));
  return regressions;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

if (!gc) console.log('Note: run with --expose-gc for gc() between cases (bun run bench:code does).');
console.log(`Running benchmarks (seed ${SEED})…`);
const results = shuffle(cases(), SEED).map(measure);
const report: BenchmarkReport = { timestamp: new Date().toISOString(), runtime: `Node ${process.version}`, seed: SEED, results };

writeFileSync(RESULTS_JSON, JSON.stringify(report, null, 2));
writeFileSync(RESULTS_CSV, toCSV(results));

const baseline: BenchmarkReport | undefined = existsSync(BASELINE_JSON) ? JSON.parse(readFileSync(BASELINE_JSON, 'utf-8')) : undefined;
const regressions = printTable(results, baseline);
if (sink === Symbol.for('never')) console.log(sink);

if (SAVE) {
  writeFileSync(BASELINE_JSON, JSON.stringify(report, null, 2));
  console.log(`Saved as new baseline: ${BASELINE_JSON}`);
} else if (!baseline) {
  console.log('No baseline found. Run with --save to create one.');
} else if (regressions) {
  console.log(`⚠️  ${regressions} regression(s): median more than ${Math.round((REGRESSION - 1) * 100)}% above baseline`);
  process.exitCode = 1;
} else {
  console.log('✅ No regressions');
}
