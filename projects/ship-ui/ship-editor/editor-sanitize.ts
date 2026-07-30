

const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export const ALLOWED_ALIGN = new Set(['left', 'center', 'right', 'justify']);

const SCHEME_NOISE = /[\u0000-\u0020]+/g;

export function escapeAttr(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isSafeUrl(rawValue: unknown, opts: { allowDataImage?: boolean } = {}): boolean {
  const value = String(rawValue ?? '').trim();
  if (!value) return false;
  const collapsed = value.replace(SCHEME_NOISE, '');
  const schemeMatch = collapsed.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!schemeMatch) return true;
  const scheme = `${schemeMatch[1].toLowerCase()}:`;
  if (SAFE_SCHEMES.has(scheme)) return true;
  if (opts.allowDataImage && /^data:image\/[a-z0-9.+-]+[;,]/i.test(collapsed)) return true;
  return false;
}

const UNSAFE_CSS = /url\(|image-set|expression|-moz-binding|[;{}\\<>@]|\/\*/i;

function isSafeColor(v: string): boolean {
  if (v.length > 40 || UNSAFE_CSS.test(v)) return false;
  return (
    /^#[0-9a-f]{3,8}$/i.test(v) ||
    /^(rgb|hsl)a?\(\s*[\d.,%\s/]+\)$/i.test(v) ||
    /^[a-z]+$/i.test(v)
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

  return v.length <= 120 && !UNSAFE_CSS.test(v) && /^[#a-z0-9 ,.\-%()]+$/i.test(v);
}

export const SAFE_STYLE_PROPS: Record<string, (value: string) => boolean> = {
  color: isSafeColor,
  'background-color': isSafeColor,
  'font-family': isSafeFontFamily,
  'font-size': isSafeCssLength,
  'line-height': isSafeLineHeight,
  'text-shadow': isSafeTextShadow,
};

export function safeStyleString(attrs: Record<string, unknown> | undefined | null): string {
  if (!attrs) return '';
  const out: string[] = [];
  for (const [prop, val] of Object.entries(attrs)) {
    const v = String(val ?? '').trim();
    if (v && SAFE_STYLE_PROPS[prop]?.(v)) out.push(`${prop}: ${v}`);
  }
  return out.join('; ');
}

const ALLOWED_TAGS = new Set([
  'p', 'div', 'br', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'code',
  'ul', 'ol', 'li', 'hr', 'img',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'a', 'mark',
]);

const DROP_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'meta', 'link', 'head', 'title', 'base',
  'form', 'input', 'button', 'textarea', 'svg', 'math',
]);

const GLOBAL_ATTRS = ['class', 'style'];
const TAG_ATTRS: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  code: ['language'],
  pre: ['language'],

  br: ['data-sh-pad'],

  // Custom component blocks serialize as a neutral div wrapper; the payload
  // is inert JSON in a data attribute.
  div: ['data-sh-block', 'data-sh-attrs'],
};

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

export interface SanitizeExtend {
  tags?: string[];
  attrs?: Record<string, string[]>;
}

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
    else if (child.nodeType !== 3) child.parentNode?.removeChild(child);
  }
}

function scrubElement(el: Element, policy: ResolvedPolicy): void {
  const tag = el.tagName.toLowerCase();

  if (DROP_TAGS.has(tag)) {
    el.remove();
    return;
  }
  if (!policy.allowedTags.has(tag)) {
    scrubChildren(el, policy);
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

export function sanitizeHtmlToBody(html: string, option: SanitizeOption = true): HTMLElement | null {
  if (!html) return null;
  const body = inertParseBody(html);
  if (!body) return null;
  if (option === false) return body;
  scrubChildren(body, resolvePolicy(option === true ? undefined : option));
  return body;
}

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

  const inline = rawContent.map(normalizeInline).filter((n): n is ASTInlineNodeLike => n !== null);
  if (inline.length > 0 || rawContent.length === 0) {

    const content =
      rawContent.length === 0 ? (block['type'] === 'paragraph' ? [{ type: 'text' as const, text: '' }] : []) : inline;
    return { type: block['type'], ...(attrs ? { attrs } : {}), content };
  }

  if (depth >= 1) {

    return { type: block['type'], ...(attrs ? { attrs } : {}), content: [{ type: 'text', text: '' }] };
  }
  const items = rawContent.map((c) => normalizeBlock(c, depth + 1)).filter((b): b is ASTBlockNodeLike => b !== null);
  if (items.length === 0) return { type: block['type'], ...(attrs ? { attrs } : {}), content: [{ type: 'text', text: '' }] };

  const normalizedItems = items.map((item) =>
    (item.content as ASTInlineNodeLike[]).length === 0
      ? { ...item, content: [{ type: 'text' as const, text: '' }] }
      : item
  );
  return { type: block['type'], ...(attrs ? { attrs } : {}), content: normalizedItems };
}

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
        else walkBlock(child);
      }
    }
  };
  if (Array.isArray(clone)) (clone as unknown[]).forEach(walkBlock);
  return clone;
}
