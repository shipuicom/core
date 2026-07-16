import { JsonPipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
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
    ShipCheckbox,
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
