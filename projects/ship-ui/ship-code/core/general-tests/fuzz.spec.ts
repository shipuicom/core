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
import { caret, CaretPosition } from '../selection';
import {
  moveCaretRight,
  moveCaretLeft,
  moveCaretUp,
  moveCaretDown,
  moveWordLeft,
  moveWordRight,
  moveLineStart,
  moveLineEnd,
  moveDocStart,
  moveDocEnd,
  selectWord,
  selectLine,
  selectAll,
} from '../caret-motion';

/**
 * Fuzz tests for ship-code document model and caret motion.
 *
 * These tests generate random documents and random operations to find
 * crashes, invariant violations, and edge cases that hand-written tests miss.
 *
 * Every fuzz run uses a deterministic seed for reproducibility.
 * If a test fails, the seed is printed so you can reproduce the exact sequence.
 */

// ---------------------------------------------------------------------------
// Seeded PRNG (xorshift32 — fast, deterministic, reproducible)
// ---------------------------------------------------------------------------

class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0 || 1; // Ensure non-zero
  }

  /** Returns a random integer in [0, 2^32). */
  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.state = x;
    return x >>> 0;
  }

  /** Returns a random integer in [min, max). */
  int(min: number, max: number): number {
    return min + (this.next() % (max - min));
  }

  /** Returns a random float in [0, 1). */
  float(): number {
    return this.next() / 4294967296;
  }

  /** Pick a random element from an array. */
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length)];
  }
}

// ---------------------------------------------------------------------------
// Random generators
// ---------------------------------------------------------------------------

const WORD_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
const SPECIAL_CHARS = '!@#$%^&*()+-=[]{}|;:\'",.<>?/~` ';
const UNICODE_CHARS = 'αβγδéàüöñ你好世界日本語★☆♠♣♥♦';

function randomChar(rng: SeededRng): string {
  const roll = rng.float();
  if (roll < 0.6) return WORD_CHARS[rng.int(0, WORD_CHARS.length)];
  if (roll < 0.8) return SPECIAL_CHARS[rng.int(0, SPECIAL_CHARS.length)];
  if (roll < 0.9) return UNICODE_CHARS[rng.int(0, UNICODE_CHARS.length)];
  return '\n'; // 10% chance of newline
}

function randomString(rng: SeededRng, minLen: number, maxLen: number): string {
  const len = rng.int(minLen, maxLen + 1);
  let str = '';
  for (let i = 0; i < len; i++) str += randomChar(rng);
  return str;
}

function randomDocument(rng: SeededRng, minLines: number, maxLines: number): string {
  const numLines = rng.int(minLines, maxLines + 1);
  const lines: string[] = [];
  for (let i = 0; i < numLines; i++) {
    lines.push(randomString(rng, 0, 80));
  }
  return lines.join('\n');
}

function randomPosition(rng: SeededRng, doc: CodeDocument): CaretPosition {
  const line = rng.int(0, lineCount(doc));
  const col = rng.int(0, getLine(doc, line).length + 1);
  return caret(line, col);
}

function randomRange(
  rng: SeededRng,
  doc: CodeDocument,
): { from: CaretPosition; to: CaretPosition } {
  const a = randomPosition(rng, doc);
  const b = randomPosition(rng, doc);
  // Ensure from <= to
  if (a.line < b.line || (a.line === b.line && a.column <= b.column)) {
    return { from: a, to: b };
  }
  return { from: b, to: a };
}

// ---------------------------------------------------------------------------
// Invariant checkers
// ---------------------------------------------------------------------------

function assertDocInvariants(doc: CodeDocument, context: string): void {
  // Invariant 1: Document must have at least 1 line
  expect(lineCount(doc), `${context}: must have ≥1 line`).toBeGreaterThanOrEqual(1);

  // Invariant 2: Every line must be a string (not undefined/null)
  for (let i = 0; i < lineCount(doc); i++) {
    const line = getLine(doc, i);
    expect(typeof line, `${context}: line ${i} must be string`).toBe('string');
  }

  // Invariant 3: Round-trip getText → createDocument → getText must be stable
  const text = getText(doc);
  const roundTripped = getText(createDocument(text));
  expect(roundTripped, `${context}: round-trip must be stable`).toBe(text);

  // Invariant 4: lineCount must match split count
  const expectedLines = text.split('\n').length;
  expect(lineCount(doc), `${context}: lineCount must match split`).toBe(expectedLines);

  // Invariant 5: No line should contain \n (newlines are line separators)
  for (let i = 0; i < lineCount(doc); i++) {
    expect(
      getLine(doc, i).includes('\n'),
      `${context}: line ${i} must not contain \\n`,
    ).toBe(false);
  }
}

function assertCaretInBounds(
  doc: CodeDocument,
  pos: CaretPosition,
  context: string,
): void {
  expect(pos.line, `${context}: line in bounds`).toBeGreaterThanOrEqual(0);
  expect(pos.line, `${context}: line in bounds`).toBeLessThan(lineCount(doc));
  expect(pos.column, `${context}: column in bounds`).toBeGreaterThanOrEqual(0);
  expect(pos.column, `${context}: column in bounds`).toBeLessThanOrEqual(
    getLine(doc, pos.line).length,
  );
}

// ---------------------------------------------------------------------------
// Fuzz: Document model
// ---------------------------------------------------------------------------

const FUZZ_ITERATIONS = 500;
const FUZZ_OPS_PER_DOC = 50;

describe('fuzz: document model', () => {
  for (let seed = 1; seed <= 5; seed++) {
    it(`seed ${seed}: random insert/delete sequences preserve invariants`, () => {
      const rng = new SeededRng(seed * 12345);
      let doc = createDocument(randomDocument(rng, 1, 20));

      for (let op = 0; op < FUZZ_OPS_PER_DOC; op++) {
        const ctx = `seed=${seed} op=${op}`;
        assertDocInvariants(doc, ctx);

        const action = rng.float();

        if (action < 0.4) {
          // Insert random text at random position
          const pos = randomPosition(rng, doc);
          const text = randomString(rng, 1, 20);
          doc = insertText(doc, pos, text);
        } else if (action < 0.7) {
          // Delete a random range
          const { from, to } = randomRange(rng, doc);
          doc = deleteRange(doc, from, to);
        } else if (action < 0.85) {
          // Replace: delete + insert via transaction
          const { from, to } = randomRange(rng, doc);
          const text = randomString(rng, 0, 15);
          doc = applyTransaction(doc, { changes: [{ from, to, insert: text }] });
        } else {
          // Multi-change transaction
          const numChanges = rng.int(1, 4);
          const changes = [];
          let tempDoc = doc;
          for (let c = 0; c < numChanges; c++) {
            const pos = randomPosition(rng, tempDoc);
            const text = randomString(rng, 1, 10);
            changes.push({ from: pos, to: pos, insert: text });
            tempDoc = insertText(tempDoc, pos, text);
          }
          doc = applyTransaction(doc, { changes });
        }
      }

      // Final check
      assertDocInvariants(doc, `seed=${seed} final`);
    });
  }

  for (let seed = 1; seed <= 5; seed++) {
    it(`seed ${seed}: structural sharing preserved after random edits`, () => {
      const rng = new SeededRng(seed * 54321);
      const doc = createDocument(randomDocument(rng, 50, 200));
      const originalLineCount = lineCount(doc);

      // Do a single-line insert
      const pos = randomPosition(rng, doc);
      const result = insertText(doc, pos, 'x');

      // All other lines should be shared
      let sharedCount = 0;
      for (let i = 0; i < Math.min(lineCount(doc), lineCount(result)); i++) {
        if (result.lines[i] === doc.lines[i]) sharedCount++;
      }

      // At most 1 line should differ (the edited one)
      expect(
        sharedCount,
        `seed=${seed}: at least ${originalLineCount - 1} lines shared`,
      ).toBeGreaterThanOrEqual(originalLineCount - 1);
    });
  }
});

// ---------------------------------------------------------------------------
// Fuzz: Caret motion
// ---------------------------------------------------------------------------

describe('fuzz: caret motion', () => {
  const motionFns = [
    { name: 'moveCaretRight', fn: moveCaretRight },
    { name: 'moveCaretLeft', fn: moveCaretLeft },
    { name: 'moveCaretUp', fn: moveCaretUp },
    { name: 'moveCaretDown', fn: moveCaretDown },
    { name: 'moveWordLeft', fn: moveWordLeft },
    { name: 'moveWordRight', fn: moveWordRight },
    { name: 'moveLineStart', fn: moveLineStart },
    { name: 'moveLineEnd', fn: moveLineEnd },
    { name: 'moveDocStart', fn: moveDocStart },
    { name: 'moveDocEnd', fn: moveDocEnd },
  ];

  for (let seed = 1; seed <= 5; seed++) {
    it(`seed ${seed}: random caret motion always produces valid positions`, () => {
      const rng = new SeededRng(seed * 99999);
      const doc = createDocument(randomDocument(rng, 5, 50));

      let pos = randomPosition(rng, doc);

      for (let op = 0; op < FUZZ_ITERATIONS; op++) {
        const motion = rng.pick(motionFns);
        const prevPos = pos;
        pos = motion.fn(doc, pos);
        assertCaretInBounds(
          doc,
          pos,
          `seed=${seed} op=${op} ${motion.name}(${prevPos.line}:${prevPos.column})`,
        );
      }
    });
  }

  for (let seed = 1; seed <= 5; seed++) {
    it(`seed ${seed}: selectWord/selectLine always produce valid ranges`, () => {
      const rng = new SeededRng(seed * 77777);
      const doc = createDocument(randomDocument(rng, 5, 50));

      for (let op = 0; op < 100; op++) {
        const pos = randomPosition(rng, doc);
        const ctx = `seed=${seed} op=${op}`;

        const wordRange = selectWord(doc, pos);
        assertCaretInBounds(doc, wordRange.anchor, `${ctx} selectWord anchor`);
        assertCaretInBounds(doc, wordRange.head, `${ctx} selectWord head`);
        // Word selection should be on the same line
        expect(wordRange.anchor.line, `${ctx} selectWord same line`).toBe(pos.line);
        expect(wordRange.head.line, `${ctx} selectWord same line`).toBe(pos.line);
        // anchor <= head
        expect(
          wordRange.anchor.column <= wordRange.head.column,
          `${ctx} selectWord anchor <= head`,
        ).toBe(true);

        const lineRange = selectLine(doc, pos);
        assertCaretInBounds(doc, lineRange.anchor, `${ctx} selectLine anchor`);
        assertCaretInBounds(doc, lineRange.head, `${ctx} selectLine head`);
        expect(lineRange.anchor.column, `${ctx} selectLine starts at 0`).toBe(0);
        expect(lineRange.head.column, `${ctx} selectLine ends at EOL`).toBe(
          getLine(doc, pos.line).length,
        );
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Fuzz: Edit + Motion combined (simulates real user interaction)
// ---------------------------------------------------------------------------

describe('fuzz: edit + motion combined', () => {
  for (let seed = 1; seed <= 3; seed++) {
    it(`seed ${seed}: random edits + motion never crash`, () => {
      const rng = new SeededRng(seed * 13579);
      let doc = createDocument(randomDocument(rng, 5, 30));
      let pos = randomPosition(rng, doc);

      for (let op = 0; op < FUZZ_ITERATIONS; op++) {
        const ctx = `seed=${seed} op=${op}`;
        const action = rng.float();

        if (action < 0.3) {
          // Type a character
          const char = randomChar(rng);
          doc = insertText(doc, pos, char);
          if (char === '\n') {
            pos = caret(pos.line + 1, 0);
          } else {
            pos = caret(pos.line, pos.column + 1);
          }
        } else if (action < 0.4 && pos.column > 0) {
          // Backspace
          const from = caret(pos.line, pos.column - 1);
          doc = deleteRange(doc, from, pos);
          pos = from;
        } else if (action < 0.45 && pos.line > 0 && pos.column === 0) {
          // Backspace at line start (join lines)
          const prevLineEnd = getLine(doc, pos.line - 1).length;
          doc = deleteRange(doc, caret(pos.line - 1, prevLineEnd), pos);
          pos = caret(pos.line - 1, prevLineEnd);
        } else {
          // Random caret motion
          const motions = [
            moveCaretRight, moveCaretLeft, moveCaretUp, moveCaretDown,
            moveWordLeft, moveWordRight, moveLineStart, moveLineEnd,
          ];
          const motion = rng.pick(motions);
          pos = motion(doc, pos);
        }

        // Invariants must hold at every step
        assertDocInvariants(doc, ctx);
        assertCaretInBounds(doc, pos, ctx);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Fuzz: selectAll invariant
// ---------------------------------------------------------------------------

describe('fuzz: selectAll', () => {
  for (let seed = 1; seed <= 5; seed++) {
    it(`seed ${seed}: selectAll always spans full document`, () => {
      const rng = new SeededRng(seed * 24680);
      const doc = createDocument(randomDocument(rng, 1, 100));
      const range = selectAll(doc);

      expect(range.anchor).toEqual(caret(0, 0));
      expect(range.head).toEqual(
        caret(lineCount(doc) - 1, getLine(doc, lineCount(doc) - 1).length),
      );
    });
  }
});
