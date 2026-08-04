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

/**
 * Attributes for a parsed block, leaving out values the element does not set.
 *
 * `el.style.textAlign` is `''` when unset, so writing it in unconditionally gave
 * every paragraph and heading an attrs object holding an empty string - carried
 * in memory and in every serialised document for no information.
 */
function blockAttrs(base: Record<string, unknown>, align: string): Record<string, unknown> | undefined {
  const attrs = { ...base };
  if (align) attrs['align'] = align;
  return Object.keys(attrs).length ? attrs : undefined;
}

function alignStyle(align: unknown): string {
  return typeof align === 'string' && ALLOWED_ALIGN.has(align) ? ` style="text-align: ${align}"` : '';
}

export class ParagraphBehavior extends BaseBlockBehavior {
  readonly type = 'paragraph';
  readonly category = 'text';
  readonly enterPhysics = { strategy: 'split-self' as const };
  readonly backspacePhysics = {};
  override readonly keybinding = 'editor.paragraph';

  parseDOM(el: HTMLElement) {
    // A div carrying data-sh-block belongs to a custom component behavior.
    if (el.dataset?.['shBlock']) return null;
    return ['p', 'div'].includes(el.tagName.toLowerCase())
      ? { type: this.type, attrs: blockAttrs({}, el.style.textAlign), content: [] }
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
      ? { type: this.type, attrs: blockAttrs({ level: parseInt(match[1], 10) }, el.style.textAlign), content: [] }
      : null;
  }
  renderHTML(block: ASTBlockNode, contentHtml: string) {

    const level = Math.min(6, Math.max(1, parseInt(String(block.attrs?.['level'] ?? 1), 10) || 1));
    return `<h${level}${alignStyle(block.attrs?.['align'])}>${contentHtml || '<br>'}</h${level}>`;
  }
  override renderMarkdown(block: ASTBlockNode, contentMd: string) {
    // Clamped like renderHTML: a hostile `level` (-1, 1e9) in a JSON document
    // must not throw out of `repeat` and take the whole value sync with it.
    const level = Math.min(6, Math.max(1, parseInt(String(block.attrs?.['level'] ?? 1), 10) || 1));
    return `${'#'.repeat(level)} ${contentMd}\n\n`;
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

  override requestsUi = true;
  readonly enterPhysics = { strategy: 'insert-default-below' as const, defaultSplitTarget: 'paragraph' };
  readonly backspacePhysics = {};

  static parseDimension(raw: unknown): number | null {
    const n = Math.round(Number(raw));
    return Number.isFinite(n) && n > 0 ? n : null;
  }

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
      const width = ImageBehavior.parseDimension(el.getAttribute('width'));
      const height = ImageBehavior.parseDimension(el.getAttribute('height'));
      return {
        type: this.type,
        attrs: { src: el.getAttribute('src'), alt: el.getAttribute('alt'), mode, size, ...(width ? { width } : {}), ...(height ? { height } : {}) },
        content: [],
      };
    }
    return null;
  }
  renderHTML(block: ASTBlockNode) {
    const { src, alt, mode, size } = block.attrs || {};

    const safeMode = ImageBehavior.MODES.has(mode) ? mode : 'content';
    const safeSize = ImageBehavior.SIZES.has(size) ? size : 'auto';

    const sized = safeMode === 'float' || safeMode === 'custom';
    const cls = sized ? `sh-editor-img-${safeMode} sh-editor-img-size-${safeSize}` : `sh-editor-img-${safeMode}`;
    const safeSrc = isSafeUrl(src, { allowDataImage: true }) ? escapeAttr(src) : '';

    const width = ImageBehavior.parseDimension(block.attrs?.['width']);
    const height = ImageBehavior.parseDimension(block.attrs?.['height']);
    const dimAttrs = (width ? ` width="${width}"` : '') + (height ? ` height="${height}"` : '');
    const styleProps = [width ? `width:${width}px` : '', height ? `height:${height}px` : ''].filter(Boolean);
    const styleAttr = styleProps.length ? ` style="${styleProps.join(';')}"` : '';

    return `<img src="${safeSrc}" alt="${escapeAttr(alt)}" class="${cls}" draggable="true" contenteditable="false"${dimAttrs}${styleAttr}>`;
  }
  override renderMarkdown(block: ASTBlockNode) {
    return `![${block.attrs?.['alt'] || ''}](${block.attrs?.['src'] || ''})\n\n`;
  }

  override contextualActions({ block, engine }: ContextualActionCtx): ContextualAction[] {
    const mode = (block.attrs?.['mode'] as string) ?? 'content';
    const size = (block.attrs?.['size'] as string) ?? 'auto';

    const setMode = (m: string) =>
      engine.updateSelectedImage({ mode: m, width: null, height: null, ...((m === 'float' || m === 'custom') && size === 'auto' ? { size: 'medium' } : {}) });

    const actions: ContextualAction[] = [
      { id: 'mode-content', icon: 'image', label: 'Inline', isActive: mode === 'content', run: () => setMode('content') },
      { id: 'mode-theater', icon: 'arrows-out-line-horizontal', label: 'Full width', isActive: mode === 'theater', run: () => setMode('theater') },
      { id: 'mode-float', icon: 'text-align-left', label: 'Float', isActive: mode === 'float', run: () => setMode('float') },
    ];
    if (mode === 'float' || mode === 'custom') {
      for (const s of ['small', 'medium', 'large']) {
        actions.push({ id: `size-${s}`, label: s.charAt(0).toUpperCase(), isActive: size === s, run: () => engine.updateSelectedImage({ size: s, width: null, height: null }) });
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

export class BoldBehavior extends BaseInlineBehavior {
  readonly type = 'bold';
  override isSticky = true;
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
  override isSticky = false;
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

export class StyleBehavior extends BaseInlineBehavior {
  readonly type = 'style';
  override isSticky = true;

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
    return text;
  }
}
