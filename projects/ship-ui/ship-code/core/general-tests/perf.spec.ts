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

/** Measure how long a function takes in ms. Runs it once. */
function measure(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
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
    let pos = caret(5000, 0);
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      pos = moveCaretRight(doc, pos);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });

  it('should move caret down 1000x in 10K-line doc under 5ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_LARGE));
    let pos = caret(0, 5);
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      pos = moveCaretDown(doc, pos);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });

  it('should moveWordRight 500x in 10K-line doc under 5ms', () => {
    const doc = createDocument(generateCodeDoc(DOC_LARGE));
    let pos = caret(5000, 0);
    const start = performance.now();
    for (let i = 0; i < 500; i++) {
      pos = moveWordRight(doc, pos);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });
});

// ---------------------------------------------------------------------------
// Structural sharing — THE key architectural perf property
// ---------------------------------------------------------------------------

describe('perf: structural sharing', () => {
  it('unchanged lines should share identity after single-line insert', () => {
    const doc = createDocument(generateCodeDoc(DOC_MEDIUM));
    const result = insertText(doc, caret(500, 5), 'x');

    // Lines before the edit should be the same object references
    expect(result.lines[0]).toBe(doc.lines[0]);
    expect(result.lines[100]).toBe(doc.lines[100]);
    expect(result.lines[499]).toBe(doc.lines[499]);

    // The edited line should be a NEW object
    expect(result.lines[500]).not.toBe(doc.lines[500]);
    expect(getLine(result, 500)).toContain('x');

    // Lines after the edit should be the same object references
    expect(result.lines[501]).toBe(doc.lines[501]);
    expect(result.lines[999]).toBe(doc.lines[999]);
  });

  it('unchanged lines should share identity after single-line delete', () => {
    const doc = createDocument(generateCodeDoc(DOC_MEDIUM));
    const result = deleteRange(doc, caret(500, 2), caret(500, 8));

    expect(result.lines[0]).toBe(doc.lines[0]);
    expect(result.lines[499]).toBe(doc.lines[499]);
    expect(result.lines[500]).not.toBe(doc.lines[500]);
    expect(result.lines[501]).toBe(doc.lines[501]);
  });

  it('unchanged lines should share identity after newline insert', () => {
    const doc = createDocument(generateCodeDoc(DOC_MEDIUM));
    const result = insertText(doc, caret(500, 5), '\n');

    // Lines before the split should be unchanged
    expect(result.lines[0]).toBe(doc.lines[0]);
    expect(result.lines[499]).toBe(doc.lines[499]);

    // The split line is new (both halves)
    expect(result.lines[500]).not.toBe(doc.lines[500]);
    expect(result.lines[501]).not.toBe(doc.lines[500]);

    // Lines after the split are shifted by 1 but same objects
    expect(result.lines[502]).toBe(doc.lines[501]);
    expect(result.lines[1000]).toBe(doc.lines[999]);
  });

  it('unchanged lines should share identity after multi-line delete', () => {
    const doc = createDocument(generateCodeDoc(DOC_MEDIUM));
    // Delete lines 500-510 (merge them)
    const result = deleteRange(doc, caret(500, 0), caret(510, 0));

    expect(result.lines[0]).toBe(doc.lines[0]);
    expect(result.lines[499]).toBe(doc.lines[499]);
    // Line 500 is new (merged from 500 prefix + 510 suffix)
    expect(result.lines[500]).not.toBe(doc.lines[500]);
    // Lines after the deleted range are shifted but same objects
    expect(result.lines[501]).toBe(doc.lines[511]);
  });

  it('should count unchanged line references after edit', () => {
    const doc = createDocument(generateCodeDoc(DOC_LARGE));
    const result = insertText(doc, caret(5000, 5), 'x');

    let sharedCount = 0;
    let newCount = 0;
    for (let i = 0; i < lineCount(result); i++) {
      if (i < lineCount(doc) && result.lines[i] === doc.lines[i]) {
        sharedCount++;
      } else {
        newCount++;
      }
    }

    // Only 1 line should be new, rest should be shared
    expect(newCount).toBe(1);
    expect(sharedCount).toBe(lineCount(doc) - 1);
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
