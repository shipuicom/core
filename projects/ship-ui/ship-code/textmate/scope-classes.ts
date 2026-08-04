// ---------------------------------------------------------------------------
// ShipCode — Scope → CSS class mapping
// ---------------------------------------------------------------------------
//
// A compact bridge from TextMate scopes to the `sh-tok-*` CSS classes the
// view paints with, colored by CSS variables. This is deliberately not the
// theme system — phase 1.7's resolver consumes full VS Code themes
// (tokenColors rules, font styles); this mapping only has to make the default
// look right out of the box.

/** Ordered prefix rules — first match wins, most specific first. */
const RULES: readonly [prefix: string, cls: string][] = [
  ['punctuation.definition.comment', 'comment'],
  ['comment', 'comment'],
  ['string.regexp', 'regexp'],
  ['string', 'string'],
  ['constant.numeric', 'number'],
  ['constant.language', 'constant'],
  ['constant.character.escape', 'escape'],
  ['constant', 'constant'],
  ['keyword.operator', 'operator'],
  ['keyword', 'keyword'],
  ['storage', 'keyword'],
  ['entity.name.function', 'function'],
  ['entity.name.type', 'type'],
  ['entity.name.class', 'type'],
  ['entity.name.tag', 'tag'],
  ['entity.other.attribute-name', 'attribute'],
  ['support.function', 'function'],
  ['support.type.property-name', 'property'],
  ['support.type', 'type'],
  ['support.class', 'type'],
  ['support.constant', 'constant'],
  ['variable.other.property', 'property'],
  ['variable.parameter', 'parameter'],
  ['variable', 'variable'],
  ['punctuation.definition.string', 'string'],
  ['punctuation', 'punctuation'],
  ['meta.property-name', 'property'],
  ['invalid', 'invalid'],
];

const CACHE = new Map<string, string>();

/**
 * The `sh-tok-*` class for a token's scope stack, or '' for unstyled text.
 * The most specific (innermost) scope wins, matching TextMate resolution.
 */
export function classForScopes(scopes: readonly string[]): string {
  if (scopes.length === 0) return '';
  const key = scopes.join(' ');
  const cached = CACHE.get(key);
  if (cached !== undefined) return cached;

  let cls = '';
  // Innermost scope outward — the deepest scope is the most specific.
  outer: for (let i = scopes.length - 1; i >= 0; i--) {
    for (const [prefix, name] of RULES) {
      if (scopes[i].startsWith(prefix)) {
        cls = `sh-tok-${name}`;
        break outer;
      }
    }
  }
  CACHE.set(key, cls);
  return cls;
}
