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
// Inline style allow-list — the ONLY place untrusted CSS survives ingest, so
// keep every validator tight. Shared by the sanitizer, the `style` mark's
// render/parse, and any consumer that applies styles.
// ===========================================================================

/** Anything that could smuggle a URL fetch, script, or a second declaration.
 * `;`/`{`/`}` end/nest a declaration; `url(`/`image-set`/`expression`/`-moz-
 * binding` load or execute; `<`/`>`/`\` are markup/escape vectors. */
const UNSAFE_CSS = /url\(|image-set|expression|-moz-binding|[;{}\\<>@]|\/\*/i;

function isSafeColor(v: string): boolean {
  if (v.length > 40 || UNSAFE_CSS.test(v)) return false;
  return (
    /^#[0-9a-f]{3,8}$/i.test(v) || // hex
    /^(rgb|hsl)a?\(\s*[\d.,%\s/]+\)$/i.test(v) || // rgb()/hsl() — digits/sep only inside
    /^[a-z]+$/i.test(v) // named color, transparent, currentColor (letters only)
  );
}
function isSafeCssLength(v: string): boolean {
  return v.length <= 12 && /^-?\d+(\.\d+)?(px|pt|em|rem|%)$/.test(v);
}
function isSafeLineHeight(v: string): boolean {
  return /^\d+(\.\d+)?$/.test(v) || isSafeCssLength(v);
}
function isSafeFontFamily(v: string): boolean {
  return v.length <= 120 && !UNSAFE_CSS.test(v) && /^[a-z0-9 ,'"-]+$/i.test(v);
}
function isSafeTextShadow(v: string): boolean {
  // lengths + hex/rgb colors, comma-separated; the char-set + UNSAFE_CSS guard
  // block url()/expression/extra declarations. Malformed values are ignored by
  // the browser, never injected.
  return v.length <= 120 && !UNSAFE_CSS.test(v) && /^[#a-z0-9 ,.\-%()]+$/i.test(v);
}

/**
 * CSS properties an inline `style` mark may carry, each with a strict value
 * guard. Adding a property here is a security decision — a loose guard is an
 * injection vector, since these values are written into a live `style` attribute.
 */
export const SAFE_STYLE_PROPS: Record<string, (value: string) => boolean> = {
  color: isSafeColor,
  'background-color': isSafeColor,
  'font-family': isSafeFontFamily,
  'font-size': isSafeCssLength,
  'line-height': isSafeLineHeight,
  'text-shadow': isSafeTextShadow,
};

/**
 * Serialize a style attrs object to a validated `prop: value; …` string,
 * dropping any unknown property or value that fails its guard. The single
 * source of truth for what an inline style is allowed to contain, used by both
 * render (behavior) and ingest (parseDOM).
 */
export function safeStyleString(attrs: Record<string, unknown> | undefined | null): string {
  if (!attrs) return '';
  const out: string[] = [];
  for (const [prop, val] of Object.entries(attrs)) {
    const v = String(val ?? '').trim();
    if (v && SAFE_STYLE_PROPS[prop]?.(v)) out.push(`${prop}: ${v}`);
  }
  return out.join('; ');
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
  // `data-sh-pad` marks our trailing-break caret shim (see renderInlineHTML);
  // it must survive sanitization so the parser knows the <br> isn't content.
  br: ['data-sh-pad'],
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

/** Consumer additions to the base ingest allow-list, for custom behaviors whose
 * tags/attributes the defaults would otherwise strip. */
export interface SanitizeExtend {
  tags?: string[];
  attrs?: Record<string, string[]>;
}

/** How to sanitize inbound HTML: `true`/omitted → default scrub; `false` → inert
 * parse with no scrub (trusted HTML); object → default scrub plus these additions. */
export type SanitizeOption = boolean | SanitizeExtend;

interface ResolvedPolicy {
  allowedTags: Set<string>;
  tagAttrs: Record<string, string[]>;
}

function resolvePolicy(extend?: SanitizeExtend): ResolvedPolicy {
  if (!extend) return { allowedTags: ALLOWED_TAGS, tagAttrs: TAG_ATTRS };
  const allowedTags = new Set(ALLOWED_TAGS);
  extend.tags?.forEach((t) => allowedTags.add(t.toLowerCase()));
  const tagAttrs: Record<string, string[]> = { ...TAG_ATTRS };
  for (const [tag, attrs] of Object.entries(extend.attrs ?? {})) {
    const key = tag.toLowerCase();
    tagAttrs[key] = [...(tagAttrs[key] ?? []), ...attrs.map((a) => a.toLowerCase())];
  }
  return { allowedTags, tagAttrs };
}

function scrubChildren(parent: Node, policy: ResolvedPolicy): void {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === 1) scrubElement(child as Element, policy);
    else if (child.nodeType !== 3) child.parentNode?.removeChild(child); // drop comments/PIs
  }
}

function scrubElement(el: Element, policy: ResolvedPolicy): void {
  const tag = el.tagName.toLowerCase();

  if (DROP_TAGS.has(tag)) {
    el.remove();
    return;
  }
  if (!policy.allowedTags.has(tag)) {
    scrubChildren(el, policy); // clean descendants first, then lift them out
    unwrap(el);
    return;
  }

  const allowedForTag = policy.tagAttrs[tag] ?? [];
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
      const style = (el as HTMLElement).style;
      const align = style.textAlign;
      // Collect the survivors first, then rewrite the attribute from scratch so
      // nothing unvalidated lingers.
      const kept: [string, string][] = [];
      if (align && ALLOWED_ALIGN.has(align)) kept.push(['text-align', align]);
      for (const prop of Array.from(style)) {
        const guard = SAFE_STYLE_PROPS[prop];
        if (!guard) continue;
        const value = style.getPropertyValue(prop).trim();
        if (value && guard(value)) kept.push([prop, value]);
      }
      el.removeAttribute('style');
      for (const [prop, value] of kept) style.setProperty(prop, value);
    }
  }

  scrubChildren(el, policy);
}

/**
 * Parse untrusted `html` inertly and scrub it against the tag/attribute
 * allow-list, returning the sanitized (still inert) body for `parseDOMToAST`,
 * or null when no DOM is available. This is the ingest counterpart to the
 * render-time escaping in the behaviors — together they keep both the stored
 * AST and the projected DOM free of script/handler/dangerous-URL content.
 *
 * `option`: `true`/omitted scrubs with the defaults; `false` skips the scrub but
 * STILL parses inertly (trusted HTML — never re-introduces the live-innerHTML
 * execution bug); an object extends the default allow-list.
 */
export function sanitizeHtmlToBody(html: string, option: SanitizeOption = true): HTMLElement | null {
  if (!html) return null;
  const body = inertParseBody(html);
  if (!body) return null;
  if (option === false) return body; // trusted: inert parse only, no scrub
  scrubChildren(body, resolvePolicy(option === true ? undefined : option));
  return body;
}

/**
 * Structural schema guard for the JSON `value` ingest path. A hostile or buggy
 * consumer can hand the editor arbitrary JSON; without coercion a malformed
 * node (`content: null`, `text: 42`, a mark that isn't an object…) flows into
 * behaviors and render and can throw mid-patch. This normalizes ANY input into
 * a document satisfying the editor's invariants:
 *
 * - the document is a non-empty array of `{type: string, attrs?, content: []}`
 * - text blocks carry ≥1 inline node, every inline node is `{type:'text',
 *   text: string, marks?: {type: string, attrs?}[]}`
 * - container blocks carry item blocks (recursively normalized, one level —
 *   deeper nesting is flattened by the same rule)
 * - void blocks carry `content: []`
 *
 * Salvage over rejection: invalid nodes are dropped, coercible ones coerced.
 * Runs unconditionally on JSON ingest (crash-safety is not opt-out); URL
 * scrubbing stays separate in {@link sanitizeDocumentUrls}.
 */
export function normalizeDocument(input: unknown): ASTBlockNodeLike[] {
  const doc = Array.isArray(input) ? input.map(normalizeBlock).filter((b): b is ASTBlockNodeLike => b !== null) : [];
  if (doc.length === 0) return [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }];
  return doc;
}

interface ASTInlineNodeLike {
  type: 'text';
  text: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}
interface ASTBlockNodeLike {
  type: string;
  attrs?: Record<string, unknown>;
  content: ASTInlineNodeLike[] | ASTBlockNodeLike[];
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function normalizeInline(node: unknown): ASTInlineNodeLike | null {
  if (!isPlainObject(node)) return null;
  const text = node['text'];
  if (typeof text !== 'string') return null;
  const marks = Array.isArray(node['marks'])
    ? node['marks']
        .filter(isPlainObject)
        .filter((m) => typeof m['type'] === 'string')
        .map((m) => ({ type: m['type'] as string, ...(isPlainObject(m['attrs']) ? { attrs: m['attrs'] } : {}) }))
    : undefined;
  return { type: 'text', text, ...(marks?.length ? { marks } : {}) };
}

function normalizeBlock(block: unknown, depth = 0): ASTBlockNodeLike | null {
  if (!isPlainObject(block) || typeof block['type'] !== 'string') return null;
  const attrs = isPlainObject(block['attrs']) ? block['attrs'] : undefined;
  const rawContent = Array.isArray(block['content']) ? block['content'] : [];

  // Decide the content shape from what the children actually are.
  const inline = rawContent.map(normalizeInline).filter((n): n is ASTInlineNodeLike => n !== null);
  if (inline.length > 0 || rawContent.length === 0) {
    // Text block (≥1 inline node) or void block (empty content preserved).
    // A paragraph may never be void-shaped: empty content becomes the editor's
    // empty-text convention so downstream shape detection stays sound.
    const content =
      rawContent.length === 0 ? (block['type'] === 'paragraph' ? [{ type: 'text' as const, text: '' }] : []) : inline;
    return { type: block['type'], ...(attrs ? { attrs } : {}), content };
  }

  // Children look like blocks → container. One nesting level: deeper
  // containers normalize their own children as text/void and stop.
  if (depth >= 1) {
    // Too deep — flatten to a text block from any salvageable descendant text.
    return { type: block['type'], ...(attrs ? { attrs } : {}), content: [{ type: 'text', text: '' }] };
  }
  const items = rawContent.map((c) => normalizeBlock(c, depth + 1)).filter((b): b is ASTBlockNodeLike => b !== null);
  if (items.length === 0) return { type: block['type'], ...(attrs ? { attrs } : {}), content: [{ type: 'text', text: '' }] };
  // Container items must be text blocks with ≥1 inline node.
  const normalizedItems = items.map((item) =>
    (item.content as ASTInlineNodeLike[]).length === 0
      ? { ...item, content: [{ type: 'text' as const, text: '' }] }
      : item
  );
  return { type: block['type'], ...(attrs ? { attrs } : {}), content: normalizedItems };
}

/**
 * Defense-in-depth for the JSON `value` ingest path, which stores an AST as-is
 * without ever passing an HTML parser. Deep-clone `doc` and neutralize any
 * dangerous `href`/`src` attribute (by name) on blocks and inline marks, so the
 * stored AST — not just the rendered DOM — never holds an executable URL.
 */
export function sanitizeDocumentUrls<T>(doc: T): T {
  const clone = structuredClone(doc);
  const scrubAttrs = (attrs: unknown) => {
    if (!attrs || typeof attrs !== 'object') return;
    const a = attrs as Record<string, unknown>;
    if (typeof a['href'] === 'string' && !isSafeUrl(a['href'])) a['href'] = '#';
    if (typeof a['src'] === 'string' && !isSafeUrl(a['src'], { allowDataImage: true })) a['src'] = '';
  };
  const walkBlock = (block: unknown) => {
    if (!block || typeof block !== 'object') return;
    const b = block as { attrs?: unknown; content?: unknown };
    scrubAttrs(b.attrs);
    if (Array.isArray(b.content)) {
      for (const child of b.content) {
        if (child?.type === 'text') child.marks?.forEach((m: { attrs?: unknown }) => scrubAttrs(m.attrs));
        else walkBlock(child); // nested container blocks (lists)
      }
    }
  };
  if (Array.isArray(clone)) (clone as unknown[]).forEach(walkBlock);
  return clone;
}
