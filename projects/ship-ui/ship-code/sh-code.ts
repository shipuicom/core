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
import { applyFlatChangesBatched } from './core/flat-edit';
import {
  addFlatRange,
  allOccurrences,
  applyMotionAll,
  collapseToPrimary,
  fanOutEdit,
  isMultiRange,
  mapSelectionThroughChanges,
  nextOccurrence,
  normalizeSelection,
  rangesInSpan,
  setPrimaryRange,
} from './core/flat-multi';
import {
  FlatRange,
  FlatSelection,
  MotionResult,
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
  flatStepLeft,
  flatStepRight,
  isFlatCollapsed,
  primaryFlat,
} from './core/flat-motion';
import { moveLines } from './core/line-move';
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

/** Sentinel: no internal `value` write is awaiting its echo. */
const NO_ECHO: unknown = Symbol('no-echo');

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
  caretLayer = viewChild<ElementRef<HTMLElement>>('caretLayer');
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
  /**
   * Multi-cursor gestures: Alt+click, add caret above/below, and the
   * progressive Cmd/Ctrl+D and select-all-occurrences.
   *
   * On by default — a code surface is where people expect them. Turning it off
   * only closes the ways a second cursor gets created; the selection model is
   * the same either way, so a single cursor behaves identically.
   */
  multiCursor = input(true);
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
  /** The element the scroll listener is currently bound to. */
  #scrollHooked: HTMLElement | null = null;
  readonly #viewReady = signal(false);

  // Text metrics, measured from the probe once the view exists.
  readonly charWidth = signal(8);
  readonly lineHeight = signal(DEFAULT_LINE_PX);

  #history: HistoryEntry[] = [];
  #redoStack: HistoryEntry[] = [];
  #composing = false;
  /**
   * The exact value the last internal write pushed into `value()`. Effects
   * coalesce, so a boolean "skip the next run" flag would also swallow an
   * external write-back landing in the same flush (a subscriber calling
   * writeValue synchronously from onChange); comparing against the written
   * value itself skips only our own echo.
   */
  #echoValue: unknown = NO_ECHO;
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

  /**
   * The mounted window as a flat span — the slice of the document that has
   * real DOM and is therefore the only slice worth painting.
   */
  readonly #windowSpan = computed(() => {
    const index = indexFor(this.doc());
    const first = this.winStart();
    const last = Math.max(first, this.winEnd() - 1);
    return { from: index.startOf(first), to: index.endOf(last) };
  });

  /**
   * The cursors with anything on screen.
   *
   * Everything painted below starts here rather than from `sel().ranges`:
   * select-all-occurrences can leave tens of thousands of cursors live, and a
   * scroll frame must cost what the window costs, not what the selection does.
   */
  readonly #paintedRanges = computed(() => {
    const span = this.#windowSpan();
    return rangesInSpan(this.sel(), span.from, span.to);
  });

  /** Caret paint boxes — one per cursor whose head line is mounted. */
  readonly caretBoxes = computed(() => {
    const index = indexFor(this.doc());
    const primary = primaryFlat(this.sel());
    const charW = this.charWidth();
    const lineH = this.lineHeight();
    const boxes: { top: number; left: number; height: number; primary: boolean }[] = [];
    for (const range of this.#paintedRanges()) {
      const point = index.pointAt(range.head);
      if (point.line < this.winStart() || point.line >= this.winEnd()) continue;
      boxes.push({
        top: this.#heights.prefixHeight(point.line),
        left: point.column * charW,
        height: lineH,
        primary: range === primary,
      });
    }
    return boxes;
  });

  /** Per-line selection rectangles for every mounted cursor, window-clipped. */
  readonly selectionRects = computed(() => {
    const index = indexFor(this.doc());
    const lines = this.doc().lines;
    const charW = this.charWidth();
    const lineH = this.lineHeight();
    const winStart = this.winStart();
    const winEnd = this.winEnd();
    const rects: { top: number; left: number; width: number; height: number }[] = [];
    for (const range of this.#paintedRanges()) {
      if (isFlatCollapsed(range)) continue;
      const { from, to } = flatOrdered(range);
      const start = index.pointAt(from);
      const end = index.pointAt(to);
      const firstLine = Math.max(start.line, winStart);
      const lastLine = Math.min(end.line, winEnd - 1);
      for (let line = firstLine; line <= lastLine; line++) {
        // A selection ending exactly at a line's column 0 holds nothing on
        // that line — skip it, or the newline stub paints a phantom sliver.
        if (line === end.line && line !== start.line && end.column === 0) continue;
        const colFrom = line === start.line ? start.column : 0;
        const colTo = line === end.line ? end.column : lines[line].text.length;
        // A fully swept line paints a newline stub so empty lines stay visible.
        const width = Math.max((colTo - colFrom) * charW, colTo === colFrom ? charW * 0.5 : 0);
        rects.push({ top: this.#heights.prefixHeight(line), left: colFrom * charW, width, height: lineH });
      }
    }
    return rects;
  });

  constructor() {
    // External value → document.
    effect(() => {
      const externalVal = this.value();
      const isEcho = externalVal === this.#echoValue;
      this.#echoValue = NO_ECHO;
      if (isEcho) return;
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
          this.#echoValue = serialized;
          this.value.set(serialized);
          this.onChange(serialized);
        }
        this.#updateWindow();
      });
    });

    // Keep the caret's line inside the window, and restart the blink so the
    // carets are solid the instant they move — the phase the whole layer
    // shares is also the phase a newly opened cursor starts in.
    effect(() => {
      const sel = this.sel();
      const range = primaryFlat(sel);
      untracked(() => {
        this.#scrollCaretIntoView(range.head);
        this.#restartCaretBlink();
      });
    });

    // Switching multi-cursor off mid-session must not strand the cursors that
    // are already open.
    effect(() => {
      if (this.multiCursor()) return;
      untracked(() => this.sel.set(collapseToPrimary(this.sel())));
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
          .catch(() => {
            // Same staleness guard as the success path: a slow-failing load
            // for a previous language must not null a newer tokenizer.
            if (this.engine() !== engine || this.language() !== language) return;
            this.#tokenizer.set(null);
            this.#incremental = null;
            this.#tokensVersion.update((v) => v + 1);
          });
      });
    });

    // Bind the scroll listener to whichever element is *currently* the
    // scroller, rebinding if that element is ever replaced.
    //
    // Attaching once after the first render is not enough: the view can be
    // re-created under a live component instance (dev HMR does exactly this —
    // `sh-editor`'s render pass carries a `#lastSurface` guard for the same
    // reason). The listener then sits on a detached element, the window never
    // moves again, and virtualization only appears to work because moving the
    // caret calls `#updateWindow` by another route.
    effect(() => {
      if (!this.#viewReady()) return;
      const scroller = this.scroller().nativeElement;
      untracked(() => this.#hookScroller(scroller));
    });
    this.#destroyRef.onDestroy(() => this.#scrollHooked?.removeEventListener('scroll', this.#onScroll));
    // A component destroyed mid-drag must not leave window listeners behind.
    this.#destroyRef.onDestroy(() => this.#onDragUp());

    afterNextRender(() => {
      this.#measureMetrics();
      this.#viewReady.set(true);
      this.#updateWindow();
    });
  }

  #hookScroller(scroller: HTMLElement) {
    if (scroller === this.#scrollHooked) return;
    this.#scrollHooked?.removeEventListener('scroll', this.#onScroll);
    this.#scrollHooked = scroller;
    scroller.addEventListener('scroll', this.#onScroll, { passive: true });
    // A replaced view brings fresh metrics and a window computed against the
    // element that just went away.
    this.#measureMetrics();
    this.#updateWindow();
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

  /**
   * Mirror a batch of flat changes into the token cache as line splices.
   *
   * The changes address the original document, so they are replayed ascending
   * with a running line delta — each splice only has to account for the ones
   * already applied below it.
   */
  #noteTokenSplices(doc: CodeDocument, changes: readonly FlatChange[]) {
    if (!this.#incremental) return;
    const index = indexFor(doc);
    const ascending = [...changes].sort((a, b) => a.from - b.from);
    let lineDelta = 0;
    for (const change of ascending) {
      const fromLine = index.pointAt(Math.min(change.from, change.to)).line;
      const toLine = index.pointAt(Math.max(change.from, change.to)).line;
      const removedLines = toLine - fromLine + 1;
      const insertedLines = 1 + (change.insert.match(/\n/g)?.length ?? 0);
      this.#incremental.spliceLines(fromLine + lineDelta, removedLines, insertedLines);
      lineDelta += insertedLines - removedLines;
    }
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

  /**
   * Rewind the shared blink clock.
   *
   * There is one animation on the caret layer, so rewinding it puts every
   * caret — including one added this tick — at the start of the same cycle.
   */
  #restartCaretBlink() {
    const layer = this.caretLayer?.()?.nativeElement;
    if (!layer?.getAnimations) return;
    for (const animation of layer.getAnimations()) animation.currentTime = 0;
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
    const mapped = selAfter ?? mapSelectionThroughChanges(selBefore, changes);
    this.#history.push({ inverse, redo: [...changes], selBefore, selAfter: mapped });
    this.#redoStack = [];
    this.doc.set(doc);
    this.sel.set(mapped);
  }

  /** The batched apply, mirroring the whole batch into the token cache first. */
  #applyWithTokenBookkeeping(changes: readonly FlatChange[]): { doc: CodeDocument; inverse: readonly FlatChange[] } {
    const doc = this.doc();
    this.#noteTokenSplices(doc, changes);
    return applyFlatChangesBatched(doc, changes);
  }

  /**
   * Run one edit per cursor as a single transaction — one history entry and
   * one undo however many cursors are live.
   */
  #editEachCursor(edit: (range: FlatRange, index: number) => { change: FlatChange; at: FlatPos } | null) {
    if (this.readonly()) return;
    const out = fanOutEdit(this.sel(), (range, i) => {
      const result = edit(range, i);
      return result && { change: result.change, anchorAfter: result.at, headAfter: result.at };
    });
    if (out) this.#applyChanges(out.changes, out.selection);
  }

  /** Replace every cursor's selection with `text` (typing, paste, IME commit). */
  insertText(text: string) {
    this.#editEachCursor((range) => {
      const { from, to } = flatOrdered(range);
      if (from === to && !text) return null;
      return { change: { from, to, insert: text }, at: from + text.length };
    });
  }

  #deleteBackward() {
    this.#editEachCursor((range) => {
      const { from, to } = flatOrdered(range);
      if (from !== to) return { change: { from, to, insert: '' }, at: from };
      if (from === 0) return null;
      // Step over a whole surrogate pair — deleting one half strands the other.
      const target = from - flatStepLeft(this.doc(), from);
      return { change: { from: target, to: from, insert: '' }, at: target };
    });
  }

  #deleteForward() {
    const size = indexFor(this.doc()).size;
    this.#editEachCursor((range) => {
      const { from, to } = flatOrdered(range);
      if (from !== to) return { change: { from, to, insert: '' }, at: from };
      if (to >= size) return null;
      return { change: { from, to: from + flatStepRight(this.doc(), from), insert: '' }, at: from };
    });
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
    if (this.#composing) return;
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
      const horizontal = action === 'code.caret.moveLeft' || action === 'code.caret.moveRight';
      const collapseEdge = horizontal ? (action === 'code.caret.moveLeft' ? 'from' : 'to') : undefined;
      // Every cursor moves, each from its own head; ones that collide merge.
      this.sel.set(applyMotionAll(this.sel(), move!, event.shiftKey, collapseEdge as 'from' | 'to' | undefined));
      return;
    }

    const match = (action: ShipCodeAction) => matchesShortcut(event, keymap[action], isMac);

    if (match('code.selection.selectAll')) {
      event.preventDefault();
      return this.sel.set({ ranges: [flatSelectAll(this.doc())] });
    }
    if (match('code.selection.selectWord')) {
      event.preventDefault();
      return this.#selectWordOrAddNextOccurrence();
    }
    if (match('code.selection.selectLine')) {
      event.preventDefault();
      // Each cursor takes its own line; cursors sharing one merge into it.
      return this.sel.set(
        normalizeSelection(
          this.sel().ranges.map((range) => flatSelectLine(this.doc(), range.head)),
          this.sel().primary ?? 0
        )
      );
    }
    if (match('code.selection.selectAllOccurrences')) {
      event.preventDefault();
      return this.#selectAllOccurrences();
    }
    if (match('code.selection.addCaretAbove')) {
      event.preventDefault();
      return this.#addCaret(-1);
    }
    if (match('code.selection.addCaretBelow')) {
      event.preventDefault();
      return this.#addCaret(1);
    }
    if (match('code.selection.collapseCarets')) {
      if (!isMultiRange(this.sel())) return;
      event.preventDefault();
      return this.sel.set(collapseToPrimary(this.sel()));
    }
    // Readonly still navigates and selects — arrows, Home/End, select-all,
    // even extra carets — it only stops here, where the document mutates.
    if (this.readonly()) return;

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
      return this.#editEachCursor((range) => {
        const target = flatMoveWordLeft(this.doc(), range.head).head;
        if (target >= range.head) return null;
        return { change: { from: target, to: range.head, insert: '' }, at: target };
      });
    }
    if (match('code.edit.deleteWordRight')) {
      event.preventDefault();
      return this.#editEachCursor((range) => {
        const target = flatMoveWordRight(this.doc(), range.head).head;
        if (target <= range.head) return null;
        return { change: { from: range.head, to: target, insert: '' }, at: range.head };
      });
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

  /**
   * The distinct lines the cursors touch, ascending.
   *
   * Line-oriented commands dedupe through this: two cursors on one line must
   * indent it once, not twice, and must not emit two overlapping changes.
   */
  #touchedLines(): number[] {
    const index = indexFor(this.doc());
    const lines: number[] = [];
    for (const range of this.sel().ranges) {
      const { from, to } = flatOrdered(range);
      const first = index.pointAt(from).line;
      const last = index.pointAt(to).line;
      for (let line = first; line <= last; line++) {
        if (lines[lines.length - 1] !== line) lines.push(line);
      }
    }
    return lines;
  }

  #indent(direction: 1 | -1) {
    // Plain carets indent in place; the moment any cursor has a selection the
    // gesture becomes line-oriented, which is what every editor does.
    if (direction === 1 && this.sel().ranges.every(isFlatCollapsed)) return this.insertText('  ');

    const index = indexFor(this.doc());
    const changes: FlatChange[] = [];
    for (const line of this.#touchedLines()) {
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
    this.#applyChanges(changes, mapSelectionThroughChanges(this.sel(), changes));
  }

  #deleteLine() {
    const index = indexFor(this.doc());
    const lineCount = index.lineCount;
    const changes: FlatChange[] = [];
    // Consecutive lines collapse into one run: per-line changes would overlap
    // at the document end, where the last line borrows the newline above it.
    const lines = this.#touchedLines();
    for (let i = 0; i < lines.length; i++) {
      let j = i;
      while (j + 1 < lines.length && lines[j + 1] === lines[j] + 1) j++;
      const first = lines[i];
      const last = lines[j];
      const to = last < lineCount - 1 ? index.startOf(last + 1) : index.size;
      // The last line has no newline of its own, so it takes the one above it.
      const from = last === lineCount - 1 && first > 0 ? index.endOf(first - 1) : index.startOf(first);
      changes.push({ from, to, insert: '' });
      i = j;
    }
    if (!changes.length) return;
    changes.sort((a, b) => b.from - a.from);
    this.#applyChanges(changes, mapSelectionThroughChanges(this.sel(), changes));
  }

  #duplicateLine() {
    const index = indexFor(this.doc());
    const changes: FlatChange[] = [];
    for (const line of this.#touchedLines()) {
      const at = index.endOf(line);
      changes.push({ from: at, to: at, insert: '\n' + this.doc().lines[line].text });
    }
    if (!changes.length) return;
    changes.sort((a, b) => b.from - a.from);
    this.#applyChanges(changes);
  }

  /**
   * Cmd/Ctrl+D, progressive: select the word under the caret, then keep adding
   * the next occurrence of what is already selected — the VS Code gesture.
   *
   * The search runs over the whole document, never the mounted window: the
   * next occurrence is usually off-screen, which is the entire point.
   */
  #selectWordOrAddNextOccurrence() {
    const sel = this.sel();
    const primary = primaryFlat(sel);
    if (isFlatCollapsed(primary) || !this.multiCursor()) {
      return this.sel.set(setPrimaryRange(sel, flatSelectWord(this.doc(), primary.head)));
    }
    const index = indexFor(this.doc());
    const { from, to } = flatOrdered(primary);
    const needle = index.sliceText(from, to);
    let searchFrom = 0;
    for (const range of sel.ranges) searchFrom = Math.max(searchFrom, flatOrdered(range).to);
    const found = nextOccurrence(getText(this.doc()), needle, searchFrom);
    if (!found) return;
    this.sel.set(addFlatRange(sel, { anchor: found.from, head: found.to }));
  }

  /** Cmd/Ctrl+Shift+L — a cursor on every occurrence of the current selection. */
  #selectAllOccurrences() {
    if (!this.multiCursor()) return;
    const sel = this.sel();
    const primary = primaryFlat(sel);
    const index = indexFor(this.doc());
    const seed = isFlatCollapsed(primary) ? flatSelectWord(this.doc(), primary.head) : primary;
    const { from, to } = flatOrdered(seed);
    const needle = index.sliceText(from, to);
    if (!needle) return;
    const found = allOccurrences(getText(this.doc()), needle);
    if (!found.length) return;
    const at = found.findIndex((occurrence) => occurrence.from === from);
    this.sel.set(
      normalizeSelection(
        found.map((occurrence) => ({ anchor: occurrence.from, head: occurrence.to })),
        at < 0 ? 0 : at
      )
    );
  }

  /**
   * Add a caret one line above or below, in the classic column.
   *
   * It grows from the cursor at the leading edge rather than from the primary,
   * so holding the shortcut extends the column instead of oscillating.
   */
  #addCaret(direction: -1 | 1) {
    if (!this.multiCursor()) return;
    const sel = this.sel();
    const edge = direction === -1 ? sel.ranges[0] : sel.ranges[sel.ranges.length - 1];
    const motion = direction === -1
      ? flatMoveUp(this.doc(), edge.head, edge.goalColumn)
      : flatMoveDown(this.doc(), edge.head, edge.goalColumn);
    // Already against the document edge: nothing to add.
    if (motion.head === edge.head) return;
    this.sel.set(addFlatRange(sel, { anchor: motion.head, head: motion.head, goalColumn: motion.goalColumn }));
  }

  /**
   * Move the selected lines one slot up or down. A collapsed selection moves
   * its own line; a multi-line selection moves the whole span as one unit,
   * with the selection riding along so holding the shortcut keeps working.
   */
  #moveLine(direction: -1 | 1) {
    const move = moveLines(this.doc(), this.sel(), direction);
    if (move) this.#applyChanges(move.changes, move.selection);
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
    // IME composition has one preedit buffer and one caret to attach it to.
    // Every editor collapses to a single cursor here rather than pretending.
    this.sel.set(collapseToPrimary(this.sel()));
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

  /** Every cursor's text, joined by newlines — the shape paste reads back. */
  #selectedText(): string {
    const index = indexFor(this.doc());
    const parts = this.sel().ranges.map((range) => {
      const { from, to } = flatOrdered(range);
      return index.sliceText(from, to);
    });
    return parts.some((part) => part !== '') ? parts.join('\n') : '';
  }

  onCopy(event: ClipboardEvent) {
    const text = this.#selectedText();
    if (!text || !event.clipboardData) return;
    event.preventDefault();
    event.clipboardData.setData('text/plain', text);
  }

  onCut(event: ClipboardEvent) {
    if (this.readonly()) return;
    const text = this.#selectedText();
    if (!text || !event.clipboardData) return;
    event.preventDefault();
    event.clipboardData.setData('text/plain', text);
    this.#editEachCursor((range) => {
      const { from, to } = flatOrdered(range);
      if (from === to) return null;
      return { change: { from, to, insert: '' }, at: from };
    });
  }

  /**
   * Paste, distributing across cursors when the shapes line up.
   *
   * A clipboard whose line count matches the cursor count came from a
   * multi-cursor copy (here or in any other editor), so each cursor takes its
   * own line. Anything else is inserted whole at every cursor.
   */
  onPaste(event: ClipboardEvent) {
    if (this.readonly() || this.#composing) return;
    const raw = event.clipboardData?.getData('text/plain');
    if (raw === undefined || raw === '') return;
    event.preventDefault();
    const text = raw.replace(/\r\n?/g, '\n');
    const lines = text.split('\n');
    if (isMultiRange(this.sel()) && lines.length === this.sel().ranges.length) {
      return this.#editEachCursor((range, i) => {
        const { from, to } = flatOrdered(range);
        return { change: { from, to, insert: lines[i] }, at: from + lines[i].length };
      });
    }
    this.insertText(text);
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
    // Alt keeps the existing cursors and opens another; without it a click is
    // a fresh single selection.
    const add = event.altKey && this.multiCursor();
    const set = (range: FlatRange) =>
      this.sel.set(add ? addFlatRange(this.sel(), range) : normalizeSelection([range]));

    if (event.detail >= 3) set(flatSelectLine(this.doc(), pos));
    else if (event.detail === 2) set(flatSelectWord(this.doc(), pos));
    else if (event.shiftKey) this.sel.set(setPrimaryRange(this.sel(), { anchor: primaryFlat(this.sel()).anchor, head: pos }));
    else {
      set({ anchor: pos, head: pos });
      this.#dragSelecting = true;
      // The drag tracks on the window, not the content element: element-bound
      // moves stop at the editor's border, stranding the selection the moment
      // the pointer leaves — and the scroll-into-view effect on the moving
      // head is what auto-scrolls a drag past the viewport edge.
      window.addEventListener('mousemove', this.#onDragMove);
      window.addEventListener('mouseup', this.#onDragUp);
    }
    this.inputArea().nativeElement.focus({ preventScroll: true });
  }

  readonly #onDragMove = (event: MouseEvent) => {
    if (!this.#dragSelecting || event.buttons !== 1) return;
    const pos = this.#posFromMouse(event);
    // The drag owns the primary range — the cursor the mousedown just created,
    // whether that was a plain click or an Alt+click adding to the set.
    const anchor = primaryFlat(this.sel()).anchor;
    this.sel.set(setPrimaryRange(this.sel(), { anchor, head: pos }));
  };

  readonly #onDragUp = () => {
    this.#dragSelecting = false;
    if (typeof window === 'undefined') return;
    window.removeEventListener('mousemove', this.#onDragMove);
    window.removeEventListener('mouseup', this.#onDragUp);
  };

  #posFromMouse(event: MouseEvent): FlatPos {
    const content = this.scroller().nativeElement.querySelector('.sh-code-content') as HTMLElement;
    const rect = content.getBoundingClientRect();
    // `rect.top` is the border box, and the top padding is exactly the window's
    // prefix height — so this y is already in document coordinates.
    const y = event.clientY - rect.top;
    const x = event.clientX - this.#textOriginX(content, rect);
    const line = this.#heights.indexAt(y);
    const column = Math.max(0, Math.round(x / this.charWidth()));
    return indexFor(this.doc()).posOf({ line, column });
  }

  /**
   * Client x of column 0.
   *
   * Carets and selection rects are positioned in content-box coordinates and
   * shifted by the content's left padding in CSS. Hit-testing has to start from
   * that same origin: measured from the border box instead, the padding reads
   * as a character and change worth of text, so clicking the left half of the
   * first character on a line lands the caret after it.
   *
   * A mounted line's own left edge *is* the content-box origin, so it is read
   * from layout rather than kept in step with the stylesheet by hand.
   */
  #textOriginX(content: Element, rect: DOMRect): number {
    const line = content.querySelector('.sh-code-line');
    if (line) return line.getBoundingClientRect().left;
    return rect.left + parseFloat(getComputedStyle(content).paddingLeft || '0');
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
