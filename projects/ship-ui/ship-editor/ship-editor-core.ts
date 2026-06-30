export interface ShipEditorCommand {
  id: string;
  label: string;
  icon: string;
  description?: string;
  action: (editor: any) => void;
}

export interface CaretState {
  startPath: number[];
  startOffset: number;
  endPath: number[];
  endOffset: number;
}

export interface ShipEditorMark {
  type: 'bold' | 'italic' | 'underline' | 'strike' | 'link' | 'code';
  attrs?: {
    href?: string;
    target?: string;
  };
}

export interface ShipEditorInlineNode {
  type: 'text';
  text: string;
  marks?: ShipEditorMark[];
}

export interface ShipEditorBlock {
  type:
    | 'paragraph'
    | 'heading'
    | 'bullet-list'
    | 'ordered-list'
    | 'list-item'
    | 'code-block'
    | 'quote'
    | 'image'
    | 'hr';
  attrs?: {
    level?: number;
    src?: string;
    alt?: string;
    language?: string;
    align?: 'left' | 'center' | 'right';
    mode?: 'content' | 'theater' | 'float' | 'custom';
    size?: 'auto' | 'small' | 'medium' | 'large';
  };
  content?: ShipEditorInlineNode[] | ShipEditorBlock[];
}

export type ShipEditorDocument = ShipEditorBlock[];
export type ShipEditorValue = string | ShipEditorDocument | null;

export interface LogicalPosition {
  blockIndex: number;
  inlineIndex: number;
  offset: number;
}

export interface EditorSelection {
  anchor: LogicalPosition;
  head: LogicalPosition;
}

export interface EditorState {
  doc: ShipEditorDocument;
  selection: EditorSelection | null;
}

export type EditorOperation =
  | { type: 'insert-text'; text: string; position: LogicalPosition }
  | { type: 'delete-range'; from: LogicalPosition; to: LogicalPosition }
  | { type: 'add-mark'; mark: ShipEditorMark; from: LogicalPosition; to: LogicalPosition }
  | { type: 'remove-mark'; markType: string; from: LogicalPosition; to: LogicalPosition }
  | { type: 'split-block'; position: LogicalPosition; blockType: string }
  | { type: 'merge-blocks'; index: number };

// Helper to escape HTML characters
export function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// JSON => HTML Converter
export function jsonToHTML(doc: ShipEditorDocument): string {
  if (!doc || !Array.isArray(doc)) return '';

  return doc
    .map((block) => {
      const alignStyle = block.attrs?.align ? ` style="text-align: ${block.attrs.align};"` : '';

      switch (block.type) {
        case 'paragraph': {
          const contentHtml = inlineToHTML((block.content as ShipEditorInlineNode[]) || []);
          return `<p${alignStyle}>${contentHtml || '<br>'}</p>`;
        }
        case 'heading': {
          const level = block.attrs?.level || 1;
          const contentHtml = inlineToHTML((block.content as ShipEditorInlineNode[]) || []);
          return `<h${level}${alignStyle}>${contentHtml || '<br>'}</h${level}>`;
        }
        case 'quote': {
          const contentHtml = inlineToHTML((block.content as ShipEditorInlineNode[]) || []);
          return `<blockquote>${contentHtml || '<br>'}</blockquote>`;
        }
        case 'code-block': {
          const codeText = ((block.content as ShipEditorInlineNode[]) || []).map((node) => node.text || '').join('');
          const langClass = block.attrs?.language ? ` class="language-${block.attrs.language}"` : '';
          return `<pre><code${langClass}>${escapeHTML(codeText)}</code></pre>`;
        }
        case 'bullet-list': {
          const itemsHtml = ((block.content as ShipEditorBlock[]) || [])
            .map((item) => `<li>${inlineToHTML((item.content as ShipEditorInlineNode[]) || [])}</li>`)
            .join('');
          return `<ul>${itemsHtml}</ul>`;
        }
        case 'ordered-list': {
          const itemsHtml = ((block.content as ShipEditorBlock[]) || [])
            .map((item) => `<li>${inlineToHTML((item.content as ShipEditorInlineNode[]) || [])}</li>`)
            .join('');
          return `<ol>${itemsHtml}</ol>`;
        }
        case 'hr':
          return '<hr>';
        case 'image': {
          const src = block.attrs?.src || '';
          const alt = block.attrs?.alt || '';
          const mode = block.attrs?.mode || 'content';
          const size = block.attrs?.size || 'auto';
          if (mode === 'content' || mode === 'theater') {
            return `<img src="${src}" alt="${alt}" class="sh-editor-img-${mode}">`;
          }
          return `<img src="${src}" alt="${alt}" class="sh-editor-img-${mode} sh-editor-img-size-${size}">`;
        }
        default:
          return '';
      }
    })
    .join('');
}

export function inlineToHTML(nodes: ShipEditorInlineNode[]): string {
  if (!nodes || !Array.isArray(nodes)) return '';

  return nodes
    .map((node) => {
      let text = escapeHTML(node.text || '');
      if (!node.marks) return text;

      node.marks.forEach((mark) => {
        if (mark.type === 'bold') {
          text = `<strong>${text}</strong>`;
        } else if (mark.type === 'italic') {
          text = `<em>${text}</em>`;
        } else if (mark.type === 'underline') {
          text = `<u>${text}</u>`;
        } else if (mark.type === 'strike') {
          text = `<s>${text}</s>`;
        } else if (mark.type === 'code') {
          text = `<code>${text}</code>`;
        } else if (mark.type === 'link') {
          const href = mark.attrs?.href || '';
          const target = mark.attrs?.target ? ` target="${mark.attrs.target}"` : '';
          text = `<a href="${href}"${target}>${text}</a>`;
        }
      });

      return text;
    })
    .join('');
}

// HTML => JSON Converter
export function htmlToJSON(html: string, docObj: Document = globalThis.document): ShipEditorDocument {
  const doc: ShipEditorDocument = [];
  const temp = docObj.createElement('div');
  temp.innerHTML = html;

  const children = Array.from(temp.childNodes);
  for (const node of children) {
    if (node.nodeType === 1) { // Node.ELEMENT_NODE
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      if (['p', 'div'].includes(tagName)) {
        doc.push({
          type: 'paragraph',
          attrs: { align: getAlign(el) },
          content: parseInlineNodes(el),
        });
      } else if (/^h[1-6]$/.test(tagName)) {
        const level = parseInt(tagName.charAt(1), 10);
        doc.push({
          type: 'heading',
          attrs: { level, align: getAlign(el) },
          content: parseInlineNodes(el),
        });
      } else if (tagName === 'blockquote') {
        doc.push({
          type: 'quote',
          content: parseInlineNodes(el),
        });
      } else if (tagName === 'pre') {
        const codeEl = el.querySelector('code');
        const lang = codeEl?.getAttribute('class')?.replace('language-', '') || '';
        doc.push({
          type: 'code-block',
          attrs: { language: lang },
          content: [{ type: 'text', text: codeEl ? codeEl.textContent || '' : el.textContent || '' }],
        });
      } else if (tagName === 'ul') {
        doc.push({
          type: 'bullet-list',
          content: parseListItems(el),
        });
      } else if (tagName === 'ol') {
        doc.push({
          type: 'ordered-list',
          content: parseListItems(el),
        });
      } else if (tagName === 'hr') {
        doc.push({ type: 'hr' });
      } else if (tagName === 'img') {
        const className = el.getAttribute('class') || '';
        let mode: 'content' | 'theater' | 'float' | 'custom' = 'content';
        if (className.includes('sh-editor-img-theater')) mode = 'theater';
        else if (className.includes('sh-editor-img-float')) mode = 'float';
        else if (className.includes('sh-editor-img-custom') || className.includes('sh-editor-img-auto')) mode = 'custom';

        let size: 'auto' | 'small' | 'medium' | 'large' = 'auto';
        if (className.includes('sh-editor-img-size-small')) size = 'small';
        else if (className.includes('sh-editor-img-size-medium')) size = 'medium';
        else if (className.includes('sh-editor-img-size-large')) size = 'large';

        doc.push({
          type: 'image',
          attrs: {
            src: el.getAttribute('src') || '',
            alt: el.getAttribute('alt') || '',
            mode,
            size,
          },
        });
      } else {
        doc.push({
          type: 'paragraph',
          content: parseInlineNodes(el),
        });
      }
    } else if (node.nodeType === 3) { // Node.TEXT_NODE
      const text = node.textContent?.trim();
      if (text) {
        doc.push({
          type: 'paragraph',
          content: [{ type: 'text', text }],
        });
      }
    }
  }

  return doc;
}

function getAlign(el: HTMLElement): 'left' | 'center' | 'right' | undefined {
  const align = el.style.textAlign || el.getAttribute('align');
  if (align === 'center' || align === 'right' || align === 'left') {
    return align;
  }
  return undefined;
}

function parseListItems(listEl: HTMLElement): ShipEditorBlock[] {
  const items: ShipEditorBlock[] = [];
  for (const child of Array.from(listEl.childNodes)) {
    if (child.nodeType === 1 && (child as HTMLElement).tagName.toLowerCase() === 'li') { // Node.ELEMENT_NODE
      items.push({
        type: 'list-item',
        content: parseInlineNodes(child as HTMLElement),
      });
    }
  }
  return items;
}

function parseInlineNodes(parentEl: HTMLElement): ShipEditorInlineNode[] {
  const inlineNodes: ShipEditorInlineNode[] = [];

  const traverse = (node: Node, marks: ShipEditorMark[]) => {
    if (node.nodeType === 3) { // Node.TEXT_NODE
      const text = node.textContent || '';
      if (text) {
        inlineNodes.push({
          type: 'text',
          text,
          marks: marks.length > 0 ? [...marks] : undefined,
        });
      }
    } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      const currentMarks = [...marks];

      if (['strong', 'b'].includes(tagName)) {
        currentMarks.push({ type: 'bold' });
      } else if (['em', 'i'].includes(tagName)) {
        currentMarks.push({ type: 'italic' });
      } else if (tagName === 'u') {
        currentMarks.push({ type: 'underline' });
      } else if (['strike', 's', 'del'].includes(tagName)) {
        currentMarks.push({ type: 'strike' });
      } else if (tagName === 'code') {
        currentMarks.push({ type: 'code' });
      } else if (tagName === 'a') {
        currentMarks.push({
          type: 'link',
          attrs: {
            href: el.getAttribute('href') || '',
            target: el.getAttribute('target') || undefined,
          },
        });
      }

      for (const child of Array.from(el.childNodes)) {
        traverse(child, currentMarks);
      }
    }
  };

  for (const child of Array.from(parentEl.childNodes)) {
    traverse(child, []);
  }

  return inlineNodes;
}

// HTML => Markdown Converter
export function htmlToMarkdown(html: string, docObj: Document = globalThis.document): string {
  const temp = docObj.createElement('div');
  temp.innerHTML = html;

  let markdown = '';
  const children = Array.from(temp.childNodes);

  for (const node of children) {
    if (node.nodeType === 1) { // Node.ELEMENT_NODE
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      if (['p', 'div'].includes(tagName)) {
        const inlineMd = elementToMarkdownInline(el);
        if (inlineMd.trim()) {
          markdown += inlineMd + '\n\n';
        }
      } else if (/^h[1-6]$/.test(tagName)) {
        const level = parseInt(tagName.charAt(1), 10);
        const prefix = '#'.repeat(level) + ' ';
        markdown += prefix + elementToMarkdownInline(el) + '\n\n';
      } else if (tagName === 'blockquote') {
        const text = elementToMarkdownInline(el);
        markdown += '> ' + text.replace(/\n/g, '\n> ') + '\n\n';
      } else if (tagName === 'pre') {
        const codeEl = el.querySelector('code');
        const lang = codeEl?.getAttribute('class')?.replace('language-', '') || '';
        const codeText = codeEl ? codeEl.textContent || '' : el.textContent || '';
        markdown += '```' + lang + '\n' + codeText.trim() + '\n```\n\n';
      } else if (tagName === 'ul') {
        const items = Array.from(el.querySelectorAll(':scope > li'));
        items.forEach((li) => {
          markdown += '* ' + elementToMarkdownInline(li as HTMLElement) + '\n';
        });
        markdown += '\n';
      } else if (tagName === 'ol') {
        const items = Array.from(el.querySelectorAll(':scope > li'));
        items.forEach((li, idx) => {
          markdown += `${idx + 1}. ` + elementToMarkdownInline(li as HTMLElement) + '\n';
        });
        markdown += '\n';
      } else if (tagName === 'hr') {
        markdown += '---\n\n';
      } else if (tagName === 'img') {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || '';
        markdown += `![${alt}](${src})\n\n`;
      } else {
        const inlineMd = elementToMarkdownInline(el);
        if (inlineMd.trim()) {
          markdown += inlineMd + '\n\n';
        }
      }
    } else if (node.nodeType === 3) { // Node.TEXT_NODE
      const text = node.textContent?.trim();
      if (text) {
        markdown += text + '\n\n';
      }
    }
  }

  return markdown.trim();
}

export function elementToMarkdownInline(parentEl: HTMLElement): string {
  let md = '';

  const traverse = (node: Node) => {
    if (node.nodeType === 3) { // Node.TEXT_NODE
      md += node.textContent || '';
    } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      let prefix = '';
      let suffix = '';

      if (['strong', 'b'].includes(tagName)) {
        prefix = '**';
        suffix = '**';
      } else if (['em', 'i'].includes(tagName)) {
        prefix = '*';
        suffix = '*';
      } else if (tagName === 'u') {
        prefix = '<u>';
        suffix = '</u>';
      } else if (['strike', 's', 'del'].includes(tagName)) {
        prefix = '~~';
        suffix = '~~';
      } else if (tagName === 'code') {
        prefix = '`';
        suffix = '`';
      } else if (tagName === 'a') {
        prefix = '[';
        suffix = `](${el.getAttribute('href') || ''})`;
      } else if (tagName === 'br') {
        md += '\n';
        return;
      }

      md += prefix;
      for (const child of Array.from(el.childNodes)) {
        traverse(child);
      }
      md += suffix;
    }
  };

  for (const child of Array.from(parentEl.childNodes)) {
    traverse(child);
  }

  return md;
}

// Markdown => HTML Converter
export function markdownToHTML(markdown: string): string {
  if (!markdown) return '';

  const blocks = markdown.split(/\n\s*\n/);
  let html = '';

  let inList = false;
  let listType: 'ul' | 'ol' | null = null;

  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;

    const isBullet = /^[*-]\s+/.test(block);
    const isOrdered = /^\d+\.\s+/.test(block);

    if (inList && !isBullet && !isOrdered) {
      html += listType === 'ul' ? '</ul>' : '</ol>';
      inList = false;
      listType = null;
    }

    if (block.startsWith('```')) {
      const lines = block.split('\n');
      const firstLine = lines[0];
      const lang = firstLine.replace('```', '').trim();
      const codeLines = lines.slice(1, lines.length - (lines[lines.length - 1] === '```' ? 1 : 0));
      const codeText = codeLines.join('\n');
      const langClass = lang ? ` class="language-${lang}"` : '';
      html += `<pre><code${langClass}>${escapeHTML(codeText)}</code></pre>`;
    } else if (block.startsWith('#')) {
      const match = block.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const content = parseInlineMarkdown(match[2]);
        html += `<h${level}>${content}</h${level}>`;
      } else {
        html += `<p>${parseInlineMarkdown(block)}</p>`;
      }
    } else if (block.startsWith('>')) {
      const lines = block.split('\n').map((line) => line.replace(/^>\s?/, ''));
      const content = parseInlineMarkdown(lines.join('<br>'));
      html += `<blockquote>${content}</blockquote>`;
    } else if (block === '---') {
      html += '<hr>';
    } else if (isBullet) {
      if (!inList || listType !== 'ul') {
        if (inList) {
          html += listType === 'ul' ? '</ul>' : '</ol>';
        }
        html += '<ul>';
        inList = true;
        listType = 'ul';
      }
      const lines = block.split('\n');
      lines.forEach((line) => {
        const itemText = line.replace(/^[*-]\s+/, '');
        html += `<li>${parseInlineMarkdown(itemText)}</li>`;
      });
    } else if (isOrdered) {
      if (!inList || listType !== 'ol') {
        if (inList) {
          html += listType === 'ul' ? '</ul>' : '</ol>';
        }
        html += '<ol>';
        inList = true;
        listType = 'ol';
      }
      const lines = block.split('\n');
      lines.forEach((line) => {
        const itemText = line.replace(/^\d+\.\s+/, '');
        html += `<li>${parseInlineMarkdown(itemText)}</li>`;
      });
    } else if (block.startsWith('![') && block.includes('](')) {
      const match = block.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (match) {
        html += `<img src="${match[2]}" alt="${match[1]}">`;
      } else {
        html += `<p>${parseInlineMarkdown(block)}</p>`;
      }
    } else {
      html += `<p>${parseInlineMarkdown(block)}</p>`;
    }
  }

  if (inList) {
    html += listType === 'ul' ? '</ul>' : '</ol>';
  }

  return html;
}

export function parseInlineMarkdown(text: string): string {
  let html = escapeHTML(text);

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Underline (un-escape decoded <u> tags)
  html = html.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, '<u>$1</u>');

  // Strike
  html = html.replace(/~~(.*?)~~/g, '<s>$1</s>');

  // Code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Images
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  return html;
}

// Helper to extract plain text from JSON doc for metrics
export function getJSONText(doc: ShipEditorDocument): string {
  return doc
    .map((block) => {
      if (['paragraph', 'heading', 'quote', 'list-item'].includes(block.type)) {
        const content = block.content as ShipEditorInlineNode[];
        return content ? content.map((node) => node.text || '').join('') : '';
      }
      if (['bullet-list', 'ordered-list'].includes(block.type)) {
        const content = block.content as ShipEditorBlock[];
        return content ? getJSONText(content) : '';
      }
      if (block.type === 'code-block') {
        const content = block.content as ShipEditorInlineNode[];
        return content ? content.map((node) => node.text || '').join('') : '';
      }
      return '';
    })
    .join(' ');
}

// Selection & Range Helpers
export function getNodePath(parent: HTMLElement, node: Node): number[] {
  const path: number[] = [];
  let current: Node | null = node;
  while (current && current !== parent) {
    const parentNode: Node | null = current.parentNode;
    if (!parentNode) break;
    const siblingIndex = Array.prototype.indexOf.call(parentNode.childNodes, current);
    if (siblingIndex === -1) break;
    path.unshift(siblingIndex);
    current = parentNode;
  }
  return path;
}

export function getNodeByPath(parent: HTMLElement, path: number[]): Node {
  let current: Node = parent;
  for (const index of path) {
    if (current.childNodes[index]) {
      current = current.childNodes[index];
    } else {
      break;
    }
  }
  return current;
}

export function isNodeWrappedInTag(node: Node, tag: string, limit: HTMLElement): boolean {
  const tagName = tag.toUpperCase();
  let current: Node | null = node.parentNode;
  while (current && current !== limit) {
    if (current.nodeType === 1 && (current as HTMLElement).tagName === tagName) { // Node.ELEMENT_NODE
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

export function getTextNodesInRange(range: Range): Text[] {
  const textNodes: Text[] = [];
  const commonAncestor = range.commonAncestorContainer;

  if (commonAncestor.nodeType === 3) { // Node.TEXT_NODE
    textNodes.push(commonAncestor as Text);
    return textNodes;
  }

  const walker = commonAncestor.ownerDocument!.createTreeWalker(commonAncestor, NodeFilter.SHOW_TEXT);

  let node = walker.nextNode();
  while (node) {
    if (range.intersectsNode(node)) {
      textNodes.push(node as Text);
    }
    node = walker.nextNode();
  }
  return textNodes;
}

// Functional AST Operations
export function insertText(
  doc: ShipEditorDocument,
  position: LogicalPosition,
  text: string
): ShipEditorDocument {
  // Deep clone doc
  const newDoc = JSON.parse(JSON.stringify(doc)) as ShipEditorDocument;
  const block = newDoc[position.blockIndex];
  if (!block) return newDoc;

  if (!block.content) {
    block.content = [];
  }

  const content = block.content as ShipEditorInlineNode[];
  if (content.length === 0 || position.inlineIndex >= content.length) {
    content.push({ type: 'text', text });
  } else {
    const node = content[position.inlineIndex];
    const offset = Math.min(position.offset, node.text.length);
    node.text = node.text.substring(0, offset) + text + node.text.substring(offset);
  }

  return newDoc;
}

export function deleteRange(
  doc: ShipEditorDocument,
  from: LogicalPosition,
  to: LogicalPosition
): ShipEditorDocument {
  // Simple functional deletion of character range within a block (same-block deletion initially)
  const newDoc = JSON.parse(JSON.stringify(doc)) as ShipEditorDocument;
  if (from.blockIndex !== to.blockIndex) {
    // Multi-block deletion (TBD placeholder / simplified fallback)
    return newDoc;
  }

  const block = newDoc[from.blockIndex];
  if (!block || !block.content) return newDoc;

  const content = block.content as ShipEditorInlineNode[];
  if (from.inlineIndex === to.inlineIndex) {
    const node = content[from.inlineIndex];
    if (node) {
      node.text = node.text.substring(0, from.offset) + node.text.substring(to.offset);
    }
  }

  // Clean empty nodes
  block.content = content.filter((node) => node.text.length > 0);
  return newDoc;
}

export function applyMark(
  doc: ShipEditorDocument,
  mark: ShipEditorMark,
  from: LogicalPosition,
  to: LogicalPosition
): ShipEditorDocument {
  const newDoc = JSON.parse(JSON.stringify(doc)) as ShipEditorDocument;
  if (from.blockIndex !== to.blockIndex) return newDoc;

  const block = newDoc[from.blockIndex];
  if (!block || !block.content) return newDoc;

  const content = block.content as ShipEditorInlineNode[];
  if (from.inlineIndex === to.inlineIndex) {
    const node = content[from.inlineIndex];
    if (node) {
      // Split node around mark range if needed
      // For this simplified engine, apply mark to the entire node if selected
      if (!node.marks) node.marks = [];
      if (!node.marks.some((m) => m.type === mark.type)) {
        node.marks.push(mark);
      }
    }
  }

  return newDoc;
}

export function removeMark(
  doc: ShipEditorDocument,
  markType: string,
  from: LogicalPosition,
  to: LogicalPosition
): ShipEditorDocument {
  const newDoc = JSON.parse(JSON.stringify(doc)) as ShipEditorDocument;
  if (from.blockIndex !== to.blockIndex) return newDoc;

  const block = newDoc[from.blockIndex];
  if (!block || !block.content) return newDoc;

  const content = block.content as ShipEditorInlineNode[];
  if (from.inlineIndex === to.inlineIndex) {
    const node = content[from.inlineIndex];
    if (node && node.marks) {
      node.marks = node.marks.filter((m) => m.type !== markType);
      if (node.marks.length === 0) {
        delete node.marks;
      }
    }
  }

  return newDoc;
}
