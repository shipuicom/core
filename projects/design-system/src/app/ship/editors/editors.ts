import { UpperCasePipe } from '@angular/common';
import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, effect, ElementRef, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ShipColorPickerInput } from '@ship-ui/core/ship-color-picker';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipKbd } from '@ship-ui/core/ship-kbd';
import { ShipSelect } from '@ship-ui/core/ship-select';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import {
  ASTDocument,
  ASTMark,
  BaseInlineBehavior,
  ShipEditor,
  ShipEditorActionDirective,
  ShipEditorFloatingToolbar,
  ShipEditorToolbar,
} from '@ship-ui/core/ship-editor';
import { ShipEditorSelectionDebug } from './sh-editor-selection-debug';

class HighlightBehavior extends BaseInlineBehavior {
  readonly type = 'highlight';
  override isSticky = true;

  parseDOM(el: HTMLElement) {
    return el.tagName.toLowerCase() === 'mark' ? { type: this.type } : null;
  }
  renderHTML(_mark: ASTMark, text: string) {
    return `<mark class="sh-editor-highlight">${text}</mark>`;
  }
  override renderMarkdown(_mark: ASTMark, text: string) {
    return `==${text}==`;
  }
}

@Component({
  selector: 'app-editors',
  standalone: true,
  imports: [
    FormsModule,
    ApiReference,
    Highlight,
    Previewer,
    PropertyViewer,
    ShipTabs,
    ShipEditor,
    ShipEditorToolbar,
    ShipEditorFloatingToolbar,
    ShipEditorActionDirective,
    ShipEditorSelectionDebug,
    ShipButton,
    FormField,
    ShipCheckbox,
    ShipColorPickerInput,
    ShipSelect,
    ShipIcon,
    ShipKbd,
    ShipTooltip,
    UpperCasePipe,
  ],
  templateUrl: './editors.html',
  styleUrl: './editors.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Editors {

  activeTab = signal<'overview' | 'api' | 'parts' | 'styling' | 'examples' | 'virtual'>('overview');

  usageExample = `import { Component, signal } from '@angular/core';
import { ShipEditor, ShipEditorToolbar, ShipEditorActionDirective } from '@ship-ui/core/ship-editor';

@Component({
  selector: 'app-my-editor',
  imports: [ShipEditor, ShipEditorToolbar, ShipEditorActionDirective],
  template: \`
    <sh-editor [(value)]="content" format="html">
      <sh-editor-toolbar position="top">
        <button shEditorAction="bold" aria-label="Bold">B</button>
        <button shEditorAction="italic" aria-label="Italic">I</button>
        <button shEditorAction="heading" [shEditorActionAttrs]="{ level: 1 }">H1</button>
      </sh-editor-toolbar>
    </sh-editor>\`,
})
export class MyEditor {
  content = signal('<p>Hello, world.</p>');
}`;

  behaviorExample = `import { BaseInlineBehavior, ASTMark } from '@ship-ui/core/ship-editor';

// A custom "highlight" mark, registered via the [behaviors] input.
class HighlightBehavior extends BaseInlineBehavior {
  readonly type = 'highlight';
  override isSticky = true;
  parseDOM(el: HTMLElement) {
    return el.tagName.toLowerCase() === 'mark' ? { type: this.type } : null;
  }
  renderHTML(_mark: ASTMark, text: string) {
    return \`<mark>\${text}</mark>\`;
  }
}

// <sh-editor [behaviors]="[new HighlightBehavior()]" ...>`;

  stylingExample = `<!-- Google-Docs-style page canvas (variant), like any Ship component -->
<sh-editor variant="document" [(value)]="content"></sh-editor>

<!-- Opt in to image mid-edge (one-axis) resize handles -->
<sh-editor [imageEdgeResize]="true" ...></sh-editor>`;

  customBehaviors = [new HighlightBehavior()];

  initialHtml = `<h1>Ship WYSIWYG Editor</h1><p>Welcome! This is a <strong>config-driven</strong> rich-text editor designed to support flexible storage formats.</p><ul><li><strong>Two-way binding</strong> with <code>ControlValueAccessor</code></li><li>Instant conversion to <strong>HTML</strong>, <strong>Markdown</strong>, or <strong>JSON</strong></li><li>Sticky blur-toolbar, light/dark mode support, and word counting</li></ul><blockquote>"A beautiful interface makes editing content a delight."</blockquote><hr><p>Try changing the storage format below to see the serialized output update in real time!</p>`;

  format = signal<'html' | 'json' | 'markdown'>('html');
  formatOptions = [
    { value: 'html', label: 'HTML' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'json', label: 'JSON (AST)' },
  ];
  readonly = signal(false);
  showMetrics = signal(true);

  imageEdgeResize = signal(false);

  documentVariant = signal(false);
  placeholder = signal('Start typing something beautiful...');

  basicValue = signal(
    '<h2>Start here</h2><p>A <strong>basic</strong> editor — try <em>formatting</em>, headings, lists and links.</p><ul><li>Bold, italic, headings</li><li>Bullet lists</li></ul>'
  );

  /**
   * 5,000 blocks handed to the editor up front. Past 1,000 top-level blocks
   * the editor virtualizes: only the viewport's window of blocks exists in
   * the DOM, so this loads (and edits) as fast as a small document.
   */
  hugeDocValue = signal<string | ASTDocument | null>(buildHugeDocument());
  hugeFormat = signal<'html' | 'json' | 'markdown'>('json');
  hugeReadonly = signal(false);
  hugeShowMetrics = signal(true);
  hugeImageEdgeResize = signal(false);
  hugeDocumentVariant = signal(false);

  resetHuge() {
    this.hugeFormat.set('json');
    this.hugeDocValue.set(buildHugeDocument());
  }

  demoImageUpload = async (file: File): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return `https://picsum.photos/seed/${encodeURIComponent(file.name)}/480/320`;
  };

  fontOptions = signal<{ value: string; label: string; stack: string | null }[]>([
    { value: 'Default', label: 'Default', stack: null },
    { value: 'Arial', label: 'Arial', stack: 'Arial, sans-serif' },
    { value: 'Georgia', label: 'Georgia', stack: 'Georgia, serif' },
    { value: 'Times New Roman', label: 'Times New Roman', stack: "'Times New Roman', serif" },
    { value: 'Courier New', label: 'Courier New', stack: "'Courier New', monospace" },
    { value: 'Verdana', label: 'Verdana', stack: 'Verdana, sans-serif' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS', stack: "'Trebuchet MS', sans-serif" },
  ]);

  #fontStackFor = (token: string): string | null => this.fontOptions().find((o) => o.value === token)?.stack ?? null;

  #fontTokenFor = (stack: string): string => (stack && this.fontOptions().find((o) => o.stack === stack)?.value) || this.#defaultFontToken();

  fontSizeOptions = signal([
    { value: 'Default', label: 'Default' },
    ...[12, 14, 16, 18, 20, 24, 28, 32, 48].map((n) => ({ value: `${n}px`, label: `${n}px` })),
  ]);

  #defaultFontToken = (): string => 'Default';
  #defaultSizeValue = (): string => 'Default';

  isValidFontSize = (value: string) => /^\d+(\.\d+)?(px|pt|em|rem|%)?$/.test(value.trim());

  mainEditorRef = viewChild<ShipEditor>('mainEditor');

  private fontSelectRef = viewChild('fontSel', { read: ShipSelect });
  private sizeSelectRef = viewChild('sizeSel', { read: ShipSelect });

  private textColorInput = viewChild<ElementRef<HTMLInputElement>>('textColorInput');
  private highlightColorInput = viewChild<ElementRef<HTMLInputElement>>('highlightColorInput');

  fontModel = signal('');
  fontField = form(this.fontModel);
  sizeModel = signal('');
  sizeField = form(this.sizeModel);

  editorValue = signal<string | ASTDocument | null>(this.initialHtml);

  /**
   * The raw-output panel renders on every keystroke; on large documents the
   * full serialized value is tens of kilobytes, and re-rendering it into the
   * <pre> dominated typing latency. Preview a bounded slice instead.
   */
  rawPreview = computed(() => {
    const value = this.editorValue();
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    if (!text) return '';
    const LIMIT = 2000;
    return text.length > LIMIT ? text.slice(0, LIMIT) + `\n… (${text.length - LIMIT} more characters)` : text;
  });

  persist = signal(false);
  #storageKey = 'ship:editor:showcase';

  constructor() {

    const saved = this.#readStorage();
    if (saved) {
      this.format.set(saved.format);
      this.editorValue.set(saved.value);
      this.persist.set(true);
    }

    effect(() => {
      const value = this.editorValue();
      const format = this.format();
      if (this.persist()) this.#writeStorage({ format, value });
      else this.#clearStorage();
    });

    effect(() => {
      const editor = this.mainEditorRef();
      const token = this.fontModel();
      if (!editor) return;
      queueMicrotask(() => {
        const stack = this.#fontStackFor(token);
        if ((stack ?? '') !== (editor.engine.currentStyle()['font-family'] ?? '')) {
          editor.engine.applyStyle({ 'font-family': stack });
        }
      });
    });
    effect(() => {
      const editor = this.mainEditorRef();
      const size = this.sizeModel();
      if (!editor) return;
      queueMicrotask(() => {

        const desired = size === 'Default' ? '' : size && /^\d+(\.\d+)?$/.test(size) ? `${size}px` : size;
        if (desired === (editor.engine.currentStyle()['font-size'] ?? '')) return;
        editor.engine.applyStyle({ 'font-size': desired || null });
      });
    });

    afterRenderEffect(() => {
      const editor = this.mainEditorRef();
      if (!editor) return;
      const style = editor.engine.currentStyle();
      const fontToken = this.#fontTokenFor(style['font-family'] ?? '');
      const size = style['font-size'] ?? '';
      const fontSel = this.fontSelectRef();
      const sizeSel = this.sizeSelectRef();

      const fontOpt = this.fontOptions().find((o) => o.value === fontToken)!;
      const sizeOpt =
        this.fontSizeOptions().find((o) => o.value === (size || this.#defaultSizeValue())) ?? { value: size, label: size };

      const textColor = this.textColorInput()?.nativeElement;
      const highlightColor = this.highlightColorInput()?.nativeElement;
      const color = style['color'] ?? '';
      const background = style['background-color'] ?? '';
      queueMicrotask(() => {
        if (fontSel && (untracked(fontSel.selectedOptions)[0] as { value?: string })?.value !== fontOpt.value) {
          fontSel.selectedOptions.set([fontOpt]);
        }
        if (sizeSel && (untracked(sizeSel.selectedOptions)[0] as { value?: string })?.value !== sizeOpt.value) {
          sizeSel.selectedOptions.set([sizeOpt]);
        }
        this.#seedColorInput(textColor, color || '#111111');
        this.#seedColorInput(highlightColor, background || '#ffe066');
      });
    });
  }

  #seedColorInput(input: HTMLInputElement | undefined, value: string) {
    if (input && input.value !== value) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  }

  reset() {
    this.persist.set(false);
    this.format.set('html');
    this.editorValue.set(this.initialHtml);
    this.#clearStorage();
  }

  #readStorage(): { format: 'html' | 'json' | 'markdown'; value: string | ASTDocument | null } | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.#storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  #writeStorage(data: { format: 'html' | 'json' | 'markdown'; value: string | ASTDocument | null }) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.#storageKey, JSON.stringify(data));
    } catch {

    }
  }

  #clearStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(this.#storageKey);
    } catch {

    }
  }
}

/**
 * Exactly 5,000 top-level blocks exercising the whole block/mark surface:
 * headings, both list kinds, code blocks, quotes, callouts, hr and image
 * voids, and paragraphs carrying inline marks (bold, italic, links, inline
 * code, colors, highlight). Variable heights and real mark runs make the
 * virtualized window's measured-height model and per-block render cache work
 * for their living. Deterministic on purpose: reloads always show the same
 * document.
 */
function buildHugeDocument(): ASTDocument {
  const sentences = [
    'The window mounts only what the viewport can see.',
    'Everything above and below is spacer padding, priced by measured block heights.',
    'Scroll anywhere — the mapping from pixels to blocks is a binary search.',
    'Typing here costs the same as in a ten-block document.',
    'Select-all and copy still serialize the whole document from the model.',
  ];
  const colors = ['#e05263', '#3b82f6', '#16a34a', '#d97706'];

  const svgImage = (i: number): string => {
    const height = 120 + (i % 5) * 40;
    const hue = (i * 47) % 360;
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='${height}'>` +
      `<rect width='480' height='${height}' rx='8' fill='hsl(${hue} 60% 55%)'/>` +
      `<text x='16' y='34' font-family='sans-serif' font-size='20' fill='white'>Image at block ${i} (${height}px)</text></svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  };

  /** A paragraph's inline nodes with a deterministic sprinkle of marks. */
  const markedContent = (i: number): ASTDocument[number]['content'] => {
    const sentence = sentences[i % sentences.length];
    const tail = i % 7 === 0 ? ` ${sentences[(i + 2) % sentences.length]}` : '';
    const plain = [{ type: 'text' as const, text: `Block ${i}. ${sentence}${tail}` }];
    switch (i % 11) {
      case 0:
        return [
          { type: 'text', text: `Block ${i}. ` },
          { type: 'text', text: 'Bold lead-in', marks: [{ type: 'bold' }] },
          { type: 'text', text: ` ${sentence}` },
        ];
      case 3:
        return [
          { type: 'text', text: `Block ${i}. See ` },
          { type: 'text', text: 'the docs', marks: [{ type: 'link', attrs: { href: 'https://ship-ui.dev/docs' } }] },
          { type: 'text', text: ` — ${sentence}`, marks: [{ type: 'italic' }] },
        ];
      case 5:
        return [
          { type: 'text', text: `Block ${i}. Call ` },
          { type: 'text', text: 'renderBlockHtml(i)', marks: [{ type: 'code' }] },
          { type: 'text', text: ' per block. ' },
          { type: 'text', text: sentence, marks: [{ type: 'style', attrs: { color: colors[i % colors.length] } }] },
        ];
      case 8:
        return [
          { type: 'text', text: `Block ${i}. ` },
          { type: 'text', text: 'Highlighted', marks: [{ type: 'highlight' }] },
          { type: 'text', text: ' and ' },
          { type: 'text', text: 'struck', marks: [{ type: 'strike' }] },
          { type: 'text', text: `. ${sentence}` },
        ];
      default:
        return plain;
    }
  };

  const listBlock = (i: number): ASTDocument[number] => ({
    type: i % 2 === 0 ? 'bullet-list' : 'ordered-list',
    content: Array.from({ length: 2 + (i % 4) }, (_, n) => ({
      type: 'list-item',
      content:
        n === 0
          ? [
              { type: 'text', text: `Item ${n + 1} at block ${i} — ` },
              { type: 'text', text: 'marked', marks: [{ type: 'bold' }, { type: 'italic' }] },
            ]
          : [{ type: 'text', text: `Item ${n + 1} of the list at block ${i}` }],
    })),
  });

  const doc: ASTDocument = [];
  for (let i = 0; i < 5000; i++) {
    if (i % 500 === 0) {
      doc.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: `Chapter ${i / 500 + 1}` }] });
    } else if (i % 500 === 250) {
      doc.push({ type: 'image', attrs: { src: svgImage(i), alt: `Demo image ${i}`, mode: 'content', size: 'auto' }, content: [] });
    } else if (i % 125 === 0) {
      doc.push({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: `Section ${Math.floor(i / 125)}` }] });
    } else if (i % 311 === 0) {
      doc.push({ type: 'hr', content: [] });
    } else if (i % 89 === 0) {
      doc.push({
        type: 'code-block',
        content: [
          {
            type: 'text',
            text: `function blockAt(index) {\n\tconst row = rowOfTopLevel(${i});\n\tif (row >= rows) {\n\t\treturn null;\n\t}\n\treturn blockFromRow(cd, row);\n}`,
          },
        ],
      });
    } else if (i % 71 === 0) {
      const isQuote = i % 142 === 0;
      doc.push({
        type: isQuote ? 'quote' : 'info-callout',
        content: [
          { type: 'text', text: `Block ${i}: ` },
          { type: 'text', text: sentences[i % sentences.length], ...(isQuote ? { marks: [{ type: 'italic' }] } : {}) },
        ],
      });
    } else if (i % 53 === 0) {
      doc.push(listBlock(i));
    } else {
      doc.push({ type: 'paragraph', content: markedContent(i) });
    }
  }
  return doc;
}
