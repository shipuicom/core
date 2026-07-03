import { Injectable } from '@angular/core';

export interface ShipEditorInstance {
  readonly: () => boolean;
  runTransaction(
    action: (
      doc: ShipEditorDocument,
      selection: { start: LogicalPosition; end: LogicalPosition }
    ) =>
      | {
          doc?: ShipEditorDocument;
          selectionShift?: {
            start: { blockIndex: number; listItemIndex?: number };
            end: { blockIndex: number; listItemIndex?: number };
          };
        }
      | ShipEditorDocument
      | void
      | null
  ): void;
  applyInlineStyle(tag: string): void;
  toggleLink(url: string): void;
  setBlockType(tag: string): void;
  toggleList(listType: 'ul' | 'ol'): void;
  insertHorizontalRule(): void;
  setAlign(direction: 'left' | 'center' | 'right'): void;
  removeFormat(): void;
  insertImage(url: string): void;
  undo(): void;
  redo(): void;
  selectBlockType(tag: string): void;
  formatText(command: string, value?: string): void;
  openImageModal(): void;
  openLinkModal(): void;
}

export interface ShipEditorCommand {
  id: string;
  label: string;
  icon: string;
  description?: string;
  action: (editor: ShipEditorInstance) => void;
}

export interface CaretState {
  startPath: number[];
  startOffset: number;
  endPath: number[];
  endOffset: number;
}

export interface ShipEditorMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface ShipEditorInlineNode {
  type: 'text';
  text: string;
  marks?: ShipEditorMark[];
}

export interface ShipEditorBlock {
  type: string;
  attrs?: {
    level?: number;
    src?: string;
    alt?: string;
    language?: string;
    align?: 'left' | 'center' | 'right';
    mode?: 'content' | 'theater' | 'float' | 'custom';
    size?: 'auto' | 'small' | 'medium' | 'large';
    [key: string]: any;
  };
  content?: ShipEditorInlineNode[] | ShipEditorBlock[];
}

export type ShipEditorDocument = ShipEditorBlock[];
export type ShipEditorValue = string | ShipEditorDocument | null;

export interface ShipEditorMarkExtension {
  type: string;
  tagName: string;
  className?: string;
  /** Keybinding action name, matched against ShipA11yKeybindingsService (e.g. 'editor.bold'). */
  keybinding?: string;
  /** Override the default toggle behavior when the keybinding fires. Return true to prevent default. */
  onKeyAction?: (editor: ShipEditorInstance) => boolean | void;
  toHTML?: (mark: ShipEditorMark, text: string) => string;
  parseHTML?: (el: HTMLElement) => ShipEditorMark | null;
  /** Optional override for markdown serialization. If not provided, uses default mapping. */
  toMarkdown?: (mark: ShipEditorMark, text: string) => string;
  /** Called when the editor instance is initialized. */
  onInit?: (editor: ShipEditorInstance) => void;
  /** Called when the editor instance is destroyed. */
  onDestroy?: (editor: ShipEditorInstance) => void;
}

export const boldMarkExtension: ShipEditorMarkExtension = {
  type: 'bold',
  tagName: 'strong',
  keybinding: 'editor.bold',
  parseHTML: (el) => (['strong', 'b'].includes(el.tagName.toLowerCase()) ? { type: 'bold' } : null),
};

export const italicMarkExtension: ShipEditorMarkExtension = {
  type: 'italic',
  tagName: 'em',
  keybinding: 'editor.italic',
  parseHTML: (el) => (['em', 'i'].includes(el.tagName.toLowerCase()) ? { type: 'italic' } : null),
};

export const underlineMarkExtension: ShipEditorMarkExtension = {
  type: 'underline',
  tagName: 'u',
  keybinding: 'editor.underline',
  parseHTML: (el) => (el.tagName.toLowerCase() === 'u' ? { type: 'underline' } : null),
};

export const strikeMarkExtension: ShipEditorMarkExtension = {
  type: 'strike',
  tagName: 's',
  keybinding: 'editor.strike',
  parseHTML: (el) => (['strike', 's', 'del'].includes(el.tagName.toLowerCase()) ? { type: 'strike' } : null),
};

export const codeMarkExtension: ShipEditorMarkExtension = {
  type: 'code',
  tagName: 'code',
  keybinding: 'editor.code',
  onKeyAction: (editor) => {
    editor.applyInlineStyle('code');
    return true;
  },
  parseHTML: (el) => (el.tagName.toLowerCase() === 'code' ? { type: 'code' } : null),
};

export const linkMarkExtension: ShipEditorMarkExtension = {
  type: 'link',
  tagName: 'a',
  toHTML: (mark, text) => {
    const href = escapeHTML(mark.attrs?.['href'] || '');
    const target = mark.attrs?.['target'] ? ` target="${escapeHTML(mark.attrs['target'])}"` : '';
    return `<a href="${href}"${target}>${text}</a>`;
  },
  parseHTML: (el) => {
    if (el.tagName.toLowerCase() === 'a') {
      return {
        type: 'link',
        attrs: {
          href: el.getAttribute('href') || '',
          target: el.getAttribute('target') || undefined,
        },
      };
    }
    return null;
  },
};

export const defaultMarkExtensions: ShipEditorMarkExtension[] = [
  boldMarkExtension,
  italicMarkExtension,
  underlineMarkExtension,
  strikeMarkExtension,
  codeMarkExtension,
  linkMarkExtension,
];

export interface ShipEditorBlockExtension {
  type: string;
  /** Keybinding action name, matched against ShipA11yKeybindingsService (e.g. 'editor.codeBlock'). */
  keybinding?: string;
  /** Custom action when the keybinding fires. Receives the editor instance. */
  onKeyAction?: (editor: ShipEditorInstance) => boolean | void;
  toHTML?: (block: ShipEditorBlock, contentHtml: string) => string;
  parseHTML?: (el: HTMLElement) => ShipEditorBlock | null;
  /** Optional override for markdown serialization. If not provided, uses default mapping. */
  toMarkdown?: (block: ShipEditorBlock, contentMd: string) => string;

  /**
   * Handle keyboard events when the caret is inside this block type.
   * Called during keydown/beforeinput, before the editor's generic block-level handling.
   *
   * Return a `BlockKeydownResult` with the new doc and caret position if the
   * event was handled,   * or `false` to let the editor's default handling proceed.
   */
  onBlockKeydown?: (event: KeyboardEvent | InputEvent, ctx: ShipEditorBlockContext) => BlockKeydownResult | false;

  /**
   * Handle click events inside this block type.
   * Useful for triggering custom overlays, property panels, or block-specific actions.
   */
  onBlockClick?: (event: MouseEvent, ctx: ShipEditorBlockContext) => void;

  /** Called when the editor instance is initialized. */
  onInit?: (editor: ShipEditorInstance) => void;
  /** Called when the editor instance is destroyed. */
  onDestroy?: (editor: ShipEditorInstance) => void;

  /**
   * Post-render hook called after the DOM for this block has been written and metadata attributes applied.
   * Use for enhancing the DOM (e.g. adding interactive controls, charts, etc.).
   */
  onBlockRender?: (el: HTMLElement, block: ShipEditorBlock, index: number) => void;

  /**
   * CSS class name added to the block's top-level DOM element when the
   * caret is inside it. Enables visual highlights via pure CSS.
   * E.g. 'sh-editor-code-active' for a selection ring on code blocks.
   */
  activeClassName?: string;

  /**
   * Extension-specific configuration. Each extension defines its own config shape.
   * Use `configureExtension()` to create a copy with overridden config values.
   *
   * Example (image extension): `{ defaultMode: 'custom', defaultSize: 'medium' }`
   */
  config?: Record<string, any>;
}

/**
 * Create a copy of a block extension with overridden configuration.
 * Merges the provided config into the extension's existing config.
 *
 * @example
 * ```typescript
 * const customImage = configureExtension(imageBlockExtension, {
 *   defaultMode: 'content',
 *   defaultSize: 'auto',
 * });
 * ```
 */
export function configureExtension(
  ext: ShipEditorBlockExtension,
  config: Record<string, any>
): ShipEditorBlockExtension {
  return { ...ext, config: { ...ext.config, ...config } };
}

/** Result returned from `onBlockKeydown` when the event was handled. */
export interface BlockKeydownResult {
  doc: ShipEditorDocument;
  position: LogicalPosition;
}

/** Context passed to block-scoped extension handlers (keydown, click, etc.). */
export interface ShipEditorBlockContext {
  position: LogicalPosition;
  blockEl: HTMLElement;
  doc: ShipEditorDocument;
}

export const paragraphBlockExtension: ShipEditorBlockExtension = {
  type: 'paragraph',
  keybinding: 'editor.paragraph',
  onKeyAction: (editor) => {
    editor.setBlockType('p');
    return true;
  },
  toHTML: (block, contentHtml) => {
    const alignStyle = block.attrs?.align ? ` style="text-align: ${block.attrs.align};"` : '';
    return `<p${alignStyle}>${contentHtml || '<br>'}</p>`;
  },
  parseHTML: (el) => {
    const tagName = el.tagName.toLowerCase();
    if (['p', 'div'].includes(tagName)) {
      return {
        type: 'paragraph',
        attrs: { align: getAlign(el) },
        content: parseInlineNodes(el),
      };
    }
    return null;
  },
};

export const headingBlockExtension: ShipEditorBlockExtension = {
  type: 'heading',
  toHTML: (block, contentHtml) => {
    const level = block.attrs?.level || 1;
    const alignStyle = block.attrs?.align ? ` style="text-align: ${block.attrs.align};"` : '';
    return `<h${level}${alignStyle}>${contentHtml || '<br>'}</h${level}>`;
  },
  parseHTML: (el) => {
    const tagName = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tagName)) {
      const level = parseInt(tagName.charAt(1), 10);
      return {
        type: 'heading',
        attrs: { level, align: getAlign(el) },
        content: parseInlineNodes(el),
      };
    }
    return null;
  },
};

export const infoCalloutBlockExtension: ShipEditorBlockExtension = {
  type: 'info-callout',
  toHTML: (block, contentHtml) => {
    return `<blockquote class="sh-editor-callout sh-editor-callout-info"><span class="sh-editor-callout-icon" contenteditable="false">💡</span>${contentHtml || '<br>'}</blockquote>`;
  },
  parseHTML: (el) => {
    if (
      el.tagName.toLowerCase() === 'blockquote' &&
      el.classList.contains('sh-editor-callout')
    ) {
      // Extract text content, skipping the icon span
      const clone = el.cloneNode(true) as HTMLElement;
      const iconSpan = clone.querySelector('.sh-editor-callout-icon');
      if (iconSpan) iconSpan.remove();
      return {
        type: 'info-callout',
        content: parseInlineNodes(clone),
      };
    }
    return null;
  },
};

export const quoteBlockExtension: ShipEditorBlockExtension = {
  type: 'quote',
  keybinding: 'editor.blockquote',
  onKeyAction: (editor) => {
    editor.setBlockType('blockquote');
    return true;
  },
  toHTML: (block, contentHtml) => {
    return `<blockquote>${contentHtml || '<br>'}</blockquote>`;
  },
  parseHTML: (el) => {
    if (el.tagName.toLowerCase() === 'blockquote') {
      return {
        type: 'quote',
        content: parseInlineNodes(el),
      };
    }
    return null;
  },
};


export const codeBlockBlockExtension: ShipEditorBlockExtension = {
  type: 'code-block',
  keybinding: 'editor.codeBlock',
  onKeyAction: (editor) => {
    editor.setBlockType('pre');
    return true;
  },
  activeClassName: 'sh-editor-code-active',
  onBlockKeydown: (event, ctx) => {
    // 1. Handle Enter (insert newline with auto-indent)
    if (
      (event instanceof KeyboardEvent &&
        event.key === 'Enter' &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey) ||
      (event instanceof InputEvent && (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak'))
    ) {
      const doc = cloneDoc(ctx.doc);
      const block = getTargetBlock(doc, ctx.position.blockIndex, ctx.position.listItemIndex);
      if (!block || !block.content) return false;

      const content = block.content as ShipEditorInlineNode[];
      const node = content[ctx.position.inlineIndex];
      if (!node) return false;

      // Auto-indent: find leading whitespace of the current line
      const textBefore = node.text.slice(0, ctx.position.offset);
      const lines = textBefore.split('\n');
      const currentLine = lines[lines.length - 1];
      const indentMatch = currentLine.match(/^[ \t]*/);
      const indent = indentMatch ? indentMatch[0] : '';
      const insertion = '\n' + indent;

      node.text = node.text.slice(0, ctx.position.offset) + insertion + node.text.slice(ctx.position.offset);

      return {
        doc,
        position: {
          ...ctx.position,
          offset: ctx.position.offset + insertion.length,
        },
      };
    }

    // 2. Handle Tab (insert 2 spaces)
    if (event instanceof KeyboardEvent && event.key === 'Tab' && !event.shiftKey) {
      const newDoc = insertText(ctx.doc, ctx.position, '  ');
      return { doc: newDoc, position: { ...ctx.position, offset: ctx.position.offset + 2 } };
    }

    // 3. Handle Shift+Tab (remove up to 2 leading spaces)
    if (event instanceof KeyboardEvent && event.key === 'Tab' && event.shiftKey) {
      const block = getTargetBlock(ctx.doc, ctx.position.blockIndex, ctx.position.listItemIndex);
      if (!block || !block.content) return { doc: ctx.doc, position: ctx.position };

      const content = block.content as ShipEditorInlineNode[];
      const fullText = content.map((n) => n.text).join('');
      const charOffset = ctx.position.offset;
      const beforeCaret = fullText.substring(0, charOffset);
      const lineStart = beforeCaret.lastIndexOf('\n') + 1;

      let spacesToRemove = 0;
      for (let i = 0; i < Math.min(2, fullText.length - lineStart); i++) {
        if (fullText[lineStart + i] === ' ') spacesToRemove++;
        else break;
      }

      if (spacesToRemove > 0) {
        const fromPos: LogicalPosition = { ...ctx.position, offset: lineStart, inlineIndex: 0 };
        const toPos: LogicalPosition = { ...ctx.position, offset: lineStart + spacesToRemove, inlineIndex: 0 };
        const newDoc = deleteRange(ctx.doc, fromPos, toPos);
        const newOffset = Math.max(lineStart, charOffset - spacesToRemove);
        return { doc: newDoc, position: { ...ctx.position, offset: newOffset } };
      }
      return { doc: ctx.doc, position: ctx.position };
    }

    return false;
  },
  toHTML: (block) => {
    const codeText = ((block.content as ShipEditorInlineNode[]) || []).map((node) => node.text || '').join('');
    const langClass = block.attrs?.language ? ` class="language-${block.attrs.language}"` : '';
    // Ensure we don't have empty content that breaks rendering
    const displayCode = codeText || '';
    return `<pre><code${langClass}>${escapeHTML(displayCode)}</code></pre>`;
  },
  parseHTML: (el) => {
    if (el.tagName.toLowerCase() === 'pre') {
      const codeEl = el.querySelector('code');
      const lang = codeEl?.getAttribute('class')?.replace('language-', '') || '';
      return {
        type: 'code-block',
        attrs: { language: lang },
        content: [{ type: 'text', text: codeEl ? codeEl.textContent || '' : el.textContent || '' }],
      };
    }
    return null;
  },
};

export const bulletListBlockExtension: ShipEditorBlockExtension = {
  type: 'bullet-list',
  keybinding: 'editor.bulletList',
  onKeyAction: (editor) => {
    editor.toggleList('ul');
    return true;
  },
  toHTML: (block, contentHtml) => {
    return `<ul>${contentHtml}</ul>`;
  },
  parseHTML: (el) => {
    if (el.tagName.toLowerCase() === 'ul') {
      return {
        type: 'bullet-list',
        content: parseListItems(el, ShipEditorRegistry.getInstance()),
      };
    }
    return null;
  },
};

export const orderedListBlockExtension: ShipEditorBlockExtension = {
  type: 'ordered-list',
  keybinding: 'editor.orderedList',
  onKeyAction: (editor) => {
    editor.toggleList('ol');
    return true;
  },
  toHTML: (block, contentHtml) => {
    return `<ol>${contentHtml}</ol>`;
  },
  parseHTML: (el) => {
    if (el.tagName.toLowerCase() === 'ol') {
      return {
        type: 'ordered-list',
        content: parseListItems(el, ShipEditorRegistry.getInstance()),
      };
    }
    return null;
  },
};

export const listItemBlockExtension: ShipEditorBlockExtension = {
  type: 'list-item',
  toHTML: (block, contentHtml) => {
    return `<li>${contentHtml}</li>`;
  },
  parseHTML: (el) => {
    if (el.tagName.toLowerCase() === 'li') {
      return {
        type: 'list-item',
        content: parseInlineNodes(el),
      };
    }
    return null;
  },
};

export const hrBlockExtension: ShipEditorBlockExtension = {
  type: 'hr',
  toHTML: () => '<hr>',
  parseHTML: (el) => {
    if (el.tagName.toLowerCase() === 'hr') {
      return { type: 'hr' };
    }
    return null;
  },
};

export const imageBlockExtension: ShipEditorBlockExtension = {
  type: 'image',
  config: {
    defaultMode: 'custom',
    defaultSize: 'medium',
  },
  toHTML: (block) => {
    const src = escapeHTML(block.attrs?.src || '');
    const alt = escapeHTML(block.attrs?.alt || '');
    const mode = block.attrs?.mode || 'content';
    const size = block.attrs?.size || 'auto';
    if (mode === 'content' || mode === 'theater') {
      return `<img src="${src}" alt="${alt}" class="sh-editor-img-${mode}">`;
    }
    return `<img src="${src}" alt="${alt}" class="sh-editor-img-${mode} sh-editor-img-size-${size}">`;
  },
  parseHTML: (el) => {
    if (el.tagName.toLowerCase() === 'img') {
      const { mode, size } = parseImageClassNames(el.getAttribute('class') || '');
      return {
        type: 'image',
        attrs: {
          src: el.getAttribute('src') || '',
          alt: el.getAttribute('alt') || '',
          mode,
          size,
        },
      };
    }
    return null;
  },
  onBlockRender: (blockEl) => {
    // Ensure images are focusable for keyboard interaction
    const img = blockEl.tagName === 'IMG' ? blockEl : blockEl.querySelector('img');
    if (img && !img.hasAttribute('tabindex')) {
      img.setAttribute('tabindex', '0');
    }
  },
};

export const defaultBlockExtensions: ShipEditorBlockExtension[] = [
  paragraphBlockExtension,
  headingBlockExtension,
  quoteBlockExtension,
  infoCalloutBlockExtension, // After quote — prepend strategy means it'll be checked before quote
  codeBlockBlockExtension,
  bulletListBlockExtension,
  orderedListBlockExtension,
  listItemBlockExtension,
  hrBlockExtension,
  imageBlockExtension,
];

@Injectable({ providedIn: 'root' })
export class ShipEditorRegistry {
  private marks = new Map<string, ShipEditorMarkExtension>();
  private blocks = new Map<string, ShipEditorBlockExtension>();

  private static globalInstance: ShipEditorRegistry;

  /**
   * Get the global singleton instance for non-DI contexts.
   * Prefer injecting ShipEditorRegistry via constructor in Angular components.
   */
  static getInstance(): ShipEditorRegistry {
    if (!this.globalInstance) {
      this.globalInstance = new ShipEditorRegistry();
      this.globalInstance.registerDefaults();
    }
    return this.globalInstance;
  }

  static clear() {
    this.getInstance().clear();
  }

  static registerMark(ext: ShipEditorMarkExtension) {
    this.getInstance().registerMark(ext);
  }

  static getMark(type: string) {
    return this.getInstance().getMark(type);
  }

  static getAllMarks() {
    return this.getInstance().getAllMarks();
  }

  static registerBlock(ext: ShipEditorBlockExtension) {
    this.getInstance().registerBlock(ext);
  }

  static getBlock(type: string) {
    return this.getInstance().getBlock(type);
  }

  static getAllBlocks() {
    return this.getInstance().getAllBlocks();
  }

  registerMark(ext: ShipEditorMarkExtension) {
    this.marks.delete(ext.type);
    const existing = new Map(this.marks);
    this.marks.clear();
    this.marks.set(ext.type, ext);
    for (const [k, v] of existing) this.marks.set(k, v);
  }

  getMark(type: string): ShipEditorMarkExtension | undefined {
    return this.marks.get(type);
  }

  getAllMarks(): ShipEditorMarkExtension[] {
    return Array.from(this.marks.values());
  }

  registerBlock(ext: ShipEditorBlockExtension) {
    this.blocks.delete(ext.type);
    const existing = new Map(this.blocks);
    this.blocks.clear();
    this.blocks.set(ext.type, ext);
    for (const [k, v] of existing) this.blocks.set(k, v);
  }

  getBlock(type: string): ShipEditorBlockExtension | undefined {
    return this.blocks.get(type);
  }

  getAllBlocks(): ShipEditorBlockExtension[] {
    return Array.from(this.blocks.values());
  }

  clear() {
    this.marks.clear();
    this.blocks.clear();
  }

  registerDefaults() {
    this.registerDefaultMarks();
    defaultBlockExtensions.forEach((ext) => this.registerBlock(ext));
  }

  registerDefaultMarks() {
    defaultMarkExtensions.forEach((ext) => this.registerMark(ext));
  }

  clearBlocks() {
    this.blocks.clear();
  }
}

export function registerDefaultExtensions() {
  ShipEditorRegistry.getInstance().registerDefaults();
}

export interface LogicalPosition {
  blockIndex: number;
  listItemIndex?: number;
  inlineIndex: number;
  offset: number;
}

/** Parse image mode and size from CSS class names — shared by parseHTML and the component. */
export function parseImageClassNames(className: string): {
  mode: 'content' | 'theater' | 'float' | 'custom';
  size: 'auto' | 'small' | 'medium' | 'large';
} {
  let mode: 'content' | 'theater' | 'float' | 'custom' = 'content';
  if (className.includes('sh-editor-img-theater')) mode = 'theater';
  else if (className.includes('sh-editor-img-float')) mode = 'float';
  else if (className.includes('sh-editor-img-custom') || className.includes('sh-editor-img-auto')) mode = 'custom';

  let size: 'auto' | 'small' | 'medium' | 'large' = 'auto';
  if (className.includes('sh-editor-img-size-small')) size = 'small';
  else if (className.includes('sh-editor-img-size-medium')) size = 'medium';
  else if (className.includes('sh-editor-img-size-large')) size = 'large';

  return { mode, size };
}

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
export function jsonToHTML(
  doc: ShipEditorDocument,
  registry: ShipEditorRegistry = ShipEditorRegistry.getInstance()
): string {
  if (!doc || !Array.isArray(doc)) return '';

  return doc
    .map((block) => {
      const ext = registry.getBlock(block.type);
      if (!ext) return '';

      let contentHtml = '';
      if (block.content && block.content.length > 0) {
        const firstChild = block.content[0];
        if (firstChild && 'type' in firstChild && firstChild.type === 'text') {
          contentHtml = inlineToHTML(block.content as ShipEditorInlineNode[], registry);
        } else {
          contentHtml = jsonToHTML(block.content as ShipEditorBlock[], registry);
        }
      }

      if (ext.toHTML) {
        return ext.toHTML(block, contentHtml);
      }
      return '';
    })
    .join('');
}

export function inlineToHTML(
  nodes: ShipEditorInlineNode[],
  registry: ShipEditorRegistry = ShipEditorRegistry.getInstance()
): string {
  if (!nodes || !Array.isArray(nodes)) return '';

  return nodes
    .map((node) => {
      let text = escapeHTML(node.text || '');
      if (!node.marks) return text;

      node.marks.forEach((mark) => {
        const ext = registry.getMark(mark.type);
        if (ext) {
          if (ext.toHTML) {
            text = ext.toHTML(mark, text);
          } else {
            const classAttr = ext.className ? ` class="${ext.className}"` : '';
            text = `<${ext.tagName}${classAttr}>${text}</${ext.tagName}>`;
          }
        }
      });

      return text;
    })
    .join('');
}

/**
 * Ultra-lightweight HTML sanitizer designed to scrub common script elements
 * and inline event listeners prior to executing internal DOM conversions.
 */
export function sanitizeHTML(rawHtml: string): string {
  if (!rawHtml) return '';

  // DOMParser check for SSR safety
  if (typeof DOMParser === 'undefined') {
    return rawHtml; // Fallback for SSR
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  const body = doc.body;

  const allowedTags = new Set([
    'p',
    'div',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'pre',
    'code',
    'ul',
    'ol',
    'li',
    'hr',
    'img',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'del',
    'a',
    'span',
    'mark',
    'code',
    's',
    'del',
    'strike',
    'br',
  ]);

  // Include tags from registered extensions
  ShipEditorRegistry.getInstance()
    .getAllMarks()
    .forEach((ext) => {
      if (ext.tagName) allowedTags.add(ext.tagName.toLowerCase());
    });

  const allowedAttributes: Record<string, string[]> = {
    '*': ['class', 'style', 'data-block-index', 'data-item-index'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    a: ['href', 'target', 'rel'],
    code: ['language'],
    pre: ['language'],
  };

  const sanitizeNode = (node: Node) => {
    if (node.nodeType === 3) return; // Text node
    if (node.nodeType !== 1) {
      node.parentNode?.removeChild(node);
      return;
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (!allowedTags.has(tag)) {
      // For security, remove unknown or blacklisted tags entirely
      el.parentNode?.removeChild(el);
      return;
    }

    // Sanitize attributes
    const attrs = Array.from(el.attributes);
    const allowedForTag = allowedAttributes[tag] || [];
    const globalAllowed = allowedAttributes['*'] || [];

    for (const attr of attrs) {
      const name = attr.name.toLowerCase();

      // 1. Check if attribute is in the allow-list
      if (!allowedForTag.includes(name) && !globalAllowed.includes(name)) {
        el.removeAttribute(attr.name);
        continue;
      }

      // 2. Block dangerous protocols in URI-based attributes
      if (name === 'href' || name === 'src') {
        const value = attr.value.toLowerCase().trim();
        // Block javascript: and data:text/html protocols
        if (value.startsWith('javascript:') || value.replace(/\s/g, '').includes('data:text/html')) {
          el.setAttribute(attr.name, '#');
        }
      }

      // 3. Strict CSS Property Sanitization
      // We only allow layout-neutral styles like text-align which the editor uses
      if (name === 'style') {
        const style = el.style;
        const textAlign = style.textAlign;
        el.removeAttribute('style');
        if (textAlign) {
          el.style.textAlign = textAlign;
        }
      }

      // 4. Final safety check: block any attribute starting with 'on' (event handlers)
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    }

    // Recursive sanitization of children
    const children = Array.from(el.childNodes);
    for (const child of children) {
      sanitizeNode(child);
    }
  };

  const children = Array.from(body.childNodes);
  for (const child of children) {
    sanitizeNode(child);
  }

  return body.innerHTML;
}

// HTML => JSON Converter
export function htmlToJSON(
  html: string,
  docObj: Document = globalThis.document,
  registry: ShipEditorRegistry = ShipEditorRegistry.getInstance()
): ShipEditorDocument {
  const doc: ShipEditorDocument = [];
  const temp = docObj.createElement('div');

  // Clean markup before assigning it to the DOM tree
  temp.innerHTML = sanitizeHTML(html);

  const children = Array.from(temp.childNodes);
  for (const node of children) {
    if (node.nodeType === 1) {
      // Node.ELEMENT_NODE
      const el = node as HTMLElement;
      let parsed: ShipEditorBlock | null = null;
      for (const ext of registry.getAllBlocks()) {
        if (ext.parseHTML) {
          parsed = ext.parseHTML(el);
          if (parsed) break;
        }
      }
      if (parsed) {
        doc.push(parsed);
      } else {
        doc.push({
          type: 'paragraph',
          content: parseInlineNodes(el, registry),
        });
      }
    } else if (node.nodeType === 3) {
      // Node.TEXT_NODE
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

export function getAlign(el: HTMLElement): 'left' | 'center' | 'right' | undefined {
  const align = el.style.textAlign || el.getAttribute('align');
  if (align === 'center' || align === 'right' || align === 'left') {
    return align;
  }
  return undefined;
}

export function parseListItems(
  listEl: HTMLElement,
  registry: ShipEditorRegistry = ShipEditorRegistry.getInstance()
): ShipEditorBlock[] {
  const items: ShipEditorBlock[] = [];
  for (const child of Array.from(listEl.childNodes)) {
    if (child.nodeType === 1 && (child as HTMLElement).tagName.toLowerCase() === 'li') {
      // Node.ELEMENT_NODE
      items.push({
        type: 'list-item',
        content: parseInlineNodes(child as HTMLElement, registry),
      });
    }
  }
  return items;
}

export function parseInlineNodes(
  parentEl: HTMLElement,
  registry: ShipEditorRegistry = ShipEditorRegistry.getInstance()
): ShipEditorInlineNode[] {
  const inlineNodes: ShipEditorInlineNode[] = [];

  const traverse = (node: Node, marks: ShipEditorMark[]) => {
    if (node.nodeType === 3) {
      // Node.TEXT_NODE
      const text = node.textContent || '';
      if (text) {
        inlineNodes.push({
          type: 'text',
          text,
          marks: marks.length > 0 ? [...marks] : undefined,
        });
      }
    } else if (node.nodeType === 1) {
      // Node.ELEMENT_NODE
      const el = node as HTMLElement;
      const currentMarks = [...marks];

      // Check registered mark extensions
      for (const ext of registry.getAllMarks()) {
        const parsed = ext.parseHTML ? ext.parseHTML(el) : null;
        if (parsed) {
          currentMarks.push(parsed);
          break; // Avoid double-matching for the same element
        } else if (!ext.parseHTML) {
          const tagName = el.tagName.toLowerCase();
          if (tagName === ext.tagName.toLowerCase()) {
            if (!ext.className || el.classList.contains(ext.className)) {
              currentMarks.push({ type: ext.type });
              break;
            }
          }
        }
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

/**
 * JSON => Markdown Converter
 * Unifies the output pipeline by using the same AST source as the HTML converter.
 */
export function jsonToMarkdown(
  doc: ShipEditorDocument,
  registry: ShipEditorRegistry = ShipEditorRegistry.getInstance()
): string {
  if (!doc || !Array.isArray(doc)) return '';

  return doc
    .map((block) => {
      const ext = registry.getBlock(block.type);

      let contentMd = '';
      if (block.content) {
        const firstChild = block.content[0];
        if (firstChild && 'type' in firstChild && firstChild.type === 'text') {
          contentMd = inlineToMarkdown(block.content as ShipEditorInlineNode[], registry);
        } else {
          // Pass the list type/index down for list items
          contentMd = (block.content as ShipEditorBlock[])
            .map((item, idx) => {
              let prefix = '';
              if (block.type === 'bullet-list') prefix = '* ';
              if (block.type === 'ordered-list') prefix = `${idx + 1}. `;

              const itemContent = jsonToMarkdown([item], registry);
              return prefix + itemContent.trim() + '\n';
            })
            .join('');
        }
      }

      // Use extension override if available
      if (ext && ext.toMarkdown) {
        return ext.toMarkdown(block, contentMd);
      }

      // Default mappings
      switch (block.type) {
        case 'paragraph':
          return contentMd + '\n\n';
        case 'heading': {
          const level = block.attrs?.level || 1;
          return '#'.repeat(level) + ' ' + contentMd + '\n\n';
        }
        case 'quote':
          return '> ' + contentMd.replace(/\n/g, '\n> ') + '\n\n';
        case 'code-block':
          return '```' + (block.attrs?.language || '') + '\n' + contentMd.trim() + '\n```\n\n';
        case 'bullet-list':
          return contentMd + '\n';
        case 'ordered-list':
          return contentMd + '\n';
        case 'list-item':
          return contentMd; // Parent list handles the prefix
        case 'horizontal-rule':
          return '---\n\n';
        case 'image': {
          const src = block.attrs?.src || '';
          const alt = block.attrs?.alt || '';
          return `![${alt}](${src})\n\n`;
        }
        default:
          return contentMd + '\n\n';
      }
    })
    .join('');
}

export function inlineToMarkdown(
  nodes: ShipEditorInlineNode[],
  registry: ShipEditorRegistry = ShipEditorRegistry.getInstance()
): string {
  if (!nodes || !Array.isArray(nodes)) return '';

  return nodes
    .map((node) => {
      let text = node.text || '';
      if (!node.marks) return text;

      // Apply marks in order
      node.marks.forEach((mark) => {
        const ext = registry.getMark(mark.type);
        if (ext && ext.toMarkdown) {
          text = ext.toMarkdown(mark, text);
          return;
        }

        // Default mappings
        switch (mark.type) {
          case 'bold':
            text = `**${text}**`;
            break;
          case 'italic':
            text = `*${text}*`;
            break;
          case 'underline':
            text = `<u>${text}</u>`;
            break;
          case 'strikethrough':
            text = `~~${text}~~`;
            break;
          case 'code':
            text = `\`${text}\``;
            break;
          case 'link':
            text = `[${text}](${mark.attrs?.['href'] || ''})`;
            break;
        }
      });
      return text;
    })
    .join('');
}

export function htmlToMarkdown(
  html: string,
  docObj: Document = globalThis.document,
  registry: ShipEditorRegistry = ShipEditorRegistry.getInstance()
): string {
  // UNIFICATION: Parse HTML to AST first, then AST to Markdown
  const ast = htmlToJSON(html, docObj, registry);
  return jsonToMarkdown(ast, registry).trim();
}

export function elementToMarkdownInline(parentEl: HTMLElement): string {
  let md = '';

  const traverse = (node: Node) => {
    if (node.nodeType === 3) {
      // Node.TEXT_NODE
      md += node.textContent || '';
    } else if (node.nodeType === 1) {
      // Node.ELEMENT_NODE
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
export function markdownToHTML(
  markdown: string,
  registry: ShipEditorRegistry = ShipEditorRegistry.getInstance()
): string {
  if (!markdown) return '';

  // REFINED: Parse lines sequentially to safeguard code blocks
  const lines = markdown.split('\n');
  const blocks: string[] = [];
  let currentBlock: string[] = [];
  let isInsideCodeFence = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      isInsideCodeFence = !isInsideCodeFence;
    }

    if (!isInsideCodeFence && line.trim() === '') {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

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
      const bLines = block.split('\n');
      const firstLine = bLines[0];
      const lang = firstLine.replace('```', '').trim();
      const codeLines = bLines.slice(1, bLines.length - (bLines[bLines.length - 1] === '```' ? 1 : 0));
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
      if (!block.content) return '';

      if (['bullet-list', 'ordered-list'].includes(block.type)) {
        const content = block.content as ShipEditorBlock[];
        return getJSONText(content);
      }

      // Default: assume content is ShipEditorInlineNode[]
      const content = block.content as ShipEditorInlineNode[];
      return content.map((node) => node.text || '').join('');
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
    if (current.nodeType === 1 && (current as HTMLElement).tagName === tagName) {
      // Node.ELEMENT_NODE
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

export function getTextNodesInRange(range: Range): Text[] {
  const textNodes: Text[] = [];
  const commonAncestor = range.commonAncestorContainer;

  if (commonAncestor.nodeType === 3) {
    // Node.TEXT_NODE
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

// Helper to find a block or nested list item block in a document
export function getTargetBlock(
  doc: ShipEditorDocument,
  blockIndex: number,
  listItemIndex?: number
): ShipEditorBlock | null {
  const block = doc[blockIndex];
  if (!block) return null;

  if ((block.type === 'bullet-list' || block.type === 'ordered-list') && typeof listItemIndex === 'number') {
    const items = block.content as ShipEditorBlock[];
    return items?.[listItemIndex] || null;
  }

  return block;
}

/**
 * Fast shallow-clone for a ShipEditorDocument.
 *
 * Recursively copies every block and its content array so mutations on the
 * returned tree never affect the original.  Unlike `structuredClone`, this
 * avoids the full serialisation round-trip and runs significantly faster on
 * large documents during rapid keydown loops.
 */
export function cloneDoc(doc: ShipEditorDocument): ShipEditorDocument {
  // Use native structuredClone for deep cloning if available (very fast in modern browsers)
  if (typeof structuredClone === 'function') {
    return structuredClone(doc);
  }
  // Fallback to manual recursive clone
  return doc.map((block) => cloneBlock(block));
}

function cloneBlock(block: ShipEditorBlock): ShipEditorBlock {
  const copy: ShipEditorBlock = { ...block };
  if (block.attrs) {
    copy.attrs = { ...block.attrs };
  }
  if (block.content) {
    // Content is either ShipEditorInlineNode[] or ShipEditorBlock[]
    if (block.content.length > 0 && 'text' in block.content[0]) {
      // Inline nodes – shallow-copy each node and its marks array
      copy.content = (block.content as ShipEditorInlineNode[]).map((node) => ({
        ...node,
        marks: node.marks
          ? [...node.marks.map((m) => ({ ...m, attrs: m.attrs ? { ...m.attrs } : undefined }))]
          : undefined,
      }));
    } else {
      // Nested blocks (e.g. list items) – recurse
      copy.content = (block.content as ShipEditorBlock[]).map((child) => cloneBlock(child));
    }
  }
  return copy;
}

// Functional AST Operations
export function insertText(doc: ShipEditorDocument, position: LogicalPosition, text: string): ShipEditorDocument {
  // Clone doc to avoid mutating the original
  const newDoc = cloneDoc(doc);
  const block = getTargetBlock(newDoc, position.blockIndex, position.listItemIndex);
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

export function deleteRange(doc: ShipEditorDocument, from: LogicalPosition, to: LogicalPosition): ShipEditorDocument {
  const newDoc = cloneDoc(doc);
  if (from.blockIndex !== to.blockIndex || from.listItemIndex !== to.listItemIndex) {
    // Multi-block / multi-item deletion fallback
    return newDoc;
  }

  const block = getTargetBlock(newDoc, from.blockIndex, from.listItemIndex);
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
  const newDoc = cloneDoc(doc);
  if (from.blockIndex !== to.blockIndex || from.listItemIndex !== to.listItemIndex) return newDoc;

  const block = getTargetBlock(newDoc, from.blockIndex, from.listItemIndex);
  if (!block || !block.content) return newDoc;

  const content = block.content as ShipEditorInlineNode[];
  if (from.inlineIndex === to.inlineIndex) {
    const node = content[from.inlineIndex];
    if (node) {
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
  const newDoc = cloneDoc(doc);
  if (from.blockIndex !== to.blockIndex || from.listItemIndex !== to.listItemIndex) return newDoc;

  const block = getTargetBlock(newDoc, from.blockIndex, from.listItemIndex);
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

export function mapDOMPositionToLogical(editor: HTMLElement, node: Node, offset: number): LogicalPosition | null {
  if (!editor.contains(node)) return null;

  // OPTIMIZATION: Use closest() to find the block element via metadata attribute (O(1))
  let topBlockEl = (node.nodeType === 1 ? (node as HTMLElement) : node.parentElement)?.closest('[data-block-index]');

  if (!topBlockEl || !editor.contains(topBlockEl)) {
    // Fallback: find the direct child of the editor that contains the node (Core robustness)
    let curr: Node | null = node;
    while (curr && curr.parentElement && curr.parentElement !== editor) {
      curr = curr.parentElement;
    }
    if (curr && curr.parentElement === editor && curr.nodeType === 1) {
      topBlockEl = curr as HTMLElement;
    } else {
      // Fallback for direct clicks on the editor container boundary
      if (node === editor) {
        return {
          blockIndex: Math.min(offset, editor.children.length),
          inlineIndex: 0,
          offset: 0,
        };
      }
      return null;
    }
  }

  const blockIndex = topBlockEl.hasAttribute('data-block-index')
    ? parseInt(topBlockEl.getAttribute('data-block-index') || '0', 10)
    : Array.from(editor.children).indexOf(topBlockEl);

  let listItemIndex: number | undefined = undefined;
  let targetEl: HTMLElement = topBlockEl as HTMLElement;

  // OPTIMIZATION: Use closest() to find list items via metadata attribute (O(1))
  let liEl = (node.nodeType === 1 ? (node as HTMLElement) : node.parentElement)?.closest('[data-item-index]');
  if (liEl && topBlockEl.contains(liEl)) {
    listItemIndex = parseInt(liEl.getAttribute('data-item-index') || '0', 10);
    targetEl = liEl as HTMLElement;
  } else if (!liEl && ['ul', 'ol'].includes(topBlockEl.tagName.toLowerCase())) {
    // Fallback: search for LI child (Core robustness)
    let curr: Node | null = node;
    while (curr && curr.parentElement && curr.parentElement !== topBlockEl) {
      curr = curr.parentElement;
    }
    if (curr && curr.parentElement === topBlockEl && curr.nodeType === 1 && (curr as HTMLElement).tagName.toLowerCase() === 'li') {
      const liItem = curr as HTMLElement;
      listItemIndex = Array.from(topBlockEl.children).indexOf(liItem);
      targetEl = liItem;
    }
  }

  // OPTIMIZATION: Use TreeWalker for faster text node discovery (browser-optimized)
  const walker = document.createTreeWalker(targetEl, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    textNodes.push(n as Text);
  }

  if (node.nodeType === 3) {
    const inlineIndex = textNodes.indexOf(node as Text);
    if (inlineIndex !== -1) {
      return {
        blockIndex,
        listItemIndex,
        inlineIndex,
        offset,
      };
    }
  }

  // Fallback if not inside a text node
  return {
    blockIndex,
    listItemIndex,
    inlineIndex: 0,
    offset: 0,
  };
}

export function mapLogicalToDOMPosition(
  editor: HTMLElement,
  pos: LogicalPosition,
  doc: ShipEditorDocument
): { node: Node; offset: number } | null {
  // OPTIMIZATION: Direct lookup by data-attribute (O(1))
  let topBlockEl = editor.querySelector(`[data-block-index="${pos.blockIndex}"]`) as HTMLElement;
  if (!topBlockEl) {
    // Fallback: search by child index
    topBlockEl = editor.children[pos.blockIndex] as HTMLElement;
  }

  if (!topBlockEl) return null;

  let targetEl: HTMLElement = topBlockEl;
  if (typeof pos.listItemIndex === 'number') {
    let liEl = topBlockEl.querySelector(`[data-item-index="${pos.listItemIndex}"]`) as HTMLElement;
    if (!liEl) {
      // Fallback: search within the list (ul or ol)
      const tag = topBlockEl.tagName.toLowerCase();
      const listEl = ['ul', 'ol'].includes(tag) ? topBlockEl : topBlockEl.querySelector('ul, ol');
      if (listEl) {
        liEl = listEl.children[pos.listItemIndex] as HTMLElement;
      }
    }
    if (liEl) {
      targetEl = liEl;
    }
  }

  // OPTIMIZATION: Use TreeWalker for faster text node discovery
  const walker = document.createTreeWalker(targetEl, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    textNodes.push(n as Text);
  }

  if (textNodes.length > 0) {
    const txtNode = textNodes[Math.min(pos.inlineIndex, textNodes.length - 1)];
    const len = txtNode.textContent?.length || 0;
    return {
      node: txtNode,
      offset: Math.min(pos.offset, len),
    };
  }

  // REFINED FALLBACK: Enforce selection focus on the explicit <br> element node if available
  const brElement = targetEl.querySelector('br');
  if (brElement) {
    return { node: brElement, offset: 0 };
  }

  const firstChild = targetEl.firstChild;
  if (firstChild) {
    return { node: firstChild, offset: 0 };
  }

  return { node: targetEl, offset: 0 };
}

// Convert a LogicalPosition to a block-relative character offset
export function getBlockRelativeOffset(pos: LogicalPosition, doc: ShipEditorDocument): number {
  const block = getTargetBlock(doc, pos.blockIndex, pos.listItemIndex);
  if (!block || !block.content) return 0;

  const content = block.content as ShipEditorInlineNode[];
  let offset = 0;
  for (let i = 0; i < Math.min(pos.inlineIndex, content.length); i++) {
    offset += content[i].text.length;
  }
  offset += pos.offset;
  return offset;
}

// Convert a block-relative character offset back to a LogicalPosition
export function getLogicalFromBlockRelative(
  blockIndex: number,
  listItemIndex: number | undefined,
  charOffset: number,
  doc: ShipEditorDocument
): LogicalPosition {
  const block = getTargetBlock(doc, blockIndex, listItemIndex);
  if (!block || !block.content || block.content.length === 0) {
    return { blockIndex, listItemIndex, inlineIndex: 0, offset: 0 };
  }

  const content = block.content as ShipEditorInlineNode[];
  let remaining = charOffset;
  for (let i = 0; i < content.length; i++) {
    const len = content[i].text.length;
    if (remaining <= len) {
      return {
        blockIndex,
        listItemIndex,
        inlineIndex: i,
        offset: remaining,
      };
    }
    remaining -= len;
  }

  // Fallback to the very end of the block
  return {
    blockIndex,
    listItemIndex,
    inlineIndex: content.length - 1,
    offset: content[content.length - 1].text.length,
  };
}

/**
 * Centralised caret/selection manager for the ShipEditor.
 *
 * Provides a single source of truth for reading, saving, restoring,
 * and applying cursor positions — eliminating duplicated boilerplate
 * across runTransaction, updateStateAndCaret, saveAndRestoreSelection,
 * restoreHistoryState, executeCommand, and modal flows.
 */
export interface EditorSelectionState {
  start: LogicalPosition;
  end: LogicalPosition | null;
  isCollapsed: boolean;
}

export class EditorSelection {
  /**
   * Read the current browser selection and map it to logical positions.
   * Returns null if the selection is not inside the editor.
   */
  static read(editor: HTMLElement): EditorSelectionState | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return null;

    const start = mapDOMPositionToLogical(editor, range.startContainer, range.startOffset);
    if (!start) return null;

    const isCollapsed = range.collapsed;
    const end = isCollapsed ? null : mapDOMPositionToLogical(editor, range.endContainer, range.endOffset);

    return { start, end, isCollapsed };
  }

  /**
   * Apply a logical position (or selection range) to the browser DOM.
   * Handles DOM mapping, range creation, error handling, and
   * optional scroll-into-view in one place.
   */
  static apply(
    editor: HTMLElement,
    doc: ShipEditorDocument,
    position: LogicalPosition,
    endPosition?: LogicalPosition | null,
    options?: { scrollIntoView?: boolean }
  ): boolean {
    const selection = window.getSelection();
    if (!selection) return false;

    const startDom = mapLogicalToDOMPosition(editor, position, doc);
    if (!startDom) return false;

    try {
      const range = document.createRange();
      range.setStart(startDom.node, startDom.offset);

      if (endPosition) {
        const endDom = mapLogicalToDOMPosition(editor, endPosition, doc);
        if (endDom) {
          range.setEnd(endDom.node, endDom.offset);
        } else {
          range.collapse(true);
        }
      } else {
        range.collapse(true);
      }

      selection.removeAllRanges();
      selection.addRange(range);

      if (options?.scrollIntoView) {
        const caretRect = range.getBoundingClientRect();
        const editorRect = editor.getBoundingClientRect();
        if (caretRect.bottom > editorRect.bottom) {
          editor.scrollTop += caretRect.bottom - editorRect.bottom + 4;
        } else if (caretRect.top < editorRect.top) {
          editor.scrollTop -= editorRect.top - caretRect.top + 4;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save the current DOM selection as a cloned Range.
   * Used for modal operations where the editor loses focus.
   */
  static saveRange(editor: HTMLElement): Range | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return null;

    return range.cloneRange();
  }

  /**
   * Restore a previously saved Range to the browser selection.
   */
  static restoreRange(range: Range | null): boolean {
    if (!range) return false;
    const selection = window.getSelection();
    if (!selection) return false;

    try {
      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Map selection positions from the pre-mutation document to the post-mutation document.
   *
   * Converts logical positions to character offsets (stable across inline node splits),
   * optionally remaps block indices (for list toggle, block wrapping, etc.),
   * then converts back to LogicalPositions in the new document.
   *
   * Returns start/end LogicalPositions ready for EditorSelection.apply().
   */
  static mapAcrossMutation(
    startLogical: LogicalPosition,
    endLogical: LogicalPosition,
    docBefore: ShipEditorDocument,
    docAfter: ShipEditorDocument,
    selectionShift?: {
      start: { blockIndex: number; listItemIndex?: number };
      end: { blockIndex: number; listItemIndex?: number };
    }
  ): { start: LogicalPosition; end: LogicalPosition } {
    const startOffset = getBlockRelativeOffset(startLogical, docBefore);
    const endOffset = getBlockRelativeOffset(endLogical, docBefore);

    const startBlockIdx = selectionShift ? selectionShift.start.blockIndex : startLogical.blockIndex;
    const startListItemIdx = selectionShift ? selectionShift.start.listItemIndex : startLogical.listItemIndex;
    const endBlockIdx = selectionShift ? selectionShift.end.blockIndex : endLogical.blockIndex;
    const endListItemIdx = selectionShift ? selectionShift.end.listItemIndex : endLogical.listItemIndex;

    return {
      start: getLogicalFromBlockRelative(startBlockIdx, startListItemIdx, startOffset, docAfter),
      end: getLogicalFromBlockRelative(endBlockIdx, endListItemIdx, endOffset, docAfter),
    };
  }
}

export function splitBlock(
  doc: ShipEditorDocument,
  position: LogicalPosition
): { doc: ShipEditorDocument; newPosition: LogicalPosition } {
  const newDoc = cloneDoc(doc);

  let topBlock = newDoc[position.blockIndex];
  if (!topBlock) return { doc: newDoc, newPosition: position };

  let blockToSplit = topBlock;
  let isList = topBlock.type === 'bullet-list' || topBlock.type === 'ordered-list';
  let listItemIdx = position.listItemIndex;

  if (isList && typeof listItemIdx === 'number') {
    const items = topBlock.content as ShipEditorBlock[];
    if (items && items[listItemIdx]) {
      blockToSplit = items[listItemIdx];

      // Check if current list item is empty -> exit list
      const text = getJSONText([blockToSplit]).trim();
      if (text === '') {
        items.splice(listItemIdx, 1);
        const newParagraph: ShipEditorBlock = {
          type: 'paragraph',
          content: [],
        };
        let nextBlockIdx = position.blockIndex + 1;
        newDoc.splice(nextBlockIdx, 0, newParagraph);
        if (items.length === 0) {
          newDoc.splice(position.blockIndex, 1);
          nextBlockIdx = position.blockIndex;
        }
        return {
          doc: newDoc,
          newPosition: {
            blockIndex: nextBlockIdx,
            inlineIndex: 0,
            offset: 0,
          },
        };
      }
    }
  }

  // Check if quote block is empty -> exit quote
  if (topBlock.type === 'quote') {
    const text = getJSONText([topBlock]).trim();
    if (text === '') {
      topBlock.type = 'paragraph';
      return {
        doc: newDoc,
        newPosition: {
          blockIndex: position.blockIndex,
          inlineIndex: 0,
          offset: 0,
        },
      };
    }
  }

  const content = (blockToSplit.content as ShipEditorInlineNode[]) || [];
  const leftContent: ShipEditorInlineNode[] = [];
  const rightContent: ShipEditorInlineNode[] = [];

  for (let i = 0; i < content.length; i++) {
    const node = content[i];
    if (i < position.inlineIndex) {
      leftContent.push(node);
    } else if (i === position.inlineIndex) {
      const offset = Math.min(position.offset, node.text.length);
      const leftText = node.text.substring(0, offset);
      const rightText = node.text.substring(offset);

      if (leftText) {
        leftContent.push({ ...node, text: leftText });
      }
      if (rightText || (i === content.length - 1 && leftText === '')) {
        rightContent.push({ ...node, text: rightText });
      }
    } else {
      rightContent.push(node);
    }
  }

  blockToSplit.content = leftContent;

  const newBlock: ShipEditorBlock = {
    type: blockToSplit.type === 'list-item' ? 'list-item' : 'paragraph',
    content: rightContent,
  };

  let newPosition: LogicalPosition;

  if (isList && typeof listItemIdx === 'number') {
    const items = topBlock.content as ShipEditorBlock[];
    items.splice(listItemIdx + 1, 0, newBlock);
    newPosition = {
      blockIndex: position.blockIndex,
      listItemIndex: listItemIdx + 1,
      inlineIndex: 0,
      offset: 0,
    };
  } else {
    newBlock.type = 'paragraph';
    newDoc.splice(position.blockIndex + 1, 0, newBlock);
    newPosition = {
      blockIndex: position.blockIndex + 1,
      inlineIndex: 0,
      offset: 0,
    };
  }

  return { doc: newDoc, newPosition };
}

export function mergeBlocks(
  doc: ShipEditorDocument,
  position: LogicalPosition
): { doc: ShipEditorDocument; newPosition: LogicalPosition } {
  const newDoc = cloneDoc(doc);

  if (
    position.blockIndex === 0 &&
    position.listItemIndex === undefined &&
    position.inlineIndex === 0 &&
    position.offset === 0
  ) {
    return { doc: newDoc, newPosition: position };
  }

  let newPosition = { ...position };

  if (typeof position.listItemIndex === 'number') {
    const listBlock = newDoc[position.blockIndex];
    if (!listBlock) return { doc: newDoc, newPosition: position };
    const items = listBlock.content as ShipEditorBlock[];
    const currentItem = items[position.listItemIndex];

    // HARDENING: If item is empty, outdent it instead of merging
    if (currentItem && getJSONText([currentItem]).trim() === '') {
      items.splice(position.listItemIndex, 1);
      const p: ShipEditorBlock = { type: 'paragraph', content: [] };
      newDoc.splice(position.blockIndex + 1, 0, p);
      if (items.length === 0) newDoc.splice(position.blockIndex, 1);
      return {
        doc: newDoc,
        newPosition: { blockIndex: position.blockIndex, inlineIndex: 0, offset: 0 },
      };
    }

    if (position.listItemIndex === 0) {
      if (position.blockIndex === 0) return { doc: newDoc, newPosition: position };

      const prevBlock = newDoc[position.blockIndex - 1];
      const currentItem = items[0];
      if (prevBlock && currentItem) {
        if (prevBlock.type === 'bullet-list' || prevBlock.type === 'ordered-list') {
          const prevItems = prevBlock.content as ShipEditorBlock[];
          const lastItem = prevItems[prevItems.length - 1];
          if (lastItem) {
            const lastItemContent = (lastItem.content as ShipEditorInlineNode[]) || [];
            const targetInlineIndex = Math.max(0, lastItemContent.length - 1);
            const targetOffset = lastItemContent[targetInlineIndex]?.text.length || 0;

            lastItem.content = [...lastItemContent, ...((currentItem.content as ShipEditorInlineNode[]) || [])];
            items.shift();
            if (items.length === 0) {
              newDoc.splice(position.blockIndex, 1);
            }

            newPosition = {
              blockIndex: position.blockIndex - 1,
              listItemIndex: prevItems.length - 1,
              inlineIndex: targetInlineIndex,
              offset: targetOffset,
            };
          }
        } else {
          const prevContent = (prevBlock.content as ShipEditorInlineNode[]) || [];
          const targetInlineIndex = Math.max(0, prevContent.length - 1);
          const targetOffset = prevContent[targetInlineIndex]?.text.length || 0;

          prevBlock.content = [...prevContent, ...((currentItem.content as ShipEditorInlineNode[]) || [])];
          items.shift();
          if (items.length === 0) {
            newDoc.splice(position.blockIndex, 1);
          }

          newPosition = {
            blockIndex: position.blockIndex - 1,
            inlineIndex: targetInlineIndex,
            offset: targetOffset,
          };
        }
      }
    } else {
      const prevItem = items[position.listItemIndex - 1];
      const currentItem = items[position.listItemIndex];
      if (prevItem && currentItem) {
        const prevContent = (prevItem.content as ShipEditorInlineNode[]) || [];
        const targetInlineIndex = Math.max(0, prevContent.length - 1);
        const targetOffset = prevContent[targetInlineIndex]?.text.length || 0;

        prevItem.content = [...prevContent, ...((currentItem.content as ShipEditorInlineNode[]) || [])];
        items.splice(position.listItemIndex, 1);

        newPosition = {
          blockIndex: position.blockIndex,
          listItemIndex: position.listItemIndex - 1,
          inlineIndex: targetInlineIndex,
          offset: targetOffset,
        };
      }
    }
  } else {
    const prevBlock = newDoc[position.blockIndex - 1];
    const currentBlock = newDoc[position.blockIndex];
    if (prevBlock && currentBlock) {
      if (prevBlock.type === 'bullet-list' || prevBlock.type === 'ordered-list') {
        const items = prevBlock.content as ShipEditorBlock[];
        const lastItem = items[items.length - 1];
        if (lastItem) {
          const lastItemContent = (lastItem.content as ShipEditorInlineNode[]) || [];
          const targetInlineIndex = Math.max(0, lastItemContent.length - 1);
          const targetOffset = lastItemContent[targetInlineIndex]?.text.length || 0;

          lastItem.content = [...lastItemContent, ...((currentBlock.content as ShipEditorInlineNode[]) || [])];
          newDoc.splice(position.blockIndex, 1);

          newPosition = {
            blockIndex: position.blockIndex - 1,
            listItemIndex: items.length - 1,
            inlineIndex: targetInlineIndex,
            offset: targetOffset,
          };
        }
      } else {
        const prevContent = (prevBlock.content as ShipEditorInlineNode[]) || [];
        const targetInlineIndex = Math.max(0, prevContent.length - 1);
        const targetOffset = prevContent[targetInlineIndex]?.text.length || 0;

        prevBlock.content = [...prevContent, ...((currentBlock.content as ShipEditorInlineNode[]) || [])];
        newDoc.splice(position.blockIndex, 1);

        newPosition = {
          blockIndex: position.blockIndex - 1,
          inlineIndex: targetInlineIndex,
          offset: targetOffset,
        };
      }
    }
  }

  return { doc: newDoc, newPosition };
}

/**
 * Delete-key counterpart of mergeBlocks (Backspace).
 *
 * When the caret is at the end of a block, merges the next block's content
 * into the current block. The caret stays at the same logical position.
 */
export function mergeBlockForward(
  doc: ShipEditorDocument,
  position: LogicalPosition
): { doc: ShipEditorDocument; newPosition: LogicalPosition } {
  const newDoc = cloneDoc(doc);
  const block = getTargetBlock(newDoc, position.blockIndex, position.listItemIndex);

  // Only merge if caret is at the very end of the block's text content
  if (!block) return { doc: newDoc, newPosition: position };

  const content = (block.content as ShipEditorInlineNode[]) || [];
  const lastInlineIndex = Math.max(0, content.length - 1);
  const lastInlineLength = content[lastInlineIndex]?.text?.length || 0;

  const isAtEnd = position.inlineIndex >= lastInlineIndex && position.offset >= lastInlineLength;
  if (!isAtEnd) return { doc: newDoc, newPosition: position };

  // Build the "start of next block" position and delegate to mergeBlocks
  let nextPosition: LogicalPosition;

  if (typeof position.listItemIndex === 'number') {
    const listBlock = newDoc[position.blockIndex];
    const items = (listBlock?.content as ShipEditorBlock[]) || [];
    if (position.listItemIndex < items.length - 1) {
      // Next list item in same list
      nextPosition = {
        blockIndex: position.blockIndex,
        listItemIndex: position.listItemIndex + 1,
        inlineIndex: 0,
        offset: 0,
      };
    } else if (position.blockIndex < newDoc.length - 1) {
      // First position in next top-level block
      const nextBlock = newDoc[position.blockIndex + 1];
      if (nextBlock && (nextBlock.type === 'bullet-list' || nextBlock.type === 'ordered-list')) {
        nextPosition = { blockIndex: position.blockIndex + 1, listItemIndex: 0, inlineIndex: 0, offset: 0 };
      } else {
        nextPosition = { blockIndex: position.blockIndex + 1, inlineIndex: 0, offset: 0 };
      }
    } else {
      // No next block — nothing to merge
      return { doc: newDoc, newPosition: position };
    }
  } else if (position.blockIndex < newDoc.length - 1) {
    const nextBlock = newDoc[position.blockIndex + 1];
    if (nextBlock && (nextBlock.type === 'bullet-list' || nextBlock.type === 'ordered-list')) {
      nextPosition = { blockIndex: position.blockIndex + 1, listItemIndex: 0, inlineIndex: 0, offset: 0 };
    } else {
      nextPosition = { blockIndex: position.blockIndex + 1, inlineIndex: 0, offset: 0 };
    }
  } else {
    // Last block — nothing to merge
    return { doc: newDoc, newPosition: position };
  }

  // Delegate to mergeBlocks which handles all the merge logic.
  // The caret position stays where it was (original position).
  const result = mergeBlocks(doc, nextPosition);
  return { doc: result.doc, newPosition: position };
}

export function areMarksEqual(m1?: ShipEditorMark[], m2?: ShipEditorMark[]): boolean {
  if (!m1 && !m2) return true;
  if (!m1 || !m2) return false;
  if (m1.length !== m2.length) return false;

  for (const mark of m1) {
    const match = m2.find((m) => m.type === mark.type);
    if (!match) return false;
    if (JSON.stringify(mark.attrs) !== JSON.stringify(match.attrs)) return false;
  }
  return true;
}

export function toggleMarkInBlockContent(
  content: ShipEditorInlineNode[],
  from: { inlineIndex: number; offset: number },
  to: { inlineIndex: number; offset: number },
  markType: string,
  add: boolean,
  attrs?: Record<string, any>
): ShipEditorInlineNode[] {
  if (content.length === 0) return content;

  const splitNodes: ShipEditorInlineNode[] = [];

  let startCharOffset = 0;
  for (let i = 0; i < from.inlineIndex; i++) {
    if (content[i]) {
      startCharOffset += content[i].text.length;
    }
  }
  startCharOffset += from.offset;

  let endCharOffset = 0;
  for (let i = 0; i < to.inlineIndex; i++) {
    if (content[i]) {
      endCharOffset += content[i].text.length;
    }
  }
  endCharOffset += to.offset;

  let accum = 0;
  for (let i = 0; i < content.length; i++) {
    const node = content[i];
    const len = node.text.length;
    const nodeStart = accum;
    const nodeEnd = accum + len;

    const splitOffsets = new Set<number>();
    if (startCharOffset > nodeStart && startCharOffset < nodeEnd) {
      splitOffsets.add(startCharOffset - nodeStart);
    }
    if (endCharOffset > nodeStart && endCharOffset < nodeEnd) {
      splitOffsets.add(endCharOffset - nodeStart);
    }

    if (splitOffsets.size > 0) {
      const sortedOffsets = Array.from(splitOffsets).sort((a, b) => a - b);
      let lastOffset = 0;
      for (const offset of sortedOffsets) {
        splitNodes.push({
          type: 'text',
          text: node.text.substring(lastOffset, offset),
          marks: node.marks ? [...node.marks] : undefined,
        });
        lastOffset = offset;
      }
      splitNodes.push({
        type: 'text',
        text: node.text.substring(lastOffset),
        marks: node.marks ? [...node.marks] : undefined,
      });
    } else {
      splitNodes.push({
        type: 'text',
        text: node.text,
        marks: node.marks ? [...node.marks] : undefined,
      });
    }
    accum += len;
  }

  let currentAccum = 0;
  for (const node of splitNodes) {
    const nodeLen = node.text.length;
    const nodeStart = currentAccum;
    const nodeEnd = currentAccum + nodeLen;

    if (nodeStart >= startCharOffset && nodeEnd <= endCharOffset && nodeLen > 0) {
      if (add) {
        if (!node.marks) node.marks = [];
        if (!node.marks.some((m) => m.type === markType)) {
          node.marks.push({ type: markType, attrs });
        } else if (attrs) {
          const existing = node.marks.find((m) => m.type === markType);
          if (existing) {
            existing.attrs = attrs;
          }
        }
      } else {
        if (node.marks) {
          node.marks = node.marks.filter((m) => m.type !== markType);
          if (node.marks.length === 0) {
            delete node.marks;
          }
        }
      }
    }
    currentAccum += nodeLen;
  }

  const normalized: ShipEditorInlineNode[] = [];
  for (const node of splitNodes) {
    if (node.text === '') continue;
    if (normalized.length > 0) {
      const last = normalized[normalized.length - 1];
      if (areMarksEqual(last.marks, node.marks)) {
        last.text += node.text;
        continue;
      }
    }
    normalized.push(node);
  }

  return normalized;
}

export function formatDocRange(
  doc: ShipEditorDocument,
  from: LogicalPosition,
  to: LogicalPosition,
  markType: string,
  action: 'add' | 'remove' | 'toggle',
  attrs?: Record<string, any>
): ShipEditorDocument {
  const newDoc = cloneDoc(doc);

  let shouldAdd = action === 'add';
  if (action === 'toggle') {
    let allHaveMark = true;
    let hasAnyText = false;
    for (let b = from.blockIndex; b <= to.blockIndex; b++) {
      const block = getTargetBlock(
        newDoc,
        b,
        b === from.blockIndex ? from.listItemIndex : b === to.blockIndex ? to.listItemIndex : undefined
      );
      if (!block || !block.content) continue;
      const content = block.content as ShipEditorInlineNode[];

      const startIdx = b === from.blockIndex ? from.inlineIndex : 0;
      const endIdx = b === to.blockIndex ? to.inlineIndex : content.length - 1;

      for (let i = startIdx; i <= endIdx; i++) {
        const node = content[i];
        if (!node || node.text.length === 0) continue;

        // Skip the starting node if the offset is at its end — it has
        // zero selected characters (the selection starts AFTER it).
        if (b === from.blockIndex && i === from.inlineIndex && from.offset >= node.text.length) continue;
        // Skip the ending node if the offset is 0 — it has zero selected characters.
        if (b === to.blockIndex && i === to.inlineIndex && to.offset === 0) continue;

        hasAnyText = true;
        if (!node.marks || !node.marks.some((m) => m.type === markType)) {
          allHaveMark = false;
          break;
        }
      }
      if (!allHaveMark) break;
    }
    shouldAdd = hasAnyText ? !allHaveMark : true;
  }

  for (let b = from.blockIndex; b <= to.blockIndex; b++) {
    const block = getTargetBlock(
      newDoc,
      b,
      b === from.blockIndex ? from.listItemIndex : b === to.blockIndex ? to.listItemIndex : undefined
    );
    if (!block || !block.content) continue;

    const content = block.content as ShipEditorInlineNode[];
    if (content.length === 0) continue;

    const blockFrom =
      b === from.blockIndex ? { inlineIndex: from.inlineIndex, offset: from.offset } : { inlineIndex: 0, offset: 0 };
    const blockTo =
      b === to.blockIndex
        ? { inlineIndex: to.inlineIndex, offset: to.offset }
        : { inlineIndex: content.length - 1, offset: content[content.length - 1]?.text.length || 0 };

    block.content = toggleMarkInBlockContent(content, blockFrom, blockTo, markType, shouldAdd, attrs);
  }

  return newDoc;
}

export function clearDocRangeFormatting(
  doc: ShipEditorDocument,
  from: LogicalPosition,
  to: LogicalPosition
): ShipEditorDocument {
  let tempDoc = doc;
  const allMarkTypes = ['bold', 'italic', 'underline', 'strike', 'code', 'link'];
  for (const markType of allMarkTypes) {
    tempDoc = formatDocRange(tempDoc, from, to, markType, 'remove');
  }
  return tempDoc;
}

export function setBlockTypeInDoc(
  doc: ShipEditorDocument,
  selection: { start: LogicalPosition; end: LogicalPosition },
  newType: ShipEditorBlock['type'],
  newAttrs: Record<string, any>
): {
  doc: ShipEditorDocument;
  selectionShift?: {
    start: { blockIndex: number; listItemIndex?: number };
    end: { blockIndex: number; listItemIndex?: number };
  };
} | null {
  const newDoc = cloneDoc(doc);
  const blockIndex = selection.start.blockIndex;
  const block = newDoc[blockIndex];
  if (!block) return null;

  // Block-level operations target only the focused block.
  // Clamp selection end to start block to prevent spill into adjacent blocks
  // (e.g. when the browser reports the full-text selection end at the next block).
  const clampedSelection = {
    start: selection.start,
    end: {
      ...selection.end,
      blockIndex: selection.start.blockIndex,
      listItemIndex: selection.end.blockIndex !== selection.start.blockIndex
        ? selection.start.listItemIndex
        : selection.end.listItemIndex,
    },
  };

  const oldType = block.type;

  if (block.attrs?.align) {
    newAttrs['align'] = block.attrs.align;
  }

  // Toggle behavior: if the block is already the target type, revert to paragraph.
  // For headings, also check the level attribute so h1→h2 is a conversion, not a toggle.
  const isSameType = oldType === newType &&
    (newType !== 'heading' || block.attrs?.level === newAttrs['level']);

  if (isSameType && newType !== 'paragraph') {
    // Detoggle: revert to paragraph, preserving alignment
    const revertAttrs: Record<string, any> = {};
    if (block.attrs?.align) revertAttrs['align'] = block.attrs.align;

    if (oldType === 'code-block') {
      const codeText = ((block.content as ShipEditorInlineNode[]) || []).map((n) => n.text || '').join('');
      block.content = [{ type: 'text', text: codeText }];
    }

    block.type = 'paragraph';
    block.attrs = revertAttrs;
  }

  let selectionShift:
    | {
        start: { blockIndex: number; listItemIndex?: number };
        end: { blockIndex: number; listItemIndex?: number };
      }
    | undefined = undefined;

  if (isSameType && newType !== 'paragraph') {
    // Already handled above — no selectionShift needed
  } else if (oldType === 'bullet-list' || oldType === 'ordered-list') {
    const listItems = block.content as ShipEditorBlock[];
    const newBlocks: ShipEditorBlock[] = listItems.map((item) => {
      let itemContent = item.content as ShipEditorInlineNode[];
      if (newType === 'code-block') {
        const plainText = itemContent.map((n) => n.text || '').join('');
        itemContent = [{ type: 'text', text: plainText }];
      }
      return {
        type: newType,
        attrs: { ...newAttrs },
        content: itemContent,
      };
    });

    if (newBlocks.length === 0) {
      newBlocks.push({
        type: newType,
        attrs: { ...newAttrs },
        content: [],
      });
    }

    newDoc.splice(blockIndex, 1, ...newBlocks);

    selectionShift = {
      start: {
        blockIndex: clampedSelection.start.blockIndex + (clampedSelection.start.listItemIndex ?? 0),
        listItemIndex: undefined,
      },
      end: {
        blockIndex: clampedSelection.end.blockIndex + (clampedSelection.end.listItemIndex ?? 0),
        listItemIndex: undefined,
      },
    };
  } else {
    if (newType === 'code-block' && oldType !== 'code-block') {
      const plainText = ((block.content as ShipEditorInlineNode[]) || []).map((n) => n.text || '').join('');
      block.content = [{ type: 'text', text: plainText }];
    } else if (oldType === 'code-block' && newType !== 'code-block') {
      const codeText = ((block.content as ShipEditorInlineNode[]) || []).map((n) => n.text || '').join('');
      block.content = [{ type: 'text', text: codeText }];
    }

    block.type = newType;
    block.attrs = newAttrs;
  }

  return {
    doc: newDoc,
    selectionShift,
  };
}

export function toggleListInDoc(
  doc: ShipEditorDocument,
  selection: { start: LogicalPosition; end: LogicalPosition },
  listType: 'ul' | 'ol'
): {
  doc: ShipEditorDocument;
  selectionShift?: {
    start: { blockIndex: number; listItemIndex?: number };
    end: { blockIndex: number; listItemIndex?: number };
  };
} | null {
  const newDoc = cloneDoc(doc);
  const startBlockIdx = selection.start.blockIndex;
  const endBlockIdx = selection.end.blockIndex;
  const block = newDoc[startBlockIdx];
  if (!block) return null;

  const astListType = listType === 'ul' ? 'bullet-list' : 'ordered-list';
  let selectionShift:
    | {
        start: { blockIndex: number; listItemIndex?: number };
        end: { blockIndex: number; listItemIndex?: number };
      }
    | undefined = undefined;

  // Multi-block selection: wrap all selected blocks as list items in a single list
  if (endBlockIdx > startBlockIdx) {
    const listItems: ShipEditorBlock[] = [];

    for (let i = startBlockIdx; i <= endBlockIdx; i++) {
      const b = newDoc[i];
      if (!b) continue;

      if (b.type === 'bullet-list' || b.type === 'ordered-list') {
        // Flatten existing list items into the new list
        const items = b.content as ShipEditorBlock[];
        for (const item of items) {
          listItems.push({
            type: 'list-item',
            content: (item.content as ShipEditorInlineNode[]) || [],
          });
        }
      } else {
        listItems.push({
          type: 'list-item',
          content: (b.content as ShipEditorInlineNode[]) || [],
        });
      }
    }

    if (listItems.length === 0) {
      listItems.push({ type: 'list-item', content: [] });
    }

    const newListBlock: ShipEditorBlock = {
      type: astListType,
      content: listItems,
    };

    const deleteCount = endBlockIdx - startBlockIdx + 1;
    newDoc.splice(startBlockIdx, deleteCount, newListBlock);

    selectionShift = {
      start: { blockIndex: startBlockIdx, listItemIndex: 0 },
      end: { blockIndex: startBlockIdx, listItemIndex: listItems.length - 1 },
    };
  }
  // Single-block: existing toggle behavior
  else if (block.type === 'bullet-list' || block.type === 'ordered-list') {
    if (block.type === astListType) {
      // Same list type → unwrap to paragraphs
      const listItems = block.content as ShipEditorBlock[];
      const newParagraphs: ShipEditorBlock[] = listItems.map((item) => ({
        type: 'paragraph',
        content: item.content as ShipEditorInlineNode[],
      }));
      if (newParagraphs.length === 0) {
        newParagraphs.push({ type: 'paragraph', content: [] });
      }
      newDoc.splice(startBlockIdx, 1, ...newParagraphs);

      selectionShift = {
        start: {
          blockIndex: startBlockIdx + (selection.start.listItemIndex ?? 0),
          listItemIndex: undefined,
        },
        end: {
          blockIndex: startBlockIdx + (selection.start.listItemIndex ?? 0),
          listItemIndex: undefined,
        },
      };
    } else {
      // Different list type → switch
      block.type = astListType;
    }
  } else {
    // Non-list block → wrap in a list
    const listItem: ShipEditorBlock = {
      type: 'list-item',
      content: (block.content as ShipEditorInlineNode[]) || [],
    };
    const newListBlock: ShipEditorBlock = {
      type: astListType,
      content: [listItem],
    };
    newDoc.splice(startBlockIdx, 1, newListBlock);

    selectionShift = {
      start: { blockIndex: startBlockIdx, listItemIndex: 0 },
      end: { blockIndex: startBlockIdx, listItemIndex: 0 },
    };
  }

  return {
    doc: newDoc,
    selectionShift,
  };
}
