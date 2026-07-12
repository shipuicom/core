/**
 * Sanitization primitives for the editor's render boundary.
 *
 * The editor's AST is projected to live DOM on every render (patchDOM →
 * innerHTML), and is also serialized straight into the bound `value`. Any
 * attribute a behavior interpolates into its `renderHTML` string is therefore an
 * injection sink — including when a hostile AST arrives via `value` with
 * `format='json'`, which bypasses HTML parsing entirely. These helpers let every
 * behavior escape attribute values and reject dangerous URLs at render time.
 *
 * (Step 2 will add the inbound DOM sanitizer to this module; these two functions
 * are the shared primitives it will also use.)
 */

/** URL schemes we consider safe to emit into an `href`/`src` attribute. */
const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/** Control chars + whitespace that browsers ignore inside a URL scheme. */
// eslint-disable-next-line no-control-regex
const SCHEME_NOISE = /[\u0000-\u0020]+/g;

/**
 * Escape a value for use inside a double-quoted HTML attribute.
 *
 * Unlike the text-content escaper (which only needs `& < >`), an attribute
 * context must also escape quotes so a value can't break out of the attribute
 * and inject new attributes/handlers. Nullish coerces to an empty string.
 */
export function escapeAttr(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Is `value` safe to place in a URL attribute?
 *
 * Allow-list, not deny-list: a bare relative path, anchor (`#…`), query, or
 * protocol-relative (`//…`) URL has no scheme and is allowed; a value with a
 * scheme is allowed only if the scheme is in {@link SAFE_SCHEMES}. `data:` is
 * rejected unless `allowDataImage` is set and it is a `data:image/*` payload
 * (used for pasted/inline images — SVG scripts don't execute via `img@src`).
 *
 * Control characters and whitespace are stripped before scheme detection so
 * obfuscated payloads like `java\tscript:` or `  java\nscript:` can't slip past.
 */
export function isSafeUrl(rawValue: unknown, opts: { allowDataImage?: boolean } = {}): boolean {
  const value = String(rawValue ?? '').trim();
  if (!value) return false;
  const collapsed = value.replace(SCHEME_NOISE, '');
  const schemeMatch = collapsed.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!schemeMatch) return true; // relative / anchor / query / protocol-relative — no scheme
  const scheme = `${schemeMatch[1].toLowerCase()}:`;
  if (SAFE_SCHEMES.has(scheme)) return true;
  if (opts.allowDataImage && /^data:image\/[a-z0-9.+-]+[;,]/i.test(collapsed)) return true;
  return false;
}
