// ---------------------------------------------------------------------------
// ShipCode — Theme Resolver
// ---------------------------------------------------------------------------
//
// VS Code theme compatibility: a theme is a `tokenColors` rule list (scope
// selectors → color/font settings), and resolution walks a token's scope
// stack finding, per property, the most specific matching rule.
//
// Selector semantics implemented (the subset VS Code themes actually use):
// - segment-prefix matching: `keyword.control` matches `keyword.control.ts`,
//   never `keyword.controlx`
// - comma lists and array scopes: alternatives, best match wins
// - descendant selectors: `source.ts string` requires an outer scope match
//   before the inner one
// - specificity: a match deeper in the scope stack wins; at equal depth, the
//   selector with more segments wins; at equal specificity, the later rule
//   wins (VS Code order semantics)

export interface TokenColorSettings {
  readonly foreground?: string;
  readonly fontStyle?: string; // '' | 'italic' | 'bold' | 'underline' combos
}

export interface TokenColorRule {
  readonly scope?: string | readonly string[];
  readonly settings: TokenColorSettings;
}

export interface ShipCodeTheme {
  readonly name: string;
  readonly type: 'dark' | 'light';
  /** Editor chrome colors (optional): keys follow VS Code (`editor.background`, …). */
  readonly colors?: Readonly<Record<string, string>>;
  readonly tokenColors: readonly TokenColorRule[];
}

/** A token's resolved presentation. */
export interface StyledToken {
  readonly foreground: string;
  readonly italic: boolean;
  readonly bold: boolean;
  readonly underline: boolean;
}

/** Does `selector` (one path segment) prefix-match `scope` on a dot boundary? */
function segmentMatches(selector: string, scope: string): boolean {
  return scope === selector || (scope.startsWith(selector) && scope[selector.length] === '.');
}

interface Match {
  depth: number;
  segments: number;
}

/** Match one space-separated descendant selector against a scope stack. */
function selectorMatches(selector: string, scopes: readonly string[]): Match | null {
  const parts = selector.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  let from = 0;
  let match: Match | null = null;
  for (const part of parts) {
    let found = -1;
    for (let i = from; i < scopes.length; i++) {
      if (segmentMatches(part, scopes[i])) {
        found = i;
        break;
      }
    }
    if (found < 0) return null;
    match = { depth: found, segments: part.split('.').length };
    from = found + 1;
  }
  return match;
}

function betterThan(a: Match & { rule: number }, b: (Match & { rule: number }) | null): boolean {
  if (!b) return true;
  if (a.depth !== b.depth) return a.depth > b.depth;
  if (a.segments !== b.segments) return a.segments > b.segments;
  return a.rule >= b.rule;
}

const CACHE = new WeakMap<ShipCodeTheme, Map<string, StyledToken>>();

/** Resolve a token's scope stack against a theme. Cached per theme + stack. */
export function resolveScope(scopes: readonly string[], theme: ShipCodeTheme): StyledToken {
  let themeCache = CACHE.get(theme);
  if (!themeCache) {
    themeCache = new Map();
    CACHE.set(theme, themeCache);
  }
  const key = scopes.join(' ');
  const cached = themeCache.get(key);
  if (cached) return cached;

  let fgBest: (Match & { rule: number }) | null = null;
  let fg = theme.colors?.['editor.foreground'] ?? '';
  let styleBest: (Match & { rule: number }) | null = null;
  let fontStyle = '';

  for (let r = 0; r < theme.tokenColors.length; r++) {
    const rule = theme.tokenColors[r];
    const selectors =
      rule.scope === undefined ? [''] : typeof rule.scope === 'string' ? rule.scope.split(',') : rule.scope;
    for (const raw of selectors) {
      const selector = raw.trim();
      // A scope-less rule is the theme's base setting: matches everything at
      // the lowest possible specificity.
      const match: (Match & { rule: number }) | null =
        selector === ''
          ? { depth: -1, segments: 0, rule: r }
          : ((m) => (m ? { ...m, rule: r } : null))(selectorMatches(selector, scopes));
      if (!match) continue;
      if (rule.settings.foreground !== undefined && betterThan(match, fgBest)) {
        fgBest = match;
        fg = rule.settings.foreground;
      }
      if (rule.settings.fontStyle !== undefined && betterThan(match, styleBest)) {
        styleBest = match;
        fontStyle = rule.settings.fontStyle;
      }
    }
  }

  const styled: StyledToken = {
    foreground: fg,
    italic: fontStyle.includes('italic'),
    bold: fontStyle.includes('bold'),
    underline: fontStyle.includes('underline'),
  };
  themeCache.set(key, styled);
  return styled;
}
