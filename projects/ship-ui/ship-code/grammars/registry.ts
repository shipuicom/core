// ---------------------------------------------------------------------------
// ShipCode — Grammar Registry
// ---------------------------------------------------------------------------
//
// Language id → TextMate scope name + lazily loaded raw grammar. The grammar
// payloads are generated TS modules (from the vendored VS Code JSON files),
// loaded through dynamic import so a bundle only carries the grammars a page
// actually tokenizes.

export interface GrammarEntry {
  readonly scopeName: string;
  /** Resolve the raw TextMate grammar object. */
  readonly load: () => Promise<object>;
}

const GRAMMARS = new Map<string, GrammarEntry>([
  ['typescript', { scopeName: 'source.ts', load: () => import('./typescript.grammar').then((m) => m.default) }],
  ['html', { scopeName: 'text.html.basic', load: () => import('./html.grammar').then((m) => m.default) }],
  ['css', { scopeName: 'source.css', load: () => import('./css.grammar').then((m) => m.default) }],
  ['json', { scopeName: 'source.json', load: () => import('./json.grammar').then((m) => m.default) }],
]);

const ALIASES: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'typescript',
  javascript: 'typescript',
  scss: 'css',
  jsonc: 'json',
};

/** The grammar entry for a language id (or alias), null when unknown. */
export function getGrammar(languageId: string): GrammarEntry | null {
  const id = languageId.toLowerCase();
  return GRAMMARS.get(ALIASES[id] ?? id) ?? null;
}

/** The grammar entry owning a TextMate scope name, null when unknown. */
export function getGrammarByScope(scopeName: string): GrammarEntry | null {
  for (const entry of GRAMMARS.values()) if (entry.scopeName === scopeName) return entry;
  return null;
}

/** Register (or override) a grammar — the extension point for consumer languages. */
export function registerGrammar(languageId: string, entry: GrammarEntry): void {
  GRAMMARS.set(languageId.toLowerCase(), entry);
}
