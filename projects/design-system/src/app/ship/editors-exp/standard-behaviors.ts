import {
  BaseBlockBehavior,
  BaseInlineBehavior,
  ContextualAction,
  ContextualActionCtx,
  SlashCommand,
  SlashCommandCtx,
} from './editor-behaviors';
import { ALLOWED_ALIGN, SAFE_STYLE_PROPS, escapeAttr, isSafeUrl, safeStyleString } from './editor-sanitize';
import { ASTBlockNode, ASTMark } from './editor.types';

/** Render an allow-listed `text-align` style attribute, or nothing. */
function alignStyle(align: unknown): string {
  return typeof align === 'string' && ALLOWED_ALIGN.has(align) ? ` style="text-align: ${align}"` : '';
}

// =======================
// BLOCK BEHAVIORS
// =======================

export class ParagraphBehavior extends BaseBlockBehavior {
  readonly type = 'paragraph';
  readonly category = 'text';
  readonly enterPhysics = { strategy: 'split-self' as const };
  readonly backspacePhysics = {}; // Cannot fallback further
  override readonly keybinding = 'editor.paragraph';

  parseDOM(el: HTMLElement) {
    return ['p', 'div'].includes(el.tagName.toLowerCase())
      ? { type: this.type, attrs: { align: el.style.textAlign }, content: [] }
      : null;
  }
  renderHTML(block: ASTBlockNode, contentHtml: string) {
    return `<p${alignStyle(block.attrs?.['align'])}>${contentHtml || '<br>'}</p>`;
  }
  override renderMarkdown(block: ASTBlockNode, contentMd: string) {
    return `${contentMd}\n\n`;
  }
  override slashCommands(): SlashCommand[] {
    return [
      { id: 'paragraph', label: 'Text', icon: 'paragraph', keywords: ['plain', 'body'], group: 'Basic',
        run: (c: SlashCommandCtx) => c.engine.dispatch('paragraph') },
    ];
  }
}

export class HeadingBehavior extends BaseBlockBehavior {
  readonly type = 'heading';
  readonly category = 'text';
  readonly enterPhysics = { strategy: 'breakout' as const, defaultSplitTarget: 'paragraph' };
  readonly backspacePhysics = { fallbackType: 'paragraph' };
  override readonly keybinding = 'editor.heading1';

  parseDOM(el: HTMLElement) {
    const match = el.tagName.toLowerCase().match(/^h([1-6])$/);
    return match
      ? { type: this.type, attrs: { level: parseInt(match[1], 10), align: el.style.textAlign }, content: [] }
      : null;
  }
  renderHTML(block: ASTBlockNode, contentHtml: string) {
    // Clamp to a valid heading level: `level` may arrive from untrusted JSON
    // `value`, and it's interpolated straight into the tag name.
    const level = Math.min(6, Math.max(1, parseInt(String(block.attrs?.['level'] ?? 1), 10) || 1));
    return `<h${level}${alignStyle(block.attrs?.['align'])}>${contentHtml || '<br>'}</h${level}>`;
  }
  override renderMarkdown(block: ASTBlockNode, contentMd: string) {
    return `${'#'.repeat(block.attrs?.['level'] || 1)} ${contentMd}\n\n`;
  }
  override slashCommands(): SlashCommand[] {
    return [
      { id: 'heading-1', label: 'Heading 1', icon: 'text-h-one', keywords: ['h1', 'title', 'header'], group: 'Basic',
        run: (c: SlashCommandCtx) => c.engine.dispatch('heading', { level: 1 }) },
      { id: 'heading-2', label: 'Heading 2', icon: 'text-h-two', keywords: ['h2', 'subtitle', 'header'], group: 'Basic',
        run: (c: SlashCommandCtx) => c.engine.dispatch('heading', { level: 2 }) },
    ];
  }
}

export class QuoteBehavior extends BaseBlockBehavior {
  readonly type = 'quote';
  readonly category = 'text';
  readonly enterPhysics = { strategy: 'split-self' as const };
  readonly backspacePhysics = { fallbackType: 'paragraph' };
  override readonly keybinding = 'editor.blockquote';

  parseDOM(el: HTMLElement) {
    return el.tagName.toLowerCase() === 'blockquote' && !el.classList.contains('sh-editor-callout')
      ? { type: this.type, content: [] }
      : null;
  }
  renderHTML(block: ASTBlockNode, contentHtml: string) {
    return `<blockquote>${contentHtml || '<br>'}</blockquote>`;
  }
  override renderMarkdown(block: ASTBlockNode, contentMd: string) {
    return `> ${contentMd.replace(/\n/g, '\n> ')}\n\n`;
  }
  override slashCommands(): SlashCommand[] {
    return [
      { id: 'quote', label: 'Quote', icon: 'quotes', keywords: ['blockquote', 'citation'], group: 'Basic',
        run: (c: SlashCommandCtx) => c.engine.dispatch('quote') },
    ];
  }
}

export class InfoCalloutBehavior extends BaseBlockBehavior {
  readonly type = 'info-callout';
  readonly category = 'text';
  readonly enterPhysics = { strategy: 'split-self' as const };
  readonly backspacePhysics = { fallbackType: 'paragraph' };

  parseDOM(el: HTMLElement) {
    return el.classList.contains('sh-editor-callout') ? { type: this.type, content: [] } : null;
  }
  renderHTML(block: ASTBlockNode, contentHtml: string) {
    return `<blockquote class="sh-editor-callout sh-editor-callout-info">${contentHtml || '<br>'}</blockquote>`;
  }
  override renderMarkdown(block: ASTBlockNode, contentMd: string) {
    return `> 💡 ${contentMd}\n\n`;
  }
  override slashCommands(): SlashCommand[] {
    return [
      { id: 'info-callout', label: 'Callout', icon: 'lightbulb', keywords: ['note', 'info', 'tip', 'aside'], group: 'Basic',
        run: (c: SlashCommandCtx) => c.engine.dispatch('info-callout') },
    ];
  }
}

export class CodeBlockBehavior extends BaseBlockBehavior {
  readonly type = 'code-block';
  readonly category = 'text';
  readonly enterPhysics = { strategy: 'newline' as const };
  readonly backspacePhysics = { fallbackType: 'paragraph' };
  override readonly keybinding = 'editor.codeBlock';
  override activeClassName = 'sh-editor-code-active';
  // `\n` is real whitespace here (rendered literally in <pre>), not a <br>.
  override preserveWhitespace = true;

  parseDOM(el: HTMLElement) {
    return el.tagName.toLowerCase() === 'pre' ? { type: this.type, content: [] } : null;
  }
  renderHTML(block: ASTBlockNode, contentHtml: string) {
    return `<pre><code>${contentHtml || '<br>'}</code></pre>`;
  }
  override renderMarkdown(block: ASTBlockNode, contentMd: string) {
    return `\`\`\`\n${contentMd}\n\`\`\`\n\n`;
  }
  override slashCommands(): SlashCommand[] {
    return [
      { id: 'code-block', label: 'Code block', icon: 'code-block', keywords: ['code', 'pre', 'snippet'], group: 'Basic',
        run: (c: SlashCommandCtx) => c.engine.dispatch('code-block') },
    ];
  }
}

export class HrBehavior extends BaseBlockBehavior {
  readonly type = 'hr';
  readonly category = 'void';
  readonly enterPhysics = { strategy: 'insert-default-below' as const, defaultSplitTarget: 'paragraph' };
  readonly backspacePhysics = {};
  override readonly keybinding = 'editor.horizontalRule';

  parseDOM(el: HTMLElement) {
    return el.tagName.toLowerCase() === 'hr' ? { type: this.type, content: [] } : null;
  }
  renderHTML() {
    return `<hr>`;
  }
  override renderMarkdown() {
    return `---\n\n`;
  }
  override slashCommands(): SlashCommand[] {
    return [
      { id: 'hr', label: 'Divider', icon: 'minus', keywords: ['divider', 'rule', 'separator', 'line'], group: 'Media',
        run: (c: SlashCommandCtx) => c.engine.dispatch('hr') },
    ];
  }
}

export class ImageBehavior extends BaseBlockBehavior {
  static readonly MODES = new Set(['content', 'theater', 'float', 'custom']);
  static readonly SIZES = new Set(['auto', 'small', 'medium', 'large']);
  readonly type = 'image';
  readonly category = 'void';
  /** Images need a src — dispatching 'image' opens the insert popover. */
  override requestsUi = true;
  readonly enterPhysics = { strategy: 'insert-default-below' as const, defaultSplitTarget: 'paragraph' };
  readonly backspacePhysics = {};

  parseDOM(el: HTMLElement) {
    if (el.tagName.toLowerCase() === 'img') {
      const cls = el.className || '';
      let mode = 'content',
        size = 'auto';
      if (cls.includes('theater')) mode = 'theater';
      else if (cls.includes('float')) mode = 'float';
      else if (cls.includes('custom')) mode = 'custom';
      if (cls.includes('size-small')) size = 'small';
      else if (cls.includes('size-medium')) size = 'medium';
      else if (cls.includes('size-large')) size = 'large';
      return {
        type: this.type,
        attrs: { src: el.getAttribute('src'), alt: el.getAttribute('alt'), mode, size },
        content: [],
      };
    }
    return null;
  }
  renderHTML(block: ASTBlockNode) {
    const { src, alt, mode, size } = block.attrs || {};
    // Constrain enum-valued attrs before they reach the class list, and drop an
    // unsafe `src` (data:image/* is allowed for pasted/inline images).
    const safeMode = ImageBehavior.MODES.has(mode) ? mode : 'content';
    const safeSize = ImageBehavior.SIZES.has(size) ? size : 'auto';
    // Content/theater are fixed-width (no size class); float/custom carry the
    // size so the size buttons in the contextual toolbar have something to act on.
    const sized = safeMode === 'float' || safeMode === 'custom';
    const cls = sized ? `sh-editor-img-${safeMode} sh-editor-img-size-${safeSize}` : `sh-editor-img-${safeMode}`;
    const safeSrc = isSafeUrl(src, { allowDataImage: true }) ? escapeAttr(src) : '';
    // contenteditable="false" makes the image a non-editable island: clicking it
    // places no text caret (so mousedown needn't preventDefault, which would
    // otherwise block the native drag), and it stays draggable to reorder.
    return `<img src="${safeSrc}" alt="${escapeAttr(alt)}" class="${cls}" draggable="true" contenteditable="false">`;
  }
  override renderMarkdown(block: ASTBlockNode) {
    return `![${block.attrs?.['alt'] || ''}](${block.attrs?.['src'] || ''})\n\n`;
  }

  override contextualActions({ block, engine }: ContextualActionCtx): ContextualAction[] {
    const mode = (block.attrs?.['mode'] as string) ?? 'content';
    const size = (block.attrs?.['size'] as string) ?? 'auto';
    const setMode = (m: string) =>
      engine.updateSelectedImage({ mode: m, ...((m === 'float' || m === 'custom') && size === 'auto' ? { size: 'medium' } : {}) });

    const actions: ContextualAction[] = [
      { id: 'mode-content', icon: 'image', label: 'Inline', isActive: mode === 'content', run: () => setMode('content') },
      { id: 'mode-theater', icon: 'arrows-out-line-horizontal', label: 'Full width', isActive: mode === 'theater', run: () => setMode('theater') },
      { id: 'mode-float', icon: 'text-align-left', label: 'Float', isActive: mode === 'float', run: () => setMode('float') },
    ];
    if (mode === 'float' || mode === 'custom') {
      for (const s of ['small', 'medium', 'large']) {
        actions.push({ id: `size-${s}`, label: s.charAt(0).toUpperCase(), isActive: size === s, run: () => engine.updateSelectedImage({ size: s }) });
      }
    }
    actions.push({ id: 'delete', icon: 'trash', label: 'Delete', danger: true, run: () => engine.deleteSelectedBlock() });
    return actions;
  }

  override slashCommands(): SlashCommand[] {
    return [
      { id: 'image', label: 'Image', icon: 'image', keywords: ['image', 'picture', 'photo', 'media'], group: 'Media',
        run: (c: SlashCommandCtx) => c.engine.dispatch('image') },
    ];
  }
}

export class BulletListBehavior extends BaseBlockBehavior {
  readonly type = 'bullet-list';
  readonly category = 'container';
  readonly enterPhysics = { strategy: 'split-self' as const };
  readonly backspacePhysics = {};
  override readonly keybinding = 'editor.bulletList';

  parseDOM(el: HTMLElement) {
    return el.tagName.toLowerCase() === 'ul' ? { type: this.type, content: [] } : null;
  }
  renderHTML(block: ASTBlockNode, contentHtml: string) {
    return `<ul>${contentHtml}</ul>`;
  }
  override renderMarkdown(block: ASTBlockNode, contentMd: string) {
    return contentMd;
  }
  override slashCommands(): SlashCommand[] {
    return [
      { id: 'bullet-list', label: 'Bulleted list', icon: 'list-bullets', keywords: ['bullet', 'unordered', 'ul'], group: 'Basic',
        run: (c: SlashCommandCtx) => c.engine.dispatch('bullet-list') },
    ];
  }
}

export class OrderedListBehavior extends BaseBlockBehavior {
  readonly type = 'ordered-list';
  readonly category = 'container';
  readonly enterPhysics = { strategy: 'split-self' as const };
  readonly backspacePhysics = {};
  override readonly keybinding = 'editor.orderedList';

  parseDOM(el: HTMLElement) {
    return el.tagName.toLowerCase() === 'ol' ? { type: this.type, content: [] } : null;
  }
  renderHTML(block: ASTBlockNode, contentHtml: string) {
    return `<ol>${contentHtml}</ol>`;
  }
  override renderMarkdown(block: ASTBlockNode, contentMd: string) {
    return contentMd;
  }
  override slashCommands(): SlashCommand[] {
    return [
      { id: 'ordered-list', label: 'Numbered list', icon: 'list-numbers', keywords: ['number', 'ordered', 'ol'], group: 'Basic',
        run: (c: SlashCommandCtx) => c.engine.dispatch('ordered-list') },
    ];
  }
}

export class ListItemBehavior extends BaseBlockBehavior {
  readonly type = 'list-item';
  readonly category = 'text';
  readonly enterPhysics = { strategy: 'split-self' as const };
  readonly backspacePhysics = { fallbackType: 'outdent' };

  parseDOM(el: HTMLElement) {
    return el.tagName.toLowerCase() === 'li' ? { type: this.type, content: [] } : null;
  }
  renderHTML(block: ASTBlockNode, contentHtml: string) {
    return `<li>${contentHtml || '<br>'}</li>`;
  }
  override renderMarkdown(block: ASTBlockNode, contentMd: string) {
    return `- ${contentMd}\n`;
  }
}

// =======================
// INLINE BEHAVIORS (MARKS)
// =======================

export class BoldBehavior extends BaseInlineBehavior {
  readonly type = 'bold';
  override isSticky = true; // Expands seamlessly when continuing typing at boundary end
  override readonly keybinding = 'editor.bold';
  parseDOM(el: HTMLElement) {
    return ['strong', 'b'].includes(el.tagName.toLowerCase()) ? { type: this.type } : null;
  }
  renderHTML(mark: ASTMark, text: string) {
    return `<strong>${text}</strong>`;
  }
  override renderMarkdown(mark: ASTMark, text: string) {
    return `**${text}**`;
  }
}
export class ItalicBehavior extends BaseInlineBehavior {
  readonly type = 'italic';
  override isSticky = true;
  override readonly keybinding = 'editor.italic';
  parseDOM(el: HTMLElement) {
    return ['em', 'i'].includes(el.tagName.toLowerCase()) ? { type: this.type } : null;
  }
  renderHTML(mark: ASTMark, text: string) {
    return `<em>${text}</em>`;
  }
  override renderMarkdown(mark: ASTMark, text: string) {
    return `*${text}*`;
  }
}
export class UnderlineBehavior extends BaseInlineBehavior {
  readonly type = 'underline';
  override isSticky = true;
  override readonly keybinding = 'editor.underline';
  parseDOM(el: HTMLElement) {
    return el.tagName.toLowerCase() === 'u' ? { type: this.type } : null;
  }
  renderHTML(mark: ASTMark, text: string) {
    return `<u>${text}</u>`;
  }
}
export class StrikeBehavior extends BaseInlineBehavior {
  readonly type = 'strike';
  override isSticky = true;
  override readonly keybinding = 'editor.strike';
  parseDOM(el: HTMLElement) {
    return ['s', 'strike', 'del'].includes(el.tagName.toLowerCase()) ? { type: this.type } : null;
  }
  renderHTML(mark: ASTMark, text: string) {
    return `<s>${text}</s>`;
  }
  override renderMarkdown(mark: ASTMark, text: string) {
    return `~~${text}~~`;
  }
}
export class InlineCodeBehavior extends BaseInlineBehavior {
  readonly type = 'code';
  override isSticky = false; // Strictly non-sticky. Engine traps text outside this mark.
  override readonly keybinding = 'editor.code';
  parseDOM(el: HTMLElement) {
    return el.tagName.toLowerCase() === 'code' && !el.closest('pre') ? { type: this.type } : null;
  }
  renderHTML(mark: ASTMark, text: string) {
    return `<code>${text}</code>`;
  }
  override renderMarkdown(mark: ASTMark, text: string) {
    return `\`${text}\``;
  }
}
export class LinkBehavior extends BaseInlineBehavior {
  readonly type = 'link';
  override isSticky = false;
  /** Links need an href — dispatching 'link' opens the URL popover. */
  override requestsUi = true;
  override readonly keybinding = 'editor.link';
  parseDOM(el: HTMLElement) {
    if (el.tagName.toLowerCase() === 'a') return { type: this.type, attrs: { href: el.getAttribute('href') } };
    return null;
  }
  renderHTML(mark: ASTMark, text: string) {
    const raw = mark.attrs?.['href'];
    const href = isSafeUrl(raw) ? escapeAttr(raw) : '#';
    return `<a href="${href}">${text}</a>`;
  }
  override renderMarkdown(mark: ASTMark, text: string) {
    return `[${text}](${mark.attrs?.['href'] || '#'})`;
  }
}

/**
 * Arbitrary inline styling — font family/size, line height, color, background
 * (highlight), text shadow — carried as a single `<span style="…">` mark, the
 * way Google Docs stacks character formatting. Apply/merge via
 * `engine.applyStyle({...})`. Every property routes through {@link SAFE_STYLE_PROPS}
 * on render AND parse, so an unknown property or an injection-shaped value never
 * reaches a live style attribute; markdown drops styling entirely.
 */
export class StyleBehavior extends BaseInlineBehavior {
  readonly type = 'style';
  override isSticky = true; // typing at the edge continues the current styling

  parseDOM(el: HTMLElement): ASTMark | null {
    if (el.tagName.toLowerCase() !== 'span') return null;
    const attrs: Record<string, string> = {};
    for (const prop of Object.keys(SAFE_STYLE_PROPS)) {
      const v = el.style.getPropertyValue(prop).trim();
      if (v && SAFE_STYLE_PROPS[prop](v)) attrs[prop] = v;
    }
    return Object.keys(attrs).length ? { type: this.type, attrs } : null;
  }
  renderHTML(mark: ASTMark, text: string) {
    const style = safeStyleString(mark.attrs);
    return style ? `<span style="${escapeAttr(style)}">${text}</span>` : text;
  }
  override renderMarkdown(_mark: ASTMark, text: string) {
    return text; // markdown has no inline styling
  }
}
