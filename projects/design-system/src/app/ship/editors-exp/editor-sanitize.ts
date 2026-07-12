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

/** Text-align values the editor is allowed to keep on ingest and emit on render. */
export const ALLOWED_ALIGN = new Set(['left', 'center', 'right', 'justify']);

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

// ===========================================================================
// Inbound sanitizer — scrub untrusted HTML into an inert, allow-listed tree
// before it is parsed to the AST.
// ===========================================================================

/** Tags kept during ingest. Anything else is unwrapped (its text is preserved)
 * unless it is in {@link DROP_TAGS}. Matches the tags the standard behaviors and
 * inline marks recognise, plus structural wrappers. */
const ALLOWED_TAGS = new Set([
  'p', 'div', 'br', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'code',
  'ul', 'ol', 'li', 'hr', 'img',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'a', 'mark',
]);

/** Tags removed together with their subtree — script/style/etc. must never have
 * their text content leak through as an unwrapped paragraph. */
const DROP_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'meta', 'link', 'head', 'title', 'base',
  'form', 'input', 'button', 'textarea', 'svg', 'math',
]);

/** Attributes allowed globally and per tag; everything else (incl. every `on*`)
 * is stripped. `style` is retained but scrubbed to `text-align` only. */
const GLOBAL_ATTRS = ['class', 'style'];
const TAG_ATTRS: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  code: ['language'],
  pre: ['language'],
};

/** Parse `html` into an INERT document body — one with no browsing context, so
 * images never load and scripts never run — and return it, or null when no DOM
 * is available (server without domino). Prefers DOMParser, then a detached
 * `createHTMLDocument` (works under Angular SSR/domino too). */
function inertParseBody(html: string): HTMLElement | null {
  if (typeof DOMParser !== 'undefined') {
    return new DOMParser().parseFromString(html, 'text/html').body;
  }
  if (typeof document !== 'undefined' && document.implementation?.createHTMLDocument) {
    const doc = document.implementation.createHTMLDocument('');
    doc.body.innerHTML = html;
    return doc.body;
  }
  return null;
}

function unwrap(el: Element): void {
  const parent = el.parentNode;
  if (!parent) {
    el.remove();
    return;
  }
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

function scrubChildren(parent: Node): void {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === 1) scrubElement(child as Element);
    else if (child.nodeType !== 3) child.parentNode?.removeChild(child); // drop comments/PIs
  }
}

function scrubElement(el: Element): void {
  const tag = el.tagName.toLowerCase();

  if (DROP_TAGS.has(tag)) {
    el.remove();
    return;
  }
  if (!ALLOWED_TAGS.has(tag)) {
    scrubChildren(el); // clean descendants first, then lift them out
    unwrap(el);
    return;
  }

  const allowedForTag = TAG_ATTRS[tag] ?? [];
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();

    if (name.startsWith('on') || (!GLOBAL_ATTRS.includes(name) && !allowedForTag.includes(name))) {
      el.removeAttribute(attr.name);
      continue;
    }
    if (name === 'href' || name === 'src') {
      if (!isSafeUrl(attr.value, { allowDataImage: tag === 'img' && name === 'src' })) {
        el.setAttribute(attr.name, name === 'href' ? '#' : '');
      }
    }
    if (name === 'style') {
      const align = (el as HTMLElement).style.textAlign;
      el.removeAttribute('style');
      if (align && ALLOWED_ALIGN.has(align)) (el as HTMLElement).style.textAlign = align;
    }
  }

  scrubChildren(el);
}

/**
 * Parse untrusted `html` inertly and scrub it against the tag/attribute
 * allow-list, returning the sanitized (still inert) body for `parseDOMToAST`,
 * or null when no DOM is available. This is the ingest counterpart to the
 * render-time escaping in the behaviors — together they keep both the stored
 * AST and the projected DOM free of script/handler/dangerous-URL content.
 */
export function sanitizeHtmlToBody(html: string): HTMLElement | null {
  if (!html) return null;
  const body = inertParseBody(html);
  if (!body) return null;
  scrubChildren(body);
  return body;
}
