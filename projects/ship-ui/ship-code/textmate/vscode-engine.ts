// ---------------------------------------------------------------------------
// ShipCode — vscode-textmate Engine
// ---------------------------------------------------------------------------
//
// The vendored engine: oniguruma's WASM regex core + vscode-textmate's scope
// stack tokenizer, exposed through the engine-agnostic `TokenizerEngine`
// interface. The caller supplies the `onig.wasm` bytes — a browser fetches
// the asset, tests read the vendored file from disk — so this module stays
// environment-free.

import { INITIAL, Registry, type IGrammar, type IRawGrammar, type StateStack } from '../vendor/vscode-textmate/main';
import { createOnigScanner, createOnigString, loadWASM } from '../vendor/vscode-oniguruma/main';
import { getGrammarByScope, getGrammar } from '../grammars/registry';
import { CodeToken, LanguageTokenizer, TokenizedLine, TokenizerEngine, TokenizerState } from './types';

export interface VSCodeEngineOptions {
  /**
   * The `onig.wasm` binary (vendored at `vendor/vscode-oniguruma/onig.wasm`):
   * an ArrayBuffer/typed array, or the `fetch` Response resolving to it.
   */
  wasm: ArrayBuffer | Uint8Array | Response | Promise<ArrayBuffer | Uint8Array | Response>;
}

let wasmLoaded: Promise<void> | null = null;

/** Create the vscode-textmate engine. The WASM core loads once per page. */
export async function createVSCodeEngine(options: VSCodeEngineOptions): Promise<TokenizerEngine> {
  // A failed load clears the once-per-page slot: caching the rejection would
  // make one transient fetch failure permanent for the page's lifetime.
  if (!wasmLoaded) {
    const attempt = Promise.resolve(options.wasm).then((data) => loadWASM(data as Response));
    attempt.catch(() => {
      if (wasmLoaded === attempt) wasmLoaded = null;
    });
    wasmLoaded = attempt;
  }
  await wasmLoaded;

  const registry = new Registry({
    onigLib: Promise.resolve({ createOnigScanner, createOnigString }),
    loadGrammar: async (scopeName: string): Promise<IRawGrammar | null> => {
      // Embedded-language requests (html pulling source.css, ...) route back
      // through the registry; unknown scopes resolve to null and tokenize as
      // plain text, which is vscode-textmate's own fallback.
      const entry = getGrammarByScope(scopeName);
      return entry ? ((await entry.load()) as IRawGrammar) : null;
    },
  });

  const cache = new Map<string, Promise<LanguageTokenizer | null>>();

  return {
    loadLanguage(languageId: string): Promise<LanguageTokenizer | null> {
      const entry = getGrammar(languageId);
      if (!entry) return Promise.resolve(null);
      let loaded = cache.get(entry.scopeName);
      if (!loaded) {
        const attempt = registry.loadGrammar(entry.scopeName).then((grammar) => (grammar ? wrapGrammar(grammar) : null));
        // Evict a rejection so the language can retry on the next request.
        attempt.catch(() => {
          if (cache.get(entry.scopeName) === attempt) cache.delete(entry.scopeName);
        });
        cache.set(entry.scopeName, attempt);
        loaded = attempt;
      }
      return loaded;
    },
  };
}

function wrapGrammar(grammar: IGrammar): LanguageTokenizer {
  return {
    tokenizeLine(text: string, prevState: TokenizerState | null): TokenizedLine {
      const result = grammar.tokenizeLine(text, (prevState as StateStack | null) ?? INITIAL);
      const tokens: CodeToken[] = [];
      for (const token of result.tokens) {
        // vscode-textmate emits a token reaching one past the line's end (the
        // synthetic newline); clamp, and drop the zero-width tokens that
        // leaves on empty lines.
        const end = Math.min(token.endIndex, text.length);
        if (end > token.startIndex) tokens.push({ start: token.startIndex, end, scopes: token.scopes });
      }
      return { tokens, endState: result.ruleStack };
    },
  };
}
