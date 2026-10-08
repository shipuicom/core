import { describe, it, expect } from 'vitest';
import {
  createDocument,
  getLine,
  lineCount,
  getText,
  insertText,
  deleteRange,
  applyTransaction,
  CodeDocument,
} from '../document';
import { caret } from '../selection';
import { leafOf } from '../line-tree';
import { treeOf } from '../document-internal';
import {
  moveCaretRight,
  moveCaretDown,
  moveWordRight,
  moveLineEnd,
  selectWord,
} from '../caret-motion';

/**
 * Performance benchmarks for ship-code.
 *
 * These tests set time budgets and verify structural sharing.
 * Run with the full test suite — they act as regression gates.
 * If a test fails, we've introduced a performance regression.
 *
 * Budgets are generous (10-50x headroom) so they don't flake on CI,
 * but tight enough to catch O(n²) regressions.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a realistic code document with N lines. */
function generateCodeDoc(lineCount: number): string {
  const lines: string[] = [];
  for (let i = 0; i < lineCount; i++) {
    // Varying line content to simulate real code
    switch (i % 5) {
      case 0: lines.push(`  const value${i} = computeSomething(${i});`); break;
      case 1: lines.push(`  if (value${i} > threshold) {`); break;
      case 2: lines.push(`    results.push(value${i});`); break;
      case 3: lines.push(`  }`); break;
      case 4: lines.push(''); break;
    }
  }
  return lines.join('\n');
}

/**
 * Measure how long a function takes in ms: one warm-up run, then the fastest of `runs`. A single cold run flakes when
 * other test workers compete for the CPU; the fastest run still catches an O(n²) regression, which is slow every time.
 */
function measure(fn: () => void, runs = 5): number {
  fn();
  let best = Infinity;
  for (let r = 0; r < runs; r++) {
    const start = performance.now();
    fn();
    best = Math.min(best, performance.now() - start);
  }
  return best;
}

/** Measure average over N iterations. */
function measureAvg(fn: () => void, iterations: number): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  return (performance.now() - start) / iterations;
}

// ---------------------------------------------------------------------------
// Budget constants (ms) — generous but catch O(n²) blowups
// ---------------------------------------------------------------------------

const DOC_SMALL = 100;      // 100 lines
const DOC_MEDIUM = 1_000;   // 1K lines
const DOC_LARGE = 10_000;   // 10K lines
const DOC_XLARGE = 50_000;  // 50K lines

// ---------------------------------------------------------------------------
// Document creation
// ---------------------------------------------------------------------------

describe('perf: document creation', () => {
  it('should create 1K-line document under 5ms', () => {
    const text = generateCodeDoc(DOC_MEDIUM);
    const time = measureAvg(() => createDocument(text), 10);
    expect(time).toBeLessThan(5);
  });

  it('should create 10K-line document under 20ms', () => {
    const text = generateCodeDoc(DOC_LARGE);
    const time = measureAvg(() => createDocument(text), 5);
    expect(time).toBeLessThan(20);
  });

  it('should create 50K-line document under 100ms', () => {
    const text = generateCodeDoc(DOC_XLARGE);
    const time = measureAvg(() => createDocument(text), 3);
    expect(time).toBeLessThan(100);
  });
});

// ---------------------------------------------------------------------------
// Single character insert (simulates typing)
// ---------------------------------------------------------------------------

describe('perf: single char insert', () => {
  it('should insert char in 100-line doc under 0.1ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_SMALL));
    const time = measureAvg(() => insertText(doc, caret(50, 5), 'x'), 1000);
    expect(time).toBeLessThan(0.1);
  });

  it('should insert char in 1K-line doc under 0.5ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_MEDIUM));
    const time = measureAvg(() => insertText(doc, caret(500, 5), 'x'), 500);
    expect(time).toBeLessThan(0.5);
  });

  it('should insert char in 10K-line doc under 5ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_LARGE));
    const time = measureAvg(() => insertText(doc, caret(5000, 5), 'x'), 100);
    expect(time).toBeLessThan(5);
  });

  it('should insert char in 50K-line doc under 25ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_XLARGE));
    const time = measureAvg(() => insertText(doc, caret(25000, 5), 'x'), 20);
    expect(time).toBeLessThan(25);
  });
});

// ---------------------------------------------------------------------------
// Newline insert (line split)
// ---------------------------------------------------------------------------

describe('perf: newline insert', () => {
  it('should insert newline in 10K-line doc under 5ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_LARGE));
    const time = measureAvg(() => insertText(doc, caret(5000, 5), '\n'), 100);
    expect(time).toBeLessThan(5);
  });
});

// ---------------------------------------------------------------------------
// Delete range
// ---------------------------------------------------------------------------

describe('perf: delete range', () => {
  it('should delete chars on single line in 10K-line doc under 5ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_LARGE));
    const time = measureAvg(
      () => deleteRange(doc, caret(5000, 2), caret(5000, 10)),
      100,
    );
    expect(time).toBeLessThan(5);
  });

  it('should delete multi-line range in 10K-line doc under 5ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_LARGE));
    const time = measureAvg(
      () => deleteRange(doc, caret(5000, 0), caret(5010, 0)),
      100,
    );
    expect(time).toBeLessThan(5);
  });
});

// ---------------------------------------------------------------------------
// getText reconstruction
// ---------------------------------------------------------------------------

describe('perf: getText', () => {
  it('should reconstruct 10K-line text under 5ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_LARGE));
    const time = measureAvg(() => getText(doc), 50);
    expect(time).toBeLessThan(5);
  });
});

// ---------------------------------------------------------------------------
// Sequential typing simulation (100 chars)
// ---------------------------------------------------------------------------

describe('perf: sequential typing', () => {
  it('should handle 100 sequential inserts in 1K-line doc under 50ms total', () => {
    let doc = createDocument(generateCodeDoc(DOC_MEDIUM));
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      doc = insertText(doc, caret(500, i), String.fromCharCode(97 + (i % 26)));
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
    // Verify it actually worked
    expect(getLine(doc, 500).length).toBeGreaterThan(100);
  });

  it('should handle 100 sequential inserts in 10K-line doc under 200ms total', () => {
    let doc = createDocument(generateCodeDoc(DOC_LARGE));
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      doc = insertText(doc, caret(5000, i), String.fromCharCode(97 + (i % 26)));
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });
});

// ---------------------------------------------------------------------------
// Caret motion on large docs
// ---------------------------------------------------------------------------

describe('perf: caret motion', () => {
  it('should move caret right 1000x in 10K-line doc under 5ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_LARGE));
    const elapsed = measure(() => {
      let pos = caret(5000, 0);
      for (let i = 0; i < 1000; i++) {
        pos = moveCaretRight(doc, pos);
      }
    });
    expect(elapsed).toBeLessThan(5);
  });

  it('should move caret down 1000x in 10K-line doc under 5ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_LARGE));
    const elapsed = measure(() => {
      let pos = caret(0, 5);
      for (let i = 0; i < 1000; i++) {
        pos = moveCaretDown(doc, pos);
      }
    });
    expect(elapsed).toBeLessThan(5);
  });

  it('should moveWordRight 500x in 10K-line doc under 5ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_LARGE));
    const elapsed = measure(() => {
      let pos = caret(5000, 0);
      for (let i = 0; i < 500; i++) {
        pos = moveWordRight(doc, pos);
      }
    });
    expect(elapsed).toBeLessThan(5);
  });
});

// ---------------------------------------------------------------------------
// Structural sharing — THE key architectural perf property
// ---------------------------------------------------------------------------

describe('perf: structural sharing', () => {
  // Lines live in leaves of a persistent tree: an edit copies the path to one leaf and shares every other leaf.
  const leaf = (d: ReturnType<typeof createDocument>, line: number) => leafOf(treeOf(d), line);

  it('shares every leaf but the edited one after a single-line insert', () => {
    const doc = createDocument(generateCodeDoc(DOC_MEDIUM));
    const result = insertText(doc, caret(500, 5), 'x');
    expect(getLine(result, 500)).toContain('x');
    expect(leaf(result, 500)).not.toBe(leaf(doc, 500));
    expect(leaf(result, 0)).toBe(leaf(doc, 0));
    expect(leaf(result, 999)).toBe(leaf(doc, 999));
  });

  it('shares untouched leaves after a delete and a newline insert, shifted lines included', () => {
    const doc = createDocument(generateCodeDoc(DOC_MEDIUM));
    const deleted = deleteRange(doc, caret(500, 0), caret(510, 0));
    expect(leaf(deleted, 0)).toBe(leaf(doc, 0));
    expect(getLine(deleted, 501)).toBe(getLine(doc, 511));
    const split = insertText(doc, caret(500, 5), '\n');
    expect(leaf(split, 0)).toBe(leaf(doc, 0));
    expect(getLine(split, 1000)).toBe(getLine(doc, 999));
  });

  it('copies a constant number of leaves for a one-line edit in a large document', () => {
    const doc = createDocument(generateCodeDoc(DOC_LARGE));
    const result = insertText(doc, caret(5000, 5), 'x');
    const leaves = (d: typeof doc) => {
      const out = new Set<object>();
      for (let i = 0; i < lineCount(d); i += 16) out.add(leaf(d, i));
      return out;
    };
    const before = leaves(doc);
    const fresh = [...leaves(result)].filter((l) => !before.has(l));
    expect(fresh).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Transaction performance
// ---------------------------------------------------------------------------

describe('perf: transaction', () => {
  it('should apply 10-change transaction on 10K-line doc under 50ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_LARGE));
    const changes = Array.from({ length: 10 }, (_, i) => ({
      from: caret(1000 + i * 100, 2),
      to: caret(1000 + i * 100, 2),
      insert: `/* change ${i} */`,
    }));
    const time = measureAvg(
      () => applyTransaction(doc, { changes }),
      20,
    );
    expect(time).toBeLessThan(50);
  });
});
