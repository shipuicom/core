import { normalizeInlineNodes } from './editor-ast.utils';
import { BaseBlockBehavior, BaseInlineBehavior } from './editor-behaviors';
import { SanitizeOption, escapeAttr, isSafeUrl, sanitizeHtmlToBody } from './editor-sanitize';
import { ASTBlockNode, ASTDocument, ASTInlineNode, ASTMark } from './editor.types';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function healInlineRuns(nodes: ASTInlineNode[]): ASTInlineNode[] {
  for (let i = 1; i < nodes.length - 1; i++) {
    const node = nodes[i];
    const isBareGap = /^\s+$/.test(node.text) && !node.marks?.length;
    if (!isBareGap) continue;
    const prevMarks = JSON.stringify(nodes[i - 1].marks ?? []);
    const nextMarks = JSON.stringify(nodes[i + 1].marks ?? []);
    if (prevMarks !== '[]' && prevMarks === nextMarks) {
      node.marks = nodes[i - 1].marks ? structuredClone(nodes[i - 1].marks) : undefined;
    }
  }
  return normalizeInlineNodes(nodes);
}

export function parseDOMToAST(
  container: HTMLElement,
  blocks: Map<string, BaseBlockBehavior>,
  inlines: Map<string, BaseInlineBehavior>
): ASTDocument {
  const newDoc: ASTDocument = [];

  const parseNodeAsBlock = (node: HTMLElement): ASTBlockNode | null => {
    for (const b of blocks.values()) {
      const parsed = b.parseDOM(node);
      if (parsed) return parsed;
    }
    return null;
  };

  Array.from(container.childNodes).forEach((child) => {
    if (child.nodeType !== Node.ELEMENT_NODE && child.nodeType !== Node.TEXT_NODE) return;
    if (child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) return;

    const el = child as HTMLElement;
    let parsedBlock = child.nodeType === Node.ELEMENT_NODE ? parseNodeAsBlock(el) : null;

    if (!parsedBlock && child.nodeType === Node.ELEMENT_NODE) {
      const tag = el.tagName?.toLowerCase();
      const nonContentTags = new Set([
        'meta',
        'style',
        'link',
        'script',
        'head',
        'html',
        'body',
        'colgroup',
        'col',
        'title',
      ]);
      if (nonContentTags.has(tag) || (!el.textContent?.trim() && !el.children.length)) return;
      parsedBlock = { type: 'paragraph', content: [] };
    }

    if (!parsedBlock) parsedBlock = { type: 'paragraph', content: [] };
    const behavior = blocks.get(parsedBlock.type);

    if (behavior?.category === 'void') {
      newDoc.push(parsedBlock);
      return;
    }

    if (behavior?.category === 'container') {
      parsedBlock.content = parseDOMToAST(el, blocks, inlines);
      newDoc.push(parsedBlock);
      return;
    }

    const content: any[] = [];
    const traverse = (n: Node, marks: ASTMark[]) => {
      if (n.nodeType === Node.TEXT_NODE && n.textContent) {
        content.push({ type: 'text', text: n.textContent, marks: marks.length ? [...marks] : undefined });
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        const element = n as HTMLElement;
        if (element.tagName.toLowerCase() === 'br') {

          if (element.hasAttribute(PAD_BREAK_ATTR)) return;

          content.push({ type: 'text', text: '\n', marks: marks.length ? [...marks] : undefined });
          return;
        }
        if (element.getAttribute('contenteditable') === 'false') return;

        const currentMarks = [...marks];
        for (const inline of inlines.values()) {
          const parsedMark = inline.parseDOM(element);
          if (parsedMark && !currentMarks.some((m) => m.type === parsedMark.type)) {
            currentMarks.push(parsedMark);
          }
        }
        Array.from(n.childNodes).forEach((c) => traverse(c, currentMarks));
      }
    };

    if (child.nodeType === Node.ELEMENT_NODE) Array.from(el.childNodes).forEach((c) => traverse(c, []));
    else traverse(child, []);

    if (content.length === 0) content.push({ type: 'text', text: '' });
    parsedBlock.content = healInlineRuns(content);

    const only = parsedBlock.content as ASTInlineNode[];
    if (only.length === 1 && only[0].text === '\n' && !only[0].marks?.length) only[0].text = '';
    newDoc.push(parsedBlock);
  });

  if (newDoc.length === 0) newDoc.push({ type: 'paragraph', content: [{ type: 'text', text: '' }] });
  return newDoc;
}

const TAG_SENTINEL = '\u0001';

/**
 * Identity of a mark for open/close bookkeeping.
 *
 * Most marks carry no attributes, so the common case avoids `JSON.stringify`
 * entirely — this runs several times per marked node, once per render.
 */
function markKey(mark: ASTMark): string {
  return mark.attrs ? `${mark.type}\u0000${JSON.stringify(mark.attrs)}` : mark.type;
}

function serializeInlineRuns(
  nodes: ASTInlineNode[],
  tagsFor: (mark: ASTMark) => { open: string; close: string } | null,
  escape: (text: string) => string,
  rank: (type: string) => number
): string {
  let out = '';
  const open: { key: string; close: string }[] = [];

  for (const node of nodes) {
    // Resolve each mark's tags and key once. Previously `tagsFor` ran twice per
    // mark — once to filter, once to emit — and each call re-rendered the mark
    // against a sentinel.
    const wanted: { mark: ASTMark; key: string; tags: { open: string; close: string } }[] = [];
    for (const mark of node.marks ?? []) {
      const tags = tagsFor(mark);
      if (tags) wanted.push({ mark, key: markKey(mark), tags });
    }
    wanted.sort((a, b) => rank(a.mark.type) - rank(b.mark.type));

    let keep = 0;
    while (keep < open.length && wanted.some((w) => w.key === open[keep].key)) keep++;

    for (let i = open.length - 1; i >= keep; i--) out += open[i].close;
    open.length = keep;

    for (const entry of wanted) {
      let already = false;
      for (const o of open) {
        if (o.key === entry.key) {
          already = true;
          break;
        }
      }
      if (already) continue;
      out += entry.tags.open;
      open.push({ key: entry.key, close: entry.tags.close });
    }

    out += escape(node.text || '');
  }

  for (let i = open.length - 1; i >= 0; i--) out += open[i].close;
  return out;
}

/**
 * Mark ordering, memoised on the behavior registry.
 *
 * The registry only changes at `register()` time, but this rebuilt a Map of
 * every registered type once per block — and once per list item on top of that.
 */
const rankerCache = new WeakMap<Map<string, BaseInlineBehavior>, (type: string) => number>();

function markRanker(inlines: Map<string, BaseInlineBehavior>): (type: string) => number {
  const cached = rankerCache.get(inlines);
  if (cached && rankerCacheSize.get(inlines) === inlines.size) return cached;

  const order = new Map<string, number>();
  let i = 0;
  for (const type of inlines.keys()) order.set(type, i++);
  const ranker = (type: string) => order.get(type) ?? Number.MAX_SAFE_INTEGER;
  rankerCache.set(inlines, ranker);
  rankerCacheSize.set(inlines, inlines.size);
  return ranker;
}

/** Guards the memo against a registry that gained behaviors after first use. */
const rankerCacheSize = new WeakMap<Map<string, BaseInlineBehavior>, number>();

function tagSplitter(render: ((text: string) => string) | undefined): { open: string; close: string } | null {
  if (!render) return null;
  const rendered = render(TAG_SENTINEL);
  const idx = rendered.indexOf(TAG_SENTINEL);
  if (idx === -1) return null;
  return { open: rendered.slice(0, idx), close: rendered.slice(idx + TAG_SENTINEL.length) };
}

export function renderInlineHTML(
  nodes: ASTInlineNode[],
  inlines: Map<string, BaseInlineBehavior>,
  softBreaks = true
): string {
  const rank = markRanker(inlines);
  const escape = softBreaks ? (text: string) => escapeHtml(text).replace(/\n/g, '<br>') : escapeHtml;
  const out = serializeInlineRuns(
    nodes,
    (mark) => {
      const inline = inlines.get(mark.type);
      return inline ? tagSplitter((t) => inline.renderHTML(mark, t)) : null;
    },
    escape,
    rank
  );

  // Look at the last character directly rather than joining the whole block's
  // text just to test its final byte.
  let lastChar = '';
  for (let i = nodes.length - 1; i >= 0; i--) {
    const text = nodes[i].text;
    if (text) {
      lastChar = text[text.length - 1];
      break;
    }
  }
  if (softBreaks && lastChar === '\n') {

    return `${out}<br ${PAD_BREAK_ATTR}="">`;
  }
  return out;
}

export const PAD_BREAK_ATTR = 'data-sh-pad';

export function astToHtml(
  doc: ASTDocument,
  blocks: Map<string, BaseBlockBehavior>,
  inlines: Map<string, BaseInlineBehavior>
): string {
  if (!doc || doc.length === 0) return '';
  return doc
    .map((block) => {
      const behavior = blocks.get(block.type);
      if (!behavior) return '';
      if (behavior.category === 'void') return behavior.renderHTML(block, '');
      if (behavior.category === 'container')
        return behavior.renderHTML(block, astToHtml(block.content as ASTDocument, blocks, inlines));

      return behavior.renderHTML(block, renderInlineHTML(block.content as ASTInlineNode[], inlines, !behavior.preserveWhitespace));
    })
    .join('');
}

export function astToMarkdown(
  doc: ASTDocument,
  blocks: Map<string, BaseBlockBehavior>,
  inlines: Map<string, BaseInlineBehavior>
): string {
  if (!doc || doc.length === 0) return '';
  return doc
    .map((block) => {
      const behavior = blocks.get(block.type);
      if (!behavior) return '';

      const innerMd =
        behavior.category === 'container'
          ? astToMarkdown(block.content as ASTDocument, blocks, inlines)
          : serializeInlineRuns(
              block.content as ASTInlineNode[],
              (mark) => {
                const inline = inlines.get(mark.type);
                return inline?.renderMarkdown ? tagSplitter((t) => inline.renderMarkdown!(mark, t)) : null;
              },
              (t) => t,
              markRanker(inlines)
            );

      return behavior.renderMarkdown ? behavior.renderMarkdown(block, innerMd) : `${innerMd}\n\n`;
    })
    .join('')
    .trim();
}

export function htmlToAst(
  html: string,
  blocks: Map<string, BaseBlockBehavior>,
  inlines: Map<string, BaseInlineBehavior>,
  sanitize: SanitizeOption = true
): ASTDocument {

  const body = sanitizeHtmlToBody(html, sanitize);
  if (!body) return [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }];
  return parseDOMToAST(body, blocks, inlines);
}

export function markdownToHtml(md: string): string {
  if (!md) return '';
  return md
    .split(/\n\n+/)
    .map((block) => {
      block = block.trim();
      if (block === '---') return '<hr>';
      if (block.startsWith('> 💡'))
        return `<blockquote class="sh-editor-callout sh-editor-callout-info">${escapeHtml(block.replace('> 💡', '').trim())}</blockquote>`;
      if (block.startsWith('>')) return `<blockquote>${escapeHtml(block.replace(/^>\s?/gm, ''))}</blockquote>`;
      if (block.startsWith('#')) {
        const match = block.match(/^(#{1,6})\s+(.*)$/s);
        if (match) return `<h${match[1].length}>${escapeHtml(match[2])}</h${match[1].length}>`;
      }
      if (block.startsWith('```')) {
        const code = block
          .replace(/^```[a-z]*\n?/, '')
          .replace(/\n?```$/, '')
          .trim();
        return `<pre><code>${escapeHtml(code)}</code></pre>`;
      }
      if (block.match(/^!\[(.*?)\]\((.*?)\)/)) {
        const match = block.match(/^!\[(.*?)\]\((.*?)\)/);
        if (!match) return '';
        const src = isSafeUrl(match[2], { allowDataImage: true }) ? escapeAttr(match[2]) : '';
        return `<img src="${src}" alt="${escapeAttr(match[1])}">`;
      }
      return `<p>${escapeHtml(block)}</p>`;
    })
    .join('');
}

export function markdownToAst(
  md: string,
  blocks: Map<string, BaseBlockBehavior>,
  inlines: Map<string, BaseInlineBehavior>,
  sanitize: SanitizeOption = true
): ASTDocument {
  return htmlToAst(markdownToHtml(md), blocks, inlines, sanitize);
}
