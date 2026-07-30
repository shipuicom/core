// ---------------------------------------------------------------------------
// ShipCode — Incremental Tokenization
// ---------------------------------------------------------------------------
//
// A per-line cache of tokens + end states over a document's line column.
// `dirty` is the watermark: everything below it is verified against the
// current document, everything at or past it is suspect. An edit splices the
// cache exactly like the document's lines spliced, so surviving entries stay
// aligned with their (moved) lines.
//
// The classic early exit: after retokenizing a line whose text is unchanged,
// an end state equal to the cached one means every following line enters with
// the state it was tokenized under — the suffix revalidates without running
// the tokenizer. That is what keeps an edit at line 3 of a 20k-line file
// O(changed region), not O(document).

import { CodeDocument } from '../core/document';
import { CodeToken, LanguageTokenizer, TokenizerState } from './types';

interface CacheLine {
  readonly text: string;
  readonly tokens: readonly CodeToken[];
  readonly endState: TokenizerState;
}

export class IncrementalTokenizer {
  #tokenizer: LanguageTokenizer;
  #cache: (CacheLine | undefined)[] = [];
  #dirty = 0;

  constructor(tokenizer: LanguageTokenizer) {
    this.#tokenizer = tokenizer;
  }

  /** First line not yet verified against the current document. */
  get tokenizedUpTo(): number {
    return this.#dirty;
  }

  /** Tokens for a line, or null when the line hasn't been (re)tokenized yet. */
  tokensFor(line: number): readonly CodeToken[] | null {
    if (line >= this.#dirty) return null;
    return this.#cache[line]?.tokens ?? null;
  }

  /** Mirror a document edit: `removed` lines at `at` became `inserted` lines. */
  spliceLines(at: number, removed: number, inserted: number): void {
    this.#cache.splice(at, removed, ...new Array<CacheLine | undefined>(inserted));
    this.#dirty = Math.min(this.#dirty, at);
  }

  /**
   * Mark a line whose text changed in place. Only that line's entry is
   * dropped — the suffix entries stay, because they are exactly what the
   * stabilization check revalidates against.
   */
  invalidateFrom(line: number): void {
    if (line < this.#cache.length) this.#cache[line] = undefined;
    this.#dirty = Math.min(this.#dirty, line);
  }

  /**
   * Advance tokenization until `targetLine` is covered (or `budget` lines have
   * been processed). Returns true when the target is covered. The suffix
   * revalidates without tokenizer calls whenever an unchanged line reproduces
   * its cached end state.
   */
  ensureUpTo(doc: CodeDocument, targetLine: number, budget = Infinity): boolean {
    const lines = doc.lines;
    if (this.#cache.length !== lines.length) this.#cache.length = lines.length;
    let processed = 0;

    while (this.#dirty < lines.length && this.#dirty <= targetLine) {
      if (processed >= budget) return false;
      const line = this.#dirty;
      const text = lines[line].text;
      const old = this.#cache[line];
      const prevState = line > 0 ? (this.#cache[line - 1]?.endState ?? null) : null;

      const result = this.#tokenizer.tokenizeLine(text, prevState);
      this.#cache[line] = { text, tokens: result.tokens, endState: result.endState };
      processed++;
      this.#dirty = line + 1;

      // Same text reproducing the same end state: the suffix was tokenized
      // from exactly these entry conditions — fast-forward over it.
      if (old && old.text === text && old.endState.equals(result.endState)) {
        while (this.#dirty < lines.length && this.#cache[this.#dirty] && this.#cache[this.#dirty]!.text === lines[this.#dirty].text) {
          this.#dirty++;
        }
      }
    }
    return this.#dirty > targetLine || this.#dirty >= lines.length;
  }
}
