import { UpperCasePipe } from '@angular/common';
import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, effect, ElementRef, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ShipColorPickerInput } from '@ship-ui/core/ship-color-picker';
import {
  ASTDocument,
  ShipEditor,
  ShipEditorActionDirective,
  ShipEditorFloatingToolbar,
  ShipEditorToolbar,
} from '@ship-ui/core/ship-editor';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipKbd } from '@ship-ui/core/ship-kbd';
import { ShipSelect } from '@ship-ui/core/ship-select';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';
import { Previewer } from '../../previewer/previewer';
import { HighlightBehavior } from './editors-shared';
import { CodePadBlockBehavior, CounterBlockBehavior } from './sh-editor-demo-blocks';
import { ShipEditorSelectionDebug } from './sh-editor-selection-debug';

@Component({
  selector: 'app-editors-examples',
  imports: [
    FormsModule,
    Previewer,
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
  templateUrl: './editors-examples.html',
  styleUrl: './editors-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorsExamples {
  customBehaviors = [new HighlightBehavior(), new CounterBlockBehavior(), new CodePadBlockBehavior()];

  initialHtml = `<h1>Ship WYSIWYG Editor</h1><p>Welcome! This is a <strong>config-driven</strong> rich-text editor designed to support flexible storage formats.</p><ul><li><strong>Two-way binding</strong> with <code>ControlValueAccessor</code></li><li>Instant conversion to <strong>HTML</strong>, <strong>Markdown</strong>, or <strong>JSON</strong></li><li>Sticky blur-toolbar, light/dark mode support, and word counting</li></ul><blockquote>"A beautiful interface makes editing content a delight."</blockquote><hr><p>Custom <strong>component blocks</strong> render live Angular components as void blocks — interact with them directly, or arrow onto them from the text to select:</p><div data-sh-block="demo-counter" data-sh-attrs='{"count":3}'></div><div data-sh-block="demo-code-pad" data-sh-attrs='{"code":"function answer() {\\n  return 42;\\n}"}'></div><p>Try changing the storage format below to see the serialized output update in real time!</p>`;

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
  /** Off by default in the component too — Alt+click opens an extra cursor. */
  multiCursor = signal(false);
  placeholder = signal('Start typing something beautiful...');

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
      // ignore quota/serialization errors
    }
  }

  #clearStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(this.#storageKey);
    } catch {
      // ignore
    }
  }
}
