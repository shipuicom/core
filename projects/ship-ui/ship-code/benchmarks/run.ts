/**
 * ship-code performance benchmark runner.
 *
 * Outputs results as JSON and CSV. Compares against a saved baseline
 * and flags regressions (>20% slower).
 *
 * Usage:
 *   npx tsx projects/ship-ui/ship-code/benchmarks/run.ts              # run + compare
 *   npx tsx projects/ship-ui/ship-code/benchmarks/run.ts --save       # run + save as new baseline
 *   npx tsx projects/ship-ui/ship-code/benchmarks/run.ts --compare    # run + compare (default)
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Import the modules under test (relative paths from this file)
// ---------------------------------------------------------------------------

import {
  createDocument,
  getLine,
  lineCount,
  getText,
  insertText,
  deleteRange,
  applyTransaction,
} from '../core/document';
import { caret } from '../core/selection';
import {
  moveCaretRight,
  moveCaretDown,
  moveWordRight,
} from '../core/caret-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BenchmarkResult {
  name: string;
  category: string;
  docLines: number;
  iterations: number;
  totalMs: number;
  avgMs: number;
  opsPerSec: number;
}

interface BenchmarkReport {
  timestamp: string;
  runtime: string;
  results: BenchmarkResult[];
}

// ---------------------------------------------------------------------------
// Helpers
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

function bench(
  name: string,
  category: string,
  docLines: number,
  iterations: number,
  fn: () => void,
): BenchmarkResult {
  // Warmup
  for (let i = 0; i < Math.min(iterations, 5); i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const totalMs = performance.now() - start;

  return {
    name,
    category,
    docLines,
    iterations,
    totalMs: Math.round(totalMs * 1000) / 1000,
    avgMs: Math.round((totalMs / iterations) * 10000) / 10000,
    opsPerSec: Math.round(iterations / (totalMs / 1000)),
  };
}

function benchSeq(
  name: string,
  category: string,
  docLines: number,
  fn: () => void,
): BenchmarkResult {
  // For sequential tests that run their own loop
  const start = performance.now();
  fn();
  const totalMs = performance.now() - start;

  return {
    name,
    category,
    docLines,
    iterations: 1,
    totalMs: Math.round(totalMs * 1000) / 1000,
    avgMs: Math.round(totalMs * 10000) / 10000,
    opsPerSec: Math.round(1 / (totalMs / 1000)),
  };
}

// ---------------------------------------------------------------------------
// Benchmark definitions
// ---------------------------------------------------------------------------

function runAll(): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];
  const sizes = [100, 1_000, 10_000, 50_000];

  // Pre-generate docs
  const docs = new Map<number, ReturnType<typeof createDocument>>();
  const texts = new Map<number, string>();
  for (const size of sizes) {
    const text = generateCodeDoc(size);
    texts.set(size, text);
    docs.set(size, createDocument(text));
  }

  // --- Document creation ---
  for (const size of sizes) {
    const text = texts.get(size)!;
    const iters = size <= 1000 ? 500 : size <= 10000 ? 50 : 10;
    results.push(bench(
      `createDocument (${size} lines)`,
      'document.create',
      size,
      iters,
      () => createDocument(text),
    ));
  }

  // --- Single char insert ---
  for (const size of sizes) {
    const doc = docs.get(size)!;
    const midLine = Math.floor(size / 2);
    const iters = size <= 1000 ? 5000 : size <= 10000 ? 500 : 50;
    results.push(bench(
      `insertText char (${size} lines)`,
      'document.insertChar',
      size,
      iters,
      () => insertText(doc, caret(midLine, 5), 'x'),
    ));
  }

  // --- Newline insert ---
  for (const size of [1_000, 10_000, 50_000]) {
    const doc = docs.get(size)!;
    const midLine = Math.floor(size / 2);
    const iters = size <= 1000 ? 2000 : size <= 10000 ? 200 : 20;
    results.push(bench(
      `insertText newline (${size} lines)`,
      'document.insertNewline',
      size,
      iters,
      () => insertText(doc, caret(midLine, 5), '\n'),
    ));
  }

  // --- Delete single line ---
  for (const size of [1_000, 10_000, 50_000]) {
    const doc = docs.get(size)!;
    const midLine = Math.floor(size / 2);
    const iters = size <= 1000 ? 2000 : size <= 10000 ? 200 : 20;
    results.push(bench(
      `deleteRange single line (${size} lines)`,
      'document.deleteSingle',
      size,
      iters,
      () => deleteRange(doc, caret(midLine, 2), caret(midLine, 10)),
    ));
  }

  // --- Delete multi-line ---
  for (const size of [1_000, 10_000, 50_000]) {
    const doc = docs.get(size)!;
    const midLine = Math.floor(size / 2);
    const iters = size <= 1000 ? 2000 : size <= 10000 ? 200 : 20;
    results.push(bench(
      `deleteRange multi-line (${size} lines)`,
      'document.deleteMulti',
      size,
      iters,
      () => deleteRange(doc, caret(midLine, 0), caret(midLine + 10, 0)),
    ));
  }

  // --- getText reconstruction ---
  for (const size of [1_000, 10_000, 50_000]) {
    const doc = docs.get(size)!;
    const iters = size <= 1000 ? 500 : size <= 10000 ? 50 : 10;
    results.push(bench(
      `getText (${size} lines)`,
      'document.getText',
      size,
      iters,
      () => getText(doc),
    ));
  }

  // --- Sequential typing (100 chars) ---
  for (const size of [1_000, 10_000]) {
    results.push(benchSeq(
      `100 sequential inserts (${size} lines)`,
      'document.seqInsert100',
      size,
      () => {
        let doc = docs.get(size)!;
        const midLine = Math.floor(size / 2);
        for (let i = 0; i < 100; i++) {
          doc = insertText(doc, caret(midLine, i), String.fromCharCode(97 + (i % 26)));
        }
      },
    ));
  }

  // --- Caret motion ---
  for (const size of [1_000, 10_000]) {
    const doc = docs.get(size)!;
    results.push(benchSeq(
      `moveCaretRight 1000x (${size} lines)`,
      'caret.moveRight',
      size,
      () => {
        let pos = caret(Math.floor(size / 2), 0);
        for (let i = 0; i < 1000; i++) pos = moveCaretRight(doc, pos);
      },
    ));
  }

  for (const size of [1_000, 10_000]) {
    const doc = docs.get(size)!;
    results.push(benchSeq(
      `moveCaretDown 1000x (${size} lines)`,
      'caret.moveDown',
      size,
      () => {
        let pos = caret(0, 5);
        for (let i = 0; i < 1000; i++) pos = moveCaretDown(doc, pos);
      },
    ));
  }

  for (const size of [1_000, 10_000]) {
    const doc = docs.get(size)!;
    results.push(benchSeq(
      `moveWordRight 500x (${size} lines)`,
      'caret.moveWordRight',
      size,
      () => {
        let pos = caret(Math.floor(size / 2), 0);
        for (let i = 0; i < 500; i++) pos = moveWordRight(doc, pos);
      },
    ));
  }

  // --- Transaction (10 changes) ---
  for (const size of [1_000, 10_000]) {
    const doc = docs.get(size)!;
    const changes = Array.from({ length: 10 }, (_, i) => ({
      from: caret(Math.floor(size / 4) + i * 50, 2),
      to: caret(Math.floor(size / 4) + i * 50, 2),
      insert: `/* change ${i} */`,
    }));
    const iters = size <= 1000 ? 200 : 20;
    results.push(bench(
      `applyTransaction 10 changes (${size} lines)`,
      'document.transaction',
      size,
      iters,
      () => applyTransaction(doc, { changes }),
    ));
  }

  // --- Structural sharing count ---
  for (const size of [1_000, 10_000]) {
    const doc = docs.get(size)!;
    const result = insertText(doc, caret(Math.floor(size / 2), 5), 'x');
    let shared = 0;
    for (let i = 0; i < lineCount(result); i++) {
      if (i < lineCount(doc) && result.lines[i] === doc.lines[i]) shared++;
    }
    results.push({
      name: `structural sharing after insert (${size} lines)`,
      category: 'sharing',
      docLines: size,
      iterations: 1,
      totalMs: 0,
      avgMs: 0,
      opsPerSec: shared, // Reuse field: number of shared lines
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Output formatters
// ---------------------------------------------------------------------------

function toCSV(results: BenchmarkResult[]): string {
  const header = 'name,category,docLines,iterations,totalMs,avgMs,opsPerSec';
  const rows = results.map(r =>
    `"${r.name}","${r.category}",${r.docLines},${r.iterations},${r.totalMs},${r.avgMs},${r.opsPerSec}`
  );
  return [header, ...rows].join('\n');
}

function printTable(results: BenchmarkResult[], baseline?: BenchmarkReport): void {
  const baselineMap = new Map<string, BenchmarkResult>();
  if (baseline) {
    for (const r of baseline.results) baselineMap.set(r.name, r);
  }

  const REGRESSION_THRESHOLD = 1.2; // 20% slower = regression

  console.log('\n' + '═'.repeat(110));
  console.log('  ship-code Performance Benchmarks');
  console.log('═'.repeat(110));
  console.log(
    'Name'.padEnd(50),
    'Avg (ms)'.padStart(12),
    'Ops/sec'.padStart(12),
    'vs Baseline'.padStart(14),
  );
  console.log('─'.repeat(110));

  let regressions = 0;

  for (const r of results) {
    let delta = '';
    const prev = baselineMap.get(r.name);
    if (prev && prev.avgMs > 0 && r.avgMs > 0) {
      const ratio = r.avgMs / prev.avgMs;
      if (ratio > REGRESSION_THRESHOLD) {
        delta = `⚠️  ${(ratio).toFixed(2)}x slower`;
        regressions++;
      } else if (ratio < 0.8) {
        delta = `✅ ${(1 / ratio).toFixed(2)}x faster`;
      } else {
        delta = `   ~same`;
      }
    } else if (r.category === 'sharing') {
      delta = `${r.opsPerSec} shared`;
    }

    console.log(
      r.name.padEnd(50),
      r.avgMs > 0 ? r.avgMs.toFixed(4).padStart(12) : 'n/a'.padStart(12),
      r.category === 'sharing'
        ? `${r.opsPerSec} lines`.padStart(12)
        : String(r.opsPerSec).padStart(12),
      delta.padStart(14),
    );
  }

  console.log('─'.repeat(110));
  if (regressions > 0) {
    console.log(`\n⚠️  ${regressions} regression(s) detected (>20% slower than baseline)\n`);
  } else if (baseline) {
    console.log('\n✅ No regressions detected\n');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASELINE_JSON = resolve(__dirname, 'baseline.json');
const RESULTS_JSON = resolve(__dirname, 'latest.json');
const RESULTS_CSV = resolve(__dirname, 'latest.csv');

const args = process.argv.slice(2);
const shouldSave = args.includes('--save');

console.log('Running benchmarks...\n');
const results = runAll();

const report: BenchmarkReport = {
  timestamp: new Date().toISOString(),
  runtime: `Node ${process.version}`,
  results,
};

// Always write latest results
writeFileSync(RESULTS_JSON, JSON.stringify(report, null, 2));
writeFileSync(RESULTS_CSV, toCSV(results));
console.log(`Results written to:`);
console.log(`  JSON: ${RESULTS_JSON}`);
console.log(`  CSV:  ${RESULTS_CSV}`);

// Load baseline if it exists
let baseline: BenchmarkReport | undefined;
if (existsSync(BASELINE_JSON)) {
  baseline = JSON.parse(readFileSync(BASELINE_JSON, 'utf-8'));
}

// Print comparison table
printTable(results, baseline);

// Save as new baseline if requested
if (shouldSave) {
  writeFileSync(BASELINE_JSON, JSON.stringify(report, null, 2));
  console.log(`\n📌 Saved as new baseline: ${BASELINE_JSON}`);
} else if (!baseline) {
  console.log('\nNo baseline found. Run with --save to create one.');
}
