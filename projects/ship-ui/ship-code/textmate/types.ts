// ---------------------------------------------------------------------------
// ShipCode — Tokenizer Types (the engine swap point)
// ---------------------------------------------------------------------------
//
// Everything above this interface is engine-agnostic: today the engine is
// vscode-textmate + oniguruma WASM (see vscode-engine.ts); a future Rust/Zig
// WASM tokenizer replaces it behind the same three interfaces.

/** One token on one line: [start, end) columns plus the TextMate scope stack. */
export interface CodeToken {
  readonly start: number;
  readonly end: number;
  readonly scopes: readonly string[];
}

/**
 * Opaque tokenizer state carried across lines (a TextMate rule stack).
 * `equals` is what incremental tokenization's early exit runs on.
 */
export interface TokenizerState {
  equals(other: TokenizerState): boolean;
}

export interface TokenizedLine {
  readonly tokens: readonly CodeToken[];
  readonly endState: TokenizerState;
}

/** A grammar bound and ready to tokenize, line by line. */
export interface LanguageTokenizer {
  /** Tokenize one line. `prevState` is the previous line's endState, null at line 0. */
  tokenizeLine(text: string, prevState: TokenizerState | null): TokenizedLine;
}

/** The engine: resolves language ids to bound tokenizers. */
export interface TokenizerEngine {
  loadLanguage(languageId: string): Promise<LanguageTokenizer | null>;
}
