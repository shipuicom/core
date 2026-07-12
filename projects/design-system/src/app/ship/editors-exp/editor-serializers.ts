import { normalizeInlineNodes } from './editor-ast.utils';
import { BaseBlockBehavior, BaseInlineBehavior } from './editor-behaviors';
import { sanitizeHtmlToBody } from './editor-sanitize';
import { ASTBlockNode, ASTDocument, ASTInlineNode, ASTMark } from './editor.types';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Heal inline content read from the DOM so a mark forms one continuous run.
 *
 * Browsers editing a `contenteditable` routinely split a styled span — typing
 * near a space can turn `<mark>hello world</mark>` into
 * `<mark>hello</mark> <mark>world</mark>`, leaving the space as a bare, unmarked
 * text node. Without healing, the split survives every parse→render cycle and
 * grows. We give a whitespace-only gap the marks of its neighbours when both
 * sides carry the exact same marks, then merge adjacent equal-mark nodes. Marks
 * therefore only break at block boundaries or a genuine change in formatting —
 * never on a space inside a run.
 */
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

    // Skip non-content elements that clipboard HTML includes (meta, style, link, etc.)
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
        if (element.tagName.toLowerCase() === 'br') return;
        if (element.getAttribute('contenteditable') === 'false') return; // Skip non-editable islands

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
    newDoc.push(parsedBlock);
  });

  if (newDoc.length === 0) newDoc.push({ type: 'paragraph', content: [{ type: 'text', text: '' }] });
  return newDoc;
}

const TAG_SENTINEL = '\u0001';

/** Identity of a mark for continuity — same type AND same attrs (two links with
 * different hrefs must not merge). */
function markKey(mark: ASTMark): string {
  return JSON.stringify({ t: mark.type, a: mark.attrs ?? null });
}

/**
 * Serialize inline nodes into properly nested markup.
 *
 * Each `ASTInlineNode` carries an unordered set of marks. Wrapping every node
 * independently (the old approach) emits a fresh tag per node, so a mark that
 * spans a change in *other* marks — e.g. a highlight covering both plain and
 * bold text — comes out as several adjacent tags. Instead we walk the nodes
 * keeping a stack of open marks: a mark stays open across nodes as long as it's
 * still wanted, and only the marks that actually start/stop at a boundary are
 * closed and reopened. This is the standard mark-stack serialization.
 *
 * `tagsFor` yields the open/close strings for a mark (or null to skip it, e.g. a
 * mark with no markdown representation). `rank` gives a stable order for marks
 * opening at the same node so nesting is deterministic.
 */
function serializeInlineRuns(
  nodes: ASTInlineNode[],
  tagsFor: (mark: ASTMark) => { open: string; close: string } | null,
  escape: (text: string) => string,
  rank: (type: string) => number
): string {
  let out = '';
  const open: { key: string; close: string }[] = [];

  for (const node of nodes) {
    const wanted = (node.marks ?? [])
      .filter((m) => tagsFor(m))
      .slice()
      .sort((a, b) => rank(a.type) - rank(b.type));
    const wantedKeys = new Set(wanted.map(markKey));

    // Keep the longest prefix of the open stack whose marks are all still wanted.
    let keep = 0;
    while (keep < open.length && wantedKeys.has(open[keep].key)) keep++;

    // Close everything above that prefix (innermost first).
    for (let i = open.length - 1; i >= keep; i--) out += open[i].close;
    open.length = keep;

    // Open any wanted marks not already on the stack.
    const openKeys = new Set(open.map((o) => o.key));
    for (const mark of wanted) {
      const key = markKey(mark);
      if (openKeys.has(key)) continue;
      const tags = tagsFor(mark)!;
      out += tags.open;
      open.push({ key, close: tags.close });
      openKeys.add(key);
    }

    out += escape(node.text || '');
  }

  for (let i = open.length - 1; i >= 0; i--) out += open[i].close;
  return out;
}

/** Build a `type -> rank` lookup from the registration order of the inline map. */
function markRanker(inlines: Map<string, BaseInlineBehavior>): (type: string) => number {
  const order = new Map<string, number>();
  let i = 0;
  for (const type of inlines.keys()) order.set(type, i++);
  return (type) => order.get(type) ?? Number.MAX_SAFE_INTEGER;
}

/** Split a behavior's wrapping render into open/close halves via a sentinel. */
function tagSplitter(render: ((text: string) => string) | undefined): { open: string; close: string } | null {
  if (!render) return null;
  const rendered = render(TAG_SENTINEL);
  const idx = rendered.indexOf(TAG_SENTINEL);
  if (idx === -1) return null;
  return { open: rendered.slice(0, idx), close: rendered.slice(idx + TAG_SENTINEL.length) };
}

/** Render inline content to HTML with continuous, correctly-nested mark tags.
 * Shared by `astToHtml` and the editor's live DOM patcher so both agree. */
export function renderInlineHTML(nodes: ASTInlineNode[], inlines: Map<string, BaseInlineBehavior>): string {
  const rank = markRanker(inlines);
  return serializeInlineRuns(
    nodes,
    (mark) => {
      const inline = inlines.get(mark.type);
      return inline ? tagSplitter((t) => inline.renderHTML(mark, t)) : null;
    },
    escapeHtml,
    rank
  );
}

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

      return behavior.renderHTML(block, renderInlineHTML(block.content as ASTInlineNode[], inlines));
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
  inlines: Map<string, BaseInlineBehavior>
): ASTDocument {
  // Sanitize untrusted HTML into an INERT, allow-listed tree before parsing.
  // Never `innerHTML` the raw string onto a live element — a detached
  // `<img src=x onerror=…>` still loads and fires its handler at parse time.
  const body = sanitizeHtmlToBody(html);
  if (!body) return [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }];
  return parseDOMToAST(body, blocks, inlines);
}

// Minimal robust MD -> HTML translation for paste events
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
        return match ? `<img src="${match[2]}" alt="${match[1]}">` : '';
      }
      return `<p>${escapeHtml(block)}</p>`;
    })
    .join('');
}

export function markdownToAst(
  md: string,
  blocks: Map<string, BaseBlockBehavior>,
  inlines: Map<string, BaseInlineBehavior>
): ASTDocument {
  return htmlToAst(markdownToHtml(md), blocks, inlines);
}
