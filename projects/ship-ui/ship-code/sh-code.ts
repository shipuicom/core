import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BlockHeightMap } from '@ship-ui/core/ship-virtual-scroll';
import {
  CodeDocument,
  createDocument,
  getText,
} from './core/document';
import { FlatChange, FlatPos, indexFor } from './core/line-index';
import { applyFlatChange, applyFlatChanges, mapThroughChanges } from './core/flat-edit';
import {
  FlatSelection,
  MotionResult,
  applyMotion,
  flatCaret,
  flatMoveDocEnd,
  flatMoveDocStart,
  flatMoveDown,
  flatMoveLeft,
  flatMoveLineEnd,
  flatMoveLineStart,
  flatMoveRight,
  flatMoveUp,
  flatMoveWordLeft,
  flatMoveWordRight,
  flatOrdered,
  flatSelectAll,
  flatSelectLine,
  flatSelectWord,
  isFlatCollapsed,
  primaryFlat,
} from './core/flat-motion';
import { ShipCodeAction, ShipCodeKeymap, matchesShortcut } from './keymaps/keymap';
import { SUBLIME_KEYMAP } from './keymaps/sublime.keymap';
import { VSCODE_KEYMAP } from './keymaps/vscode.keymap';
import { IncrementalTokenizer } from './textmate/incremental';
import { LanguageTokenizer, TokenizerEngine } from './textmate/types';
import { SHIP_DARK } from './themes/ship-dark';
import { SHIP_LIGHT } from './themes/ship-light';
import { ShipCodeTheme, StyledToken, resolveScope } from './themes/theme-resolver';

/** `'auto'` virtualizes past this many lines. */
const VIRTUAL_AUTO_THRESHOLD = 1000;
/** Pixels of lines kept mounted beyond each viewport edge. */
const VIRTUAL_OVERSCAN_PX = 400;
/** Line height assumed before the first real measurement. */
const DEFAULT_LINE_PX = 20;

let nextInstanceId = 1;

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Guard for theme colors interpolated into the bucket stylesheet. */
function isSafeColor(value: string): boolean {
  if (!value || value.length > 40) return false;
  return /^#[0-9a-f]{3,8}$/i.test(value) || /^(rgb|hsl)a?\(\s*[\d.,%\s/]+\)$/i.test(value) || /^[a-z]+$/i.test(value);
}

interface HistoryEntry {
  readonly inverse: readonly FlatChange[];
  readonly redo: readonly FlatChange[];
  readonly selBefore: FlatSelection;
  readonly selAfter: FlatSelection;
}

/**
 * `<sh-code>` — the code editor surface. Renders a virtualized window of
 * lines (the shared `BlockHeightMap` drives the pixel model, exactly as in
 * `sh-editor`'s virtualization), takes input through a hidden textarea, and
 * keeps a flat `{anchor, head}` selection over the columnar line index.
 */
@Component({
  selector: 'sh-code',
  standalone: true,
  exportAs: 'shCode',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './sh-code.html',
  styleUrl: './sh-code.scss',
  host: {
    '[style.--code-fg]': 'themeForeground()',
    '[style.--code-bg]': 'themeBackground()',
    '[style.--shc-line-h.px]': 'lineHeight()',
    '[attr.data-shc]': 'uid',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ShipCode), multi: true }],
})
export class ShipCode implements ControlValueAccessor {
  scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  inputArea = viewChild.required<ElementRef<HTMLTextAreaElement>>('inputArea');
  probe = viewChild.required<ElementRef<HTMLElement>>('probe');

  /** Two-way bound document text. */
  value = model<string | null>(null);
  /** When `true`, the editor rejects all input. */
  readonly = input(false);
  /** Keymap preset name or a full custom keymap. */
  keymap = input<'sublime' | 'vscode' | ShipCodeKeymap>('sublime');
  /** Show the line-number gutter. */
  lineNumbers = input(true);
  /** `'auto'` virtualizes past 1000 lines; `true`/`false` force it. */
  virtualization = input<boolean | 'auto'>('auto');
  /** Language id resolved against the grammar registry. */
  language = input<string>('');
  /**
   * Tokenizer engine (see `createVSCodeEngine`). The engine needs the
   * `onig.wasm` binary, whose URL only the application knows — so the app
   * creates the engine and hands it in; without one, lines render plain.
   */
  engine = input<TokenizerEngine | Promise<TokenizerEngine> | null>(null);
  /** Token theme: a built-in name or a full VS-Code-shaped theme object. */
  theme = input<ShipCodeTheme | 'ship-dark' | 'ship-light'>('ship-dark');

  readonly resolvedTheme = computed<ShipCodeTheme>(() => {
    const theme = this.theme();
    if (theme === 'ship-dark') return SHIP_DARK;
    if (theme === 'ship-light') return SHIP_LIGHT;
    return theme;
  });

  /** Theme-driven chrome colors, when the theme declares them. */
  readonly themeForeground = computed(() => this.resolvedTheme().colors?.['editor.foreground'] ?? null);
  readonly themeBackground = computed(() => this.resolvedTheme().colors?.['editor.background'] ?? null);

  readonly doc = signal<CodeDocument>(createDocument(''));
  readonly sel = signal<FlatSelection>(flatCaret(0));
  readonly focused = signal(false);

  // Window state
  readonly winStart = signal(0);
  readonly winEnd = signal(0);
  #heights = new BlockHeightMap(1, DEFAULT_LINE_PX);
  #scrollScheduled = false;

  // Text metrics, measured from the probe once the view exists.
  readonly charWidth = signal(8);
  readonly lineHeight = signal(DEFAULT_LINE_PX);

  #history: HistoryEntry[] = [];
  #redoStack: HistoryEntry[] = [];
  #composing = false;
  #isInternalValueUpdate = false;
  #dragSelecting = false;
  #destroyRef = inject(DestroyRef);
  #sanitizer = inject(DomSanitizer);

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  readonly lineCount = computed(() => this.doc().lines.length);

  readonly #virtualOn = computed(() => {
    const mode = this.virtualization();
    return mode === true || (mode === 'auto' && this.lineCount() > VIRTUAL_AUTO_THRESHOLD);
  });

  // Tokenization: an incremental cache over the line column, advanced in
  // background slices so a jump into deep, untokenized territory renders
  // plain text immediately and colors in as the cache catches up.
  readonly #tokenizer = signal<LanguageTokenizer | null>(null);
  #incremental: IncrementalTokenizer | null = null;
  readonly #tokensVersion = signal(0);
  #pumpScheduled = false;

  /**
   * The mounted slice of lines: absolute indices plus each line's rendered
   * HTML. Lines render through [innerHTML] — hand-built from escaped text and
   * generated bucket classes — so a line's DOM is exactly its spans and text
   * nodes, with no template anchor comments.
   */
  readonly visibleLines = computed(() => {
    this.#tokensVersion();
    const theme = this.resolvedTheme();
    const lines = this.doc().lines;
    const from = this.winStart();
    const to = this.winEnd();
    const out: { index: number; html: SafeHtml }[] = [];
    for (let i = from; i < to && i < lines.length; i++) {
      out.push({ index: i, html: this.#sanitizer.bypassSecurityTrustHtml(this.#lineHtml(i, lines[i].text, theme)) });
    }
    return out;
  });

  #lineHtml(line: number, text: string, theme: ShipCodeTheme): string {
    const tokens = this.#incremental?.tokensFor(line);
    if (!tokens || tokens.length === 0) return escapeHtml(text);
    const parts: { text: string; cls: string }[] = [];
    // Merged push: adjacent runs resolving to the same bucket become one span.
    const push = (t: string, cls: string) => {
      if (!t) return;
      const last = parts[parts.length - 1];
      if (last && last.cls === cls) last.text += t;
      else parts.push({ text: t, cls });
    };
    let at = 0;
    for (const token of tokens) {
      if (token.start > at) push(text.slice(at, token.start), '');
      push(text.slice(token.start, token.end), this.#bucketFor(resolveScope(token.scopes, theme)));
      at = token.end;
    }
    if (at < text.length) push(text.slice(at), '');
    return parts.map((p) => (p.cls ? `<span class="${p.cls}">${escapeHtml(p.text)}</span>` : escapeHtml(p.text))).join('');
  }

  // -------------------------------------------------------------------------
  // Style buckets: every distinct resolved token style gets one short class
  // (`t1`, `t2`, …) and a rule in a per-instance stylesheet — the DOM carries
  // two-character classes instead of per-span inline styles or long semantic
  // names, at exact theme fidelity (Monaco's mtk* approach).
  // -------------------------------------------------------------------------

  readonly uid = `shc${nextInstanceId++}`;
  #bucketMap = new Map<string, string>();
  #bucketCss: string[] = [];
  #styleEl: HTMLStyleElement | null = null;

  #bucketFor(styled: StyledToken): string {
    // A token resolving to the theme's plain default needs no span at all —
    // it renders as a bare text node and inherits.
    if (
      !styled.italic &&
      !styled.bold &&
      !styled.underline &&
      (styled.foreground === '' || styled.foreground === (this.resolvedTheme().colors?.['editor.foreground'] ?? ''))
    ) {
      return '';
    }
    const key = `${styled.foreground}|${styled.italic ? 1 : 0}${styled.bold ? 1 : 0}${styled.underline ? 1 : 0}`;
    let cls = this.#bucketMap.get(key);
    if (cls !== undefined) return cls;
    cls = `t${this.#bucketMap.size + 1}`;
    this.#bucketMap.set(key, cls);
    const decl = [
      isSafeColor(styled.foreground) ? `color:${styled.foreground}` : '',
      styled.italic ? 'font-style:italic' : '',
      styled.bold ? 'font-weight:600' : '',
      styled.underline ? 'text-decoration:underline' : '',
    ]
      .filter(Boolean)
      .join(';');
    if (decl) this.#bucketCss.push(`[data-shc="${this.uid}"] .${cls}{${decl}}`);
    this.#syncBucketStyles();
    return cls;
  }

  #syncBucketStyles() {
    if (typeof document === 'undefined') return;
    if (!this.#styleEl) {
      this.#styleEl = document.createElement('style');
      this.#styleEl.setAttribute('data-shc-style', this.uid);
      document.head.appendChild(this.#styleEl);
      this.#destroyRef.onDestroy(() => this.#styleEl?.remove());
    }
    this.#styleEl.textContent = this.#bucketCss.join('\n');
  }

  #resetBuckets() {
    this.#bucketMap.clear();
    this.#bucketCss = [];
    this.#syncBucketStyles();
  }

  readonly padTop = computed(() => {
    this.doc();
    return this.#heights.prefixHeight(this.winStart());
  });
  readonly padBottom = computed(() => {
    this.doc();
    return Math.max(0, this.#heights.total() - this.#heights.prefixHeight(this.winEnd()));
  });

  readonly gutterDigits = computed(() => String(Math.max(1, this.lineCount())).length);

  /** Caret paint box, when the caret's line is mounted. */
  readonly caretBox = computed(() => {
    const range = primaryFlat(this.sel());
    const point = indexFor(this.doc()).pointAt(range.head);
    if (point.line < this.winStart() || point.line >= this.winEnd()) return null;
    return {
      top: this.#heights.prefixHeight(point.line),
      left: point.column * this.charWidth(),
      height: this.lineHeight(),
    };
  });

  /** Per-line selection rectangles for the primary range, window-clipped. */
  readonly selectionRects = computed(() => {
    const range = primaryFlat(this.sel());
    if (isFlatCollapsed(range)) return [];
    const index = indexFor(this.doc());
    const { from, to } = flatOrdered(range);
    const start = index.pointAt(from);
    const end = index.pointAt(to);
    const charW = this.charWidth();
    const lineH = this.lineHeight();
    const rects: { top: number; left: number; width: number; height: number }[] = [];
    const firstLine = Math.max(start.line, this.winStart());
    const lastLine = Math.min(end.line, this.winEnd() - 1);
    for (let line = firstLine; line <= lastLine; line++) {
      const lineText = this.doc().lines[line].text;
      const colFrom = line === start.line ? start.column : 0;
      const colTo = line === end.line ? end.column : lineText.length;
      // A fully swept line paints a newline stub so empty lines stay visible.
      const width = Math.max((colTo - colFrom) * charW, colTo === colFrom ? charW * 0.5 : 0);
      rects.push({ top: this.#heights.prefixHeight(line), left: colFrom * charW, width, height: lineH });
    }
    return rects;
  });

  constructor() {
    // External value → document.
    effect(() => {
      const externalVal = this.value();
      if (this.#isInternalValueUpdate) {
        this.#isInternalValueUpdate = false;
        return;
      }
      untracked(() => {
        const doc = createDocument(externalVal ?? '');
        this.doc.set(doc);
        this.#history = [];
        this.#redoStack = [];
        this.#heights = new BlockHeightMap(doc.lines.length, this.lineHeight());
        const size = indexFor(doc).size;
        const range = primaryFlat(this.sel());
        this.sel.set(flatCaret(Math.min(range.head, size)));
        // A wholesale document swap starts a fresh token cache.
        const tokenizer = this.#tokenizer();
        this.#incremental = tokenizer ? new IncrementalTokenizer(tokenizer) : null;
        this.#tokensVersion.update((v) => v + 1);
        this.#updateWindow();
      });
    });

    // Document → value + window bookkeeping.
    effect(() => {
      const doc = this.doc();
      untracked(() => {
        const serialized = getText(doc);
        if (this.value() !== serialized) {
          this.#isInternalValueUpdate = true;
          this.value.set(serialized);
          this.onChange(serialized);
        }
        this.#updateWindow();
      });
    });

    // Keep the caret's line inside the window.
    effect(() => {
      const range = primaryFlat(this.sel());
      untracked(() => this.#scrollCaretIntoView(range.head));
    });

    // A theme swap invalidates every style bucket.
    effect(() => {
      this.resolvedTheme();
      untracked(() => this.#resetBuckets());
    });

    // Engine + language → a bound tokenizer and a fresh incremental cache.
    effect(() => {
      const engine = this.engine();
      const language = this.language();
      untracked(() => {
        this.#tokenizer.set(null);
        this.#incremental = null;
        this.#tokensVersion.update((v) => v + 1);
        if (!engine || !language) return;
        Promise.resolve(engine)
          .then((e) => e.loadLanguage(language))
          .then((tokenizer) => {
            // Inputs may have moved on while the grammar loaded.
            if (this.engine() !== engine || this.language() !== language) return;
            this.#tokenizer.set(tokenizer);
            this.#incremental = tokenizer ? new IncrementalTokenizer(tokenizer) : null;
            this.#tokensVersion.update((v) => v + 1);
            this.#pumpTokens();
          })
          .catch(() => this.#tokenizer.set(null));
      });
    });

    afterNextRender(() => {
      this.#measureMetrics();
      const scroller = this.scroller().nativeElement;
      scroller.addEventListener('scroll', this.#onScroll, { passive: true });
      this.#destroyRef.onDestroy(() => scroller.removeEventListener('scroll', this.#onScroll));
      this.#updateWindow();
    });
  }

  /** Advance the token cache to the window's end, in background slices. */
  #pumpTokens() {
    const incremental = this.#incremental;
    if (!incremental) return;
    const target = Math.min(this.winEnd(), this.lineCount()) - 1;
    if (target < 0 || incremental.tokenizedUpTo > target) return;
    const done = incremental.ensureUpTo(this.doc(), target, 300);
    this.#tokensVersion.update((v) => v + 1);
    if (!done && !this.#pumpScheduled) {
      this.#pumpScheduled = true;
      setTimeout(() => {
        this.#pumpScheduled = false;
        this.#pumpTokens();
      }, 0);
    }
  }

  /** Mirror one flat change into the token cache as a line splice. */
  #noteTokenSplice(doc: CodeDocument, change: FlatChange) {
    if (!this.#incremental) return;
    const index = indexFor(doc);
    const fromLine = index.pointAt(Math.min(change.from, change.to)).line;
    const toLine = index.pointAt(Math.max(change.from, change.to)).line;
    const insertedLines = 1 + (change.insert.match(/\n/g)?.length ?? 0);
    this.#incremental.spliceLines(fromLine, toLine - fromLine + 1, insertedLines);
  }

  // -------------------------------------------------------------------------
  // ControlValueAccessor
  // -------------------------------------------------------------------------

  writeValue(obj: string | null): void {
    if (obj !== this.value()) this.value.set(obj);
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // -------------------------------------------------------------------------
  // Virtualized window
  // -------------------------------------------------------------------------

  readonly #onScroll = () => {
    if (this.#scrollScheduled) return;
    this.#scrollScheduled = true;
    const run = () => {
      if (!this.#scrollScheduled) return;
      this.#scrollScheduled = false;
      this.#updateWindow();
    };
    requestAnimationFrame(run);
    // rAF is paused in hidden documents; the timeout keeps the window honest there.
    setTimeout(run, 32);
  };

  #updateWindow() {
    const count = this.lineCount();
    if (this.#heights.count !== count) this.#heights = new BlockHeightMap(count, this.lineHeight());
    if (!this.#virtualOn()) {
      this.winStart.set(0);
      this.winEnd.set(count);
      this.#pumpTokens();
      return;
    }
    const scroller = this.scroller?.()?.nativeElement;
    if (!scroller) {
      this.winStart.set(0);
      this.winEnd.set(Math.min(count, 100));
      this.#pumpTokens();
      return;
    }
    const top = scroller.scrollTop;
    const bottom = top + scroller.clientHeight;
    const from = this.#heights.indexAt(top - VIRTUAL_OVERSCAN_PX);
    const to = Math.min(count, this.#heights.indexAt(bottom + VIRTUAL_OVERSCAN_PX) + 1);
    this.winStart.set(from);
    this.winEnd.set(to);
    this.#pumpTokens();
  }

  #measureMetrics() {
    const probe = this.probe().nativeElement;
    const rect = probe.getBoundingClientRect();
    if (rect.width > 0) this.charWidth.set(rect.width / probe.textContent!.length);
    if (rect.height > 0) {
      this.lineHeight.set(rect.height);
      this.#heights = new BlockHeightMap(this.lineCount(), rect.height);
    }
  }

  #scrollCaretIntoView(pos: FlatPos) {
    const scroller = this.scroller?.()?.nativeElement;
    if (!scroller) return;
    const line = indexFor(this.doc()).pointAt(pos).line;
    const top = this.#heights.prefixHeight(line);
    const bottom = top + this.#heights.heightOf(line);
    if (top < scroller.scrollTop) scroller.scrollTop = top;
    else if (bottom > scroller.scrollTop + scroller.clientHeight) {
      scroller.scrollTop = bottom - scroller.clientHeight;
    }
    this.#updateWindow();
  }

  // -------------------------------------------------------------------------
  // Editing
  // -------------------------------------------------------------------------

  #applyChanges(changes: readonly FlatChange[], selAfter?: FlatSelection) {
    if (this.readonly() || changes.length === 0) return;
    const selBefore = this.sel();
    const { doc, inverse } = this.#applyWithTokenBookkeeping(changes);
    const mapped = selAfter ?? flatCaret(mapThroughChanges(primaryFlat(selBefore).head, changes));
    this.#history.push({ inverse, redo: [...changes], selBefore, selAfter: mapped });
    this.#redoStack = [];
    this.doc.set(doc);
    this.sel.set(mapped);
  }

  /** applyFlatChanges, mirroring each step into the token cache first. */
  #applyWithTokenBookkeeping(changes: readonly FlatChange[]): { doc: CodeDocument; inverse: FlatChange[] } {
    let doc = this.doc();
    const inverse: FlatChange[] = [];
    for (const change of changes) {
      this.#noteTokenSplice(doc, change);
      const result = applyFlatChange(doc, change);
      doc = result.doc;
      inverse.unshift(...result.inverse);
    }
    return { doc, inverse };
  }

  /** Replace the current selection with `text` (typing, paste, IME commit). */
  insertText(text: string) {
    const { from, to } = flatOrdered(primaryFlat(this.sel()));
    this.#applyChanges([{ from, to, insert: text }], flatCaret(from + text.length));
  }

  #deleteBackward() {
    const range = primaryFlat(this.sel());
    const { from, to } = flatOrdered(range);
    if (from !== to) return this.#applyChanges([{ from, to, insert: '' }], flatCaret(from));
    if (from === 0) return;
    this.#applyChanges([{ from: from - 1, to: from, insert: '' }], flatCaret(from - 1));
  }

  #deleteForward() {
    const range = primaryFlat(this.sel());
    const { from, to } = flatOrdered(range);
    if (from !== to) return this.#applyChanges([{ from, to, insert: '' }], flatCaret(from));
    if (to >= indexFor(this.doc()).size) return;
    this.#applyChanges([{ from, to: from + 1, insert: '' }], flatCaret(from));
  }

  #undo() {
    const entry = this.#history.pop();
    if (!entry) return;
    const { doc } = this.#applyWithTokenBookkeeping(entry.inverse);
    this.#redoStack.push(entry);
    this.doc.set(doc);
    this.sel.set(entry.selBefore);
  }

  #redo() {
    const entry = this.#redoStack.pop();
    if (!entry) return;
    const { doc } = this.#applyWithTokenBookkeeping(entry.redo);
    this.#history.push(entry);
    this.doc.set(doc);
    this.sel.set(entry.selAfter);
  }

  // -------------------------------------------------------------------------
  // Keyboard
  // -------------------------------------------------------------------------

  #resolvedKeymap(): ShipCodeKeymap {
    const preset = this.keymap();
    if (preset === 'sublime') return SUBLIME_KEYMAP;
    if (preset === 'vscode') return VSCODE_KEYMAP;
    return preset;
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.readonly() || this.#composing) return;
    const isMac = typeof navigator !== 'undefined' && /Mac|iP/.test(navigator.platform);
    const keymap = this.#resolvedKeymap();

    // Motions match with the Shift stripped: Shift+<motion> extends.
    const motionEvent = { ...eventKeys(event), shiftKey: false };
    const motions: Partial<Record<ShipCodeAction, (pos: FlatPos, goal?: number) => MotionResult>> = {
      'code.caret.moveLeft': (pos) => flatMoveLeft(this.doc(), pos),
      'code.caret.moveRight': (pos) => flatMoveRight(this.doc(), pos),
      'code.caret.moveUp': (pos, goal) => flatMoveUp(this.doc(), pos, goal),
      'code.caret.moveDown': (pos, goal) => flatMoveDown(this.doc(), pos, goal),
      'code.caret.moveWordLeft': (pos) => flatMoveWordLeft(this.doc(), pos),
      'code.caret.moveWordRight': (pos) => flatMoveWordRight(this.doc(), pos),
      'code.caret.moveLineStart': (pos) => flatMoveLineStart(this.doc(), pos),
      'code.caret.moveLineEnd': (pos) => flatMoveLineEnd(this.doc(), pos),
      'code.caret.moveDocStart': () => flatMoveDocStart(),
      'code.caret.moveDocEnd': () => flatMoveDocEnd(this.doc()),
    };
    for (const [action, move] of Object.entries(motions)) {
      if (!matchesShortcut(motionEvent, keymap[action as ShipCodeAction], isMac)) continue;
      event.preventDefault();
      const range = primaryFlat(this.sel());
      const motion = move!(range.head, range.goalColumn);
      const horizontal = action === 'code.caret.moveLeft' || action === 'code.caret.moveRight';
      const collapseEdge = horizontal ? (action === 'code.caret.moveLeft' ? 'from' : 'to') : undefined;
      this.sel.set(applyMotion(this.sel(), motion, event.shiftKey, collapseEdge as 'from' | 'to' | undefined));
      return;
    }

    const match = (action: ShipCodeAction) => matchesShortcut(event, keymap[action], isMac);

    if (match('code.selection.selectAll')) {
      event.preventDefault();
      return this.sel.set({ ranges: [flatSelectAll(this.doc())] });
    }
    if (match('code.selection.selectWord')) {
      event.preventDefault();
      return this.sel.set({ ranges: [flatSelectWord(this.doc(), primaryFlat(this.sel()).head)] });
    }
    if (match('code.selection.selectLine')) {
      event.preventDefault();
      return this.sel.set({ ranges: [flatSelectLine(this.doc(), primaryFlat(this.sel()).head)] });
    }
    if (match('code.edit.undo')) {
      event.preventDefault();
      return this.#undo();
    }
    if (match('code.edit.redo')) {
      event.preventDefault();
      return this.#redo();
    }
    if (match('code.edit.indent')) {
      event.preventDefault();
      return this.#indent(1);
    }
    if (match('code.edit.outdent')) {
      event.preventDefault();
      return this.#indent(-1);
    }
    if (match('code.edit.deleteLine')) {
      event.preventDefault();
      return this.#deleteLine();
    }
    if (match('code.edit.duplicateLine')) {
      event.preventDefault();
      return this.#duplicateLine();
    }
    if (match('code.edit.moveLineUp')) {
      event.preventDefault();
      return this.#moveLine(-1);
    }
    if (match('code.edit.moveLineDown')) {
      event.preventDefault();
      return this.#moveLine(1);
    }
    if (match('code.edit.deleteWordLeft')) {
      event.preventDefault();
      const head = primaryFlat(this.sel()).head;
      const target = flatMoveWordLeft(this.doc(), head).head;
      if (target < head) this.#applyChanges([{ from: target, to: head, insert: '' }], flatCaret(target));
      return;
    }
    if (match('code.edit.deleteWordRight')) {
      event.preventDefault();
      const head = primaryFlat(this.sel()).head;
      const target = flatMoveWordRight(this.doc(), head).head;
      if (target > head) this.#applyChanges([{ from: head, to: target, insert: '' }], flatCaret(head));
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      return this.#deleteBackward();
    }
    if (event.key === 'Delete') {
      event.preventDefault();
      return this.#deleteForward();
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      return this.insertText('\n');
    }
  }

  #indent(direction: 1 | -1) {
    const index = indexFor(this.doc());
    const { from, to } = flatOrdered(primaryFlat(this.sel()));
    const firstLine = index.pointAt(from).line;
    const lastLine = index.pointAt(to).line;
    if (direction === 1 && from === to) return this.insertText('  ');
    const changes: FlatChange[] = [];
    for (let line = firstLine; line <= lastLine; line++) {
      const start = index.startOf(line);
      if (direction === 1) changes.push({ from: start, to: start, insert: '  ' });
      else {
        const text = this.doc().lines[line].text;
        const strip = Math.min(2, text.length - text.trimStart().length);
        if (strip > 0) changes.push({ from: start, to: start + strip, insert: '' });
      }
    }
    if (!changes.length) return;
    // Later changes first, so earlier offsets stay valid within one pass.
    changes.sort((a, b) => b.from - a.from);
    const selAfter = { ranges: [{ anchor: mapThroughChanges(from, changes), head: mapThroughChanges(to, changes) }] };
    this.#applyChanges(changes, selAfter);
  }

  #deleteLine() {
    const index = indexFor(this.doc());
    const line = index.pointAt(primaryFlat(this.sel()).head).line;
    const from = index.startOf(line);
    const to = line < index.lineCount - 1 ? index.startOf(line + 1) : index.size;
    const realFrom = line === index.lineCount - 1 && line > 0 ? index.endOf(line - 1) : from;
    this.#applyChanges([{ from: realFrom, to, insert: '' }], flatCaret(Math.min(realFrom, index.size)));
  }

  #duplicateLine() {
    const index = indexFor(this.doc());
    const line = index.pointAt(primaryFlat(this.sel()).head).line;
    const text = this.doc().lines[line].text;
    const at = index.endOf(line);
    this.#applyChanges([{ from: at, to: at, insert: '\n' + text }]);
  }

  #moveLine(direction: -1 | 1) {
    const index = indexFor(this.doc());
    const point = index.pointAt(primaryFlat(this.sel()).head);
    const target = point.line + direction;
    if (target < 0 || target >= index.lineCount) return;
    const a = Math.min(point.line, target);
    const b = Math.max(point.line, target);
    const lineA = this.doc().lines[a].text;
    const lineB = this.doc().lines[b].text;
    const from = index.startOf(a);
    const to = index.endOf(b);
    this.#applyChanges(
      [{ from, to, insert: `${lineB}\n${lineA}` }],
      flatCaret(from + (direction === -1 ? 0 : lineB.length + 1) + point.column)
    );
  }

  // -------------------------------------------------------------------------
  // Text input (hidden textarea)
  // -------------------------------------------------------------------------

  onInput() {
    if (this.readonly() || this.#composing) return;
    this.#commitInputArea();
  }

  onCompositionStart() {
    this.#composing = true;
  }

  onCompositionEnd() {
    this.#composing = false;
    this.#commitInputArea();
  }

  #commitInputArea() {
    const area = this.inputArea().nativeElement;
    if (!area.value) return;
    this.insertText(area.value.replace(/\r\n?/g, '\n'));
    area.value = '';
  }

  onCopy(event: ClipboardEvent) {
    const { from, to } = flatOrdered(primaryFlat(this.sel()));
    if (from === to || !event.clipboardData) return;
    event.preventDefault();
    event.clipboardData.setData('text/plain', indexFor(this.doc()).sliceText(from, to));
  }

  onCut(event: ClipboardEvent) {
    if (this.readonly()) return;
    const { from, to } = flatOrdered(primaryFlat(this.sel()));
    if (from === to || !event.clipboardData) return;
    event.preventDefault();
    event.clipboardData.setData('text/plain', indexFor(this.doc()).sliceText(from, to));
    this.#applyChanges([{ from, to, insert: '' }], flatCaret(from));
  }

  onFocus() {
    this.focused.set(true);
  }
  onBlur() {
    this.focused.set(false);
    this.onTouched();
  }

  // -------------------------------------------------------------------------
  // Mouse
  // -------------------------------------------------------------------------

  onContentMouseDown(event: MouseEvent) {
    if (event.button !== 0) return;
    event.preventDefault();
    const pos = this.#posFromMouse(event);
    if (event.detail >= 3) this.sel.set({ ranges: [flatSelectLine(this.doc(), pos)] });
    else if (event.detail === 2) this.sel.set({ ranges: [flatSelectWord(this.doc(), pos)] });
    else if (event.shiftKey) this.sel.set({ ranges: [{ anchor: primaryFlat(this.sel()).anchor, head: pos }] });
    else {
      this.sel.set(flatCaret(pos));
      this.#dragSelecting = true;
    }
    this.inputArea().nativeElement.focus({ preventScroll: true });
  }

  onContentMouseMove(event: MouseEvent) {
    if (!this.#dragSelecting || event.buttons !== 1) return;
    const pos = this.#posFromMouse(event);
    const anchor = primaryFlat(this.sel()).anchor;
    this.sel.set({ ranges: [{ anchor, head: pos }] });
  }

  onDocumentMouseUp() {
    this.#dragSelecting = false;
  }

  #posFromMouse(event: MouseEvent): FlatPos {
    const content = (event.currentTarget as HTMLElement).closest('.sh-code-content') ?? (event.currentTarget as HTMLElement);
    const rect = content.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const x = event.clientX - rect.left;
    const line = this.#heights.indexAt(y);
    const column = Math.max(0, Math.round(x / this.charWidth()));
    return indexFor(this.doc()).posOf({ line, column });
  }
}

function eventKeys(event: KeyboardEvent) {
  return {
    key: event.key,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
  };
}
