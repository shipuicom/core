import { describe, expect, it } from 'vitest';
import { createDocument } from '../core/document';
import { IncrementalTokenizer } from './incremental';
import { CodeToken, LanguageTokenizer, TokenizedLine, TokenizerState } from './types';

/**
 * A deterministic mock language: state is the count of unclosed '(' so far —
 * so a line's tokenization genuinely depends on the lines above it, and
 * stabilization has something real to detect. Every call is counted.
 */
class Depth implements TokenizerState {
  constructor(readonly depth: number) {}
  equals(other: TokenizerState): boolean {
    return other instanceof Depth && other.depth === this.depth;
  }
}

function mockTokenizer() {
  const calls: string[] = [];
  const tokenizer: LanguageTokenizer = {
    tokenizeLine(text: string, prevState: TokenizerState | null): TokenizedLine {
      calls.push(text);
      let depth = prevState instanceof Depth ? prevState.depth : 0;
      for (const ch of text) {
        if (ch === '(') depth++;
        if (ch === ')') depth = Math.max(0, depth - 1);
      }
      const tokens: CodeToken[] = text.length
        ? [{ start: 0, end: text.length, scopes: [depth > 0 ? 'nested' : 'flat'] }]
        : [];
      return { tokens, endState: new Depth(depth) };
    },
  };
  return { tokenizer, calls };
}

const LINES = ['zero', 'one (', 'two', 'three )', 'four', 'five'];

describe('IncrementalTokenizer', () => {
  it('tokenizes up to the requested line and no further', () => {
    const { tokenizer, calls } = mockTokenizer();
    const inc = new IncrementalTokenizer(tokenizer);
    const doc = createDocument(LINES.join('\n'));
    expect(inc.ensureUpTo(doc, 2)).toBe(true);
    expect(calls).toEqual(['zero', 'one (', 'two']);
    expect(inc.tokensFor(2)).toEqual([{ start: 0, end: 3, scopes: ['nested'] }]);
    expect(inc.tokensFor(3)).toBeNull();
  });

  it('state flows across lines (a "(" upstream changes downstream scopes)', () => {
    const { tokenizer } = mockTokenizer();
    const inc = new IncrementalTokenizer(tokenizer);
    const doc = createDocument(LINES.join('\n'));
    inc.ensureUpTo(doc, 5);
    expect(inc.tokensFor(2)![0].scopes).toEqual(['nested']); // inside the paren
    expect(inc.tokensFor(4)![0].scopes).toEqual(['flat']); // after it closes
  });

  it('editing line 3 retokenizes only lines 3+ (nothing above)', () => {
    const { tokenizer, calls } = mockTokenizer();
    const inc = new IncrementalTokenizer(tokenizer);
    const doc = createDocument(LINES.join('\n'));
    inc.ensureUpTo(doc, 5);
    calls.length = 0;

    const edited = createDocument(LINES.map((l, i) => (i === 3 ? 'three ) EDITED' : l)).join('\n'));
    inc.invalidateFrom(3);
    inc.ensureUpTo(edited, 5);
    expect(calls[0]).toBe('three ) EDITED');
    expect(calls).not.toContain('zero');
    expect(calls).not.toContain('one (');
    expect(calls).not.toContain('two');
  });

  it('stabilization: when the end state settles, the suffix revalidates without calls', () => {
    const { tokenizer, calls } = mockTokenizer();
    const inc = new IncrementalTokenizer(tokenizer);
    const doc = createDocument(LINES.join('\n'));
    inc.ensureUpTo(doc, 5);
    calls.length = 0;

    // Change line 3's text without changing the resulting state (still one ')').
    const edited = createDocument(LINES.map((l, i) => (i === 3 ? 'tweaked )' : l)).join('\n'));
    inc.invalidateFrom(3);
    inc.ensureUpTo(edited, 5);
    // Line 3 must retokenize; line 4 retokenizes and reproduces its cached end
    // state, so line 5 revalidates with no tokenizer call.
    expect(calls).toEqual(['tweaked )', 'four']);
    expect(inc.tokensFor(5)).not.toBeNull();
  });

  it('a state-changing edit sweeps the whole suffix', () => {
    const { tokenizer, calls } = mockTokenizer();
    const inc = new IncrementalTokenizer(tokenizer);
    const doc = createDocument(LINES.join('\n'));
    inc.ensureUpTo(doc, 5);
    calls.length = 0;

    // Removing the ')' leaves the paren open — every following line's state changes.
    const edited = createDocument(LINES.map((l, i) => (i === 3 ? 'three' : l)).join('\n'));
    inc.invalidateFrom(3);
    inc.ensureUpTo(edited, 5);
    expect(calls).toEqual(['three', 'four', 'five']);
    expect(inc.tokensFor(5)![0].scopes).toEqual(['nested']);
  });

  it('line splices keep surviving entries aligned', () => {
    const { tokenizer, calls } = mockTokenizer();
    const inc = new IncrementalTokenizer(tokenizer);
    const doc = createDocument(LINES.join('\n'));
    inc.ensureUpTo(doc, 5);
    calls.length = 0;

    // Insert a state-neutral line at index 2: lines 2.. shift down by one.
    const inserted = [...LINES.slice(0, 2), 'inserted', ...LINES.slice(2)];
    const edited = createDocument(inserted.join('\n'));
    inc.spliceLines(2, 0, 1);
    inc.ensureUpTo(edited, 6);
    // The new line tokenizes; old line 2 (now 3) retokenizes and stabilizes;
    // the rest revalidates via the moved cache.
    expect(calls).toEqual(['inserted', 'two']);
    expect(inc.tokensFor(6)).not.toBeNull();
    expect(inc.tokensFor(3)![0].scopes).toEqual(['nested']); // old 'two' line, still paren-nested
  });

  it('a budget pauses and resumes mid-document', () => {
    const { tokenizer, calls } = mockTokenizer();
    const inc = new IncrementalTokenizer(tokenizer);
    const doc = createDocument(LINES.join('\n'));
    expect(inc.ensureUpTo(doc, 5, 2)).toBe(false);
    expect(calls.length).toBe(2);
    expect(inc.tokenizedUpTo).toBe(2);
    expect(inc.ensureUpTo(doc, 5, 100)).toBe(true);
    expect(calls.length).toBe(6);
  });
});
