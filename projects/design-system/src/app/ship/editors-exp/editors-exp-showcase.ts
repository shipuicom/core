import { JsonPipe, UpperCasePipe } from '@angular/common';
import { afterRenderEffect, ChangeDetectionStrategy, Component, effect, ElementRef, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ShipColorPickerInput } from '@ship-ui/core/ship-color-picker';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipKbd } from '@ship-ui/core/ship-kbd';
import { ShipSelect } from '@ship-ui/core/ship-select';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseInlineBehavior } from './editor-behaviors';
import { ASTDocument, ASTMark } from './editor.types';
import { ShipEditorActionDirective } from './sh-editor-action.directive';
import { ShipEditorFloatingToolbar } from './sh-editor-floating-toolbar';
import { ShipEditorSelectionDebug } from './sh-editor-selection-debug';
import { ShipEditorToolbar } from './sh-editor-toolbar';
import { ShipEditorExp } from './ship-editor';

/**
 * Example custom inline behavior: a "highlight" mark.
 *
 * Demonstrates the extension point — it's a native `<mark>` element with a
 * class on it, so it renders as `<mark class="sh-editor-highlight">…</mark>`
 * and parses any `<mark>` back into the mark. Markdown uses the common
 * `==text==` highlight syntax.
 */
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
  selector: 'app-editors-exp',
  standalone: true,
  imports: [
    FormsModule,
    Previewer,
    PropertyViewer,
    ShipEditorExp,
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
    JsonPipe,
  ],
  templateUrl: './editors-exp-showcase.html',
  styleUrl: './editors-exp-showcase.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorsExpShowcase {
  /** Consumer-supplied behaviors registered on top of the built-in set. */
  customBehaviors = [new HighlightBehavior()];

  initialHtml = `<h1>Ship WYSIWYG Editor</h1><p>Welcome! This is a <strong>config-driven</strong> rich-text editor designed to support flexible storage formats.</p><ul><li><strong>Two-way binding</strong> with <code>ControlValueAccessor</code></li><li>Instant conversion to <strong>HTML</strong>, <strong>Markdown</strong>, or <strong>JSON</strong></li><li>Sticky blur-toolbar, light/dark mode support, and word counting</li></ul><blockquote>"A beautiful interface makes editing content a delight."</blockquote><hr><p>Try changing the storage format below to see the serialized output update in real time!</p>`;

  // Editor configuration
  format = signal<'html' | 'json' | 'markdown'>('html');
  formatOptions = [
    { value: 'html', label: 'HTML' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'json', label: 'JSON (AST)' },
  ];
  readonly = signal(false);
  showMetrics = signal(true);
  placeholder = signal('Start typing something beautiful...');

  /**
   * Demo image-upload handler. Simulates a network upload (short delay + the
   * popover's "Uploading…" state), then returns a deterministic, working URL
   * seeded by the file name instead of inlining a `data:` URL. A real consumer
   * would POST the file to their storage and return the resulting link.
   */
  demoImageUpload = async (file: File): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return `https://picsum.photos/seed/${encodeURIComponent(file.name)}/480/320`;
  };

  // ── Style toolbar (sh-select bound with Signal Forms) ──────────────────────
  // Comma-free value tokens: sh-select treats a comma in a value as a
  // multi-value separator, so a value like "Georgia, serif" can never round-trip
  // back to its option — which silently breaks prefill (the select can't show
  // the cursor's font). Each token maps to the full CSS font stack that is
  // actually applied to / read from the editor via #fontStackFor / #fontTokenFor.
  fontOptions = signal([
    { value: 'Arial', label: 'Arial', stack: 'Arial, sans-serif' },
    { value: 'Georgia', label: 'Georgia', stack: 'Georgia, serif' },
    { value: 'Times New Roman', label: 'Times New Roman', stack: "'Times New Roman', serif" },
    { value: 'Courier New', label: 'Courier New', stack: "'Courier New', monospace" },
    { value: 'Verdana', label: 'Verdana', stack: 'Verdana, sans-serif' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS', stack: "'Trebuchet MS', sans-serif" },
  ]);

  /** Map a font token (the select value) to the CSS font stack applied to the editor. */
  #fontStackFor = (token: string): string | null => this.fontOptions().find((o) => o.value === token)?.stack ?? null;
  /** Map a CSS font stack (from the editor's style) back to its select token, or '' if unknown. */
  #fontTokenFor = (stack: string): string => this.fontOptions().find((o) => o.stack === stack)?.value ?? '';
  fontSizeOptions = signal([12, 14, 16, 18, 20, 24, 28, 32, 48].map((n) => ({ value: `${n}px`, label: `${n}px` })));

  /** Accept a preset value, a bare number, or a css length as a custom size. */
  isValidFontSize = (value: string) => /^\d+(\.\d+)?(px|pt|em|rem|%)?$/.test(value.trim());

  /** The main editor, so the style effects can read/apply its selection style. */
  mainEditorRef = viewChild<ShipEditorExp>('mainEditor');

  // The two style selects, so prefill can drive their shown value directly:
  // sh-select's value→option sync can skip updating its display on a programmatic
  // write (its guard treats an empty input as a no-op), so we set selectedOptions.
  private fontSelectRef = viewChild('fontSel', { read: ShipSelect });
  private sizeSelectRef = viewChild('sizeSel', { read: ShipSelect });

  // The two color pickers' projected inputs, seeded imperatively by the prefill
  // effect (outside render) — see the note in the template.
  private textColorInput = viewChild<ElementRef<HTMLInputElement>>('textColorInput');
  private highlightColorInput = viewChild<ElementRef<HTMLInputElement>>('highlightColorInput');

  // Signal-Forms models for the font/size selects. `form()` makes each a form
  // field; the projected <input [formField]> binds it (no FormsModule/ngModel).
  fontModel = signal('');
  fontField = form(this.fontModel);
  sizeModel = signal('');
  sizeField = form(this.sizeModel);

  // Current value model
  editorValue = signal<string | ASTDocument | null>(this.initialHtml);

  /**
   * Testing-only persistence. When on, the current value + format are mirrored to
   * localStorage on every change and restored on reload; off (or Reset) clears it.
   * Not part of the editor — just a harness to exercise round-tripping.
   */
  persist = signal(false);
  #storageKey = 'ship:editors-exp:showcase';

  constructor() {
    // Restore any previously-persisted content on load (browser only).
    const saved = this.#readStorage();
    if (saved) {
      this.format.set(saved.format);
      this.editorValue.set(saved.value);
      this.persist.set(true);
    }

    // Mirror to / clear from localStorage as the value, format, or toggle change.
    effect(() => {
      const value = this.editorValue();
      const format = this.format();
      if (this.persist()) this.#writeStorage({ format, value });
      else this.#clearStorage();
    });

    // Apply the font/size selects (Signal-Forms models) to the selection. The
    // apply is deferred to a microtask so the resulting engine writes never land
    // inside the render pass (which would trip NG0600), and only fire on a real
    // change vs the current style.
    effect(() => {
      const editor = this.mainEditorRef();
      const token = this.fontModel(); // re-run when the font select changes
      if (!editor) return;
      queueMicrotask(() => {
        const stack = this.#fontStackFor(token); // token → full CSS font stack (null if none)
        if ((stack ?? '') !== (editor.engine.currentStyle()['font-family'] ?? '')) {
          editor.engine.applyStyle({ 'font-family': stack });
        }
      });
    });
    effect(() => {
      const editor = this.mainEditorRef();
      const size = this.sizeModel(); // re-run when the size select changes
      if (!editor) return;
      queueMicrotask(() => {
        if (size === (editor.engine.currentStyle()['font-size'] ?? '')) return;
        // A bare number from the free-text option becomes px.
        const v = size && /^\d+(\.\d+)?$/.test(size) ? `${size}px` : size;
        editor.engine.applyStyle({ 'font-size': v || null });
      });
    });

    // Prefill the selects from the style at the cursor — the OPPOSITE direction
    // of the apply effects (editor → select), so the controls reflect the
    // selection. We drive the sh-select's `selectedOptions` (its displayed value)
    // rather than the Signal-Forms model: `[formField]` writes the native input
    // value during render, which sh-select's value-setter patch turns into a
    // signal write mid-render → NG0600. Writing selectedOptions is deferred to a
    // microtask (outside the render pass) and no-op-guarded — a fresh array every
    // render would otherwise re-trigger this effect in a loop. The apply effects
    // above still own the select → editor direction (driven by user picks), and
    // their currentStyle guard keeps this one-way mirror from causing a re-apply.
    afterRenderEffect(() => {
      const editor = this.mainEditorRef();
      if (!editor) return;
      const style = editor.engine.currentStyle();
      const fontToken = this.#fontTokenFor(style['font-family'] ?? ''); // stack → select token
      const size = style['font-size'] ?? '';
      const fontSel = this.fontSelectRef();
      const sizeSel = this.sizeSelectRef();
      // Font always maps (a token or none). Size is free-text: reflect a preset
      // match or clear when empty, but leave a custom typed size to the input.
      const fontOpt = this.fontOptions().find((o) => o.value === fontToken) ?? null;
      const sizeOpt = this.fontSizeOptions().find((o) => o.value === size) ?? null;
      // Seed the color pickers from the selection (defaults when unset). Writing
      // the projected input dispatches into the picker's parse → signal write, so
      // it must happen in the microtask below, never in the render pass.
      const textColor = this.textColorInput()?.nativeElement;
      const highlightColor = this.highlightColorInput()?.nativeElement;
      const color = style['color'] ?? '';
      const background = style['background-color'] ?? '';
      queueMicrotask(() => {
        if (fontSel && (untracked(fontSel.selectedOptions)[0] ?? null) !== fontOpt) {
          fontSel.selectedOptions.set(fontOpt ? [fontOpt] : []);
        }
        if (sizeSel && (sizeOpt || size === '') && (untracked(sizeSel.selectedOptions)[0] ?? null) !== sizeOpt) {
          sizeSel.selectedOptions.set(sizeOpt ? [sizeOpt] : []);
        }
        this.#seedColorInput(textColor, color || '#111111');
        this.#seedColorInput(highlightColor, background || '#ffe066');
      });
    });
  }

  /**
   * Seed a color picker's projected input to `value`, outside the render pass.
   * Setting the value drives the picker's parse (which writes its color signals);
   * doing it here (from the prefill microtask) keeps that write out of render, so
   * it can't trip NG0600. Guarded so a converged value doesn't re-trigger.
   */
  #seedColorInput(input: HTMLInputElement | undefined, value: string) {
    if (input && input.value !== value) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  }

  /** Restore the initial demo content and clear the persisted copy. */
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
      /* quota / disabled storage — ignore in the demo */
    }
  }

  #clearStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(this.#storageKey);
    } catch {
      /* ignore */
    }
  }
}
