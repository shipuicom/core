import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ShipA11yAnnouncerService } from '@ship-ui/core/ship-a11y-announcer';
import { ShipVirtualWindow } from '@ship-ui/core/ship-virtual-scroll';
import { sheetRangeToHtml, sheetRangeToTsv } from './core/sheet-clipboard';
import {
  SheetModel,
  SheetSelection,
  cellAt,
  normalizedRange,
  primarySheetRange,
  sheetCellSelection,
} from './core/sheet-model';

/** Pixels of rows/columns kept mounted beyond each viewport edge. */
const OVERSCAN_PX = 200;
/** Window assumed before the scroller has laid out (SSR, first frame). */
const FALLBACK_ROWS = 40;
const FALLBACK_COLS = 20;

let nextInstanceId = 1;

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** The selection with the active range's head corner moved to (row, col). */
function withActiveHead(selection: SheetSelection, row: number, col: number): SheetSelection {
  const ranges = selection.ranges.slice();
  const active = ranges[ranges.length - 1];
  ranges[ranges.length - 1] = { ...active, r1: row, c1: col };
  return { ranges };
}

/** Spreadsheet column label: 0 → A, 25 → Z, 26 → AA. */
function colLabel(index: number): string {
  let label = '';
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

/**
 * `<sh-spreadsheet>` — the lean read-only spreadsheet renderer. An immutable
 * `SheetModel` in, display state (selection) alongside; two `ShipVirtualWindow`
 * instances — one per axis, the column one horizontal — drive the virtualized
 * window exactly as `sh-code` virtualizes lines. It does not know editing
 * exists: a future editable composer wraps this view and floats its own
 * editing overlay above it.
 *
 * Interaction owned here is display-side only: mouse drag paints a
 * rectangular selection, and the native copy event writes TSV + `<table>`
 * clipboard flavors. Anything richer belongs to the composing layer.
 */
@Component({
  selector: 'sh-spreadsheet',
  standalone: true,
  exportAs: 'shSpreadsheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './sh-spreadsheet.html',
  styleUrl: './sh-spreadsheet.scss',
  host: {
    '[attr.data-shs]': 'uid',
    '[style.--shs-row-h.px]': 'defaultRowHeight()',
    '[style.--shs-head-w.px]': 'headOffset()',
  },
})
export class ShipSpreadsheet {
  scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  frame = viewChild.required<ElementRef<HTMLElement>>('frame');

  /** The immutable sheet snapshot to render. */
  sheet = input.required<SheetModel>();
  /**
   * Two-way bound selection, `null` when nothing is selected. Mouse gestures
   * follow the spreadsheet conventions: click selects, drag sweeps,
   * Shift+click moves the active range's far corner, Cmd/Ctrl+click starts
   * an additional range.
   */
  selection = model<SheetSelection | null>(null);
  /** Width for columns without an explicit width. */
  defaultColWidth = input(96);
  /** Height for rows without an explicit height. */
  defaultRowHeight = input(28);
  /** Show the A/B/C column header and 1/2/3 row header rails. */
  headers = input(true);
  /** When `false`, mouse selection is off — pure display surface. */
  selectable = input(true);

  readonly uid = `shs${nextInstanceId++}`;

  // Two shared windowing engines, one per axis — sizes are heights on the
  // row axis, widths on the column axis.
  #rowWin = new ShipVirtualWindow({ count: 0, estimate: 28, overscan: OVERSCAN_PX });
  #colWin = new ShipVirtualWindow({ count: 0, estimate: 96, overscan: OVERSCAN_PX, axis: 'horizontal' });

  // Window state: the mounted slice on each axis.
  readonly rowStart = this.#rowWin.start;
  readonly rowEnd = this.#rowWin.end;
  readonly colStart = this.#colWin.start;
  readonly colEnd = this.#colWin.end;

  /** Bumped when the maps are rebuilt, so geometry computeds re-read them. */
  readonly #geometry = signal(0);
  #scrollScheduled = false;
  #dragging = false;
  #destroyRef = inject(DestroyRef);
  #sanitizer = inject(DomSanitizer);
  #announcer = inject(ShipA11yAnnouncerService);
  #styleEl: HTMLStyleElement | null = null;

  readonly headOffset = computed(() => (this.headers() ? 44 : 0));

  readonly contentWidth = computed(() => this.headOffset() + this.#colWin.totalSize());
  readonly padTop = this.#rowWin.padStart;
  readonly padBottom = this.#rowWin.padEnd;

  /**
   * The mounted rows: absolute index, resolved height, and the row's cells as
   * one built-from-escaped-strings HTML payload — bare spans carrying a short
   * generated per-column class (`c0…cn`), no template anchors, no per-cell
   * inline styles. The per-column geometry lives in one uid-scoped generated
   * stylesheet, the same approach as `sh-code`'s style buckets.
   */
  readonly visibleRows = computed(() => {
    const sheet = this.sheet();
    const from = this.rowStart();
    const to = Math.min(this.rowEnd(), sheet.rows);
    const c0 = this.colStart();
    const c1 = Math.min(this.colEnd(), sheet.cols);
    const out: { index: number; height: number; html: SafeHtml }[] = [];
    for (let r = from; r < to; r++) {
      const parts: string[] = [];
      for (let c = c0; c < c1; c++) {
        const value = sheet.cells[r * sheet.cols + c];
        parts.push(value ? `<span class="shs-c c${c}">${escapeHtml(value)}</span>` : `<span class="shs-c c${c}"></span>`);
      }
      out.push({
        index: r,
        height: sheet.rowHeights[r] ?? this.defaultRowHeight(),
        html: this.#sanitizer.bypassSecurityTrustHtml(parts.join('')),
      });
    }
    return out;
  });

  /** The mounted column headers, positioned by the same generated classes. */
  readonly colHeadHtml = computed<SafeHtml>(() => {
    const sheet = this.sheet();
    const c1 = Math.min(this.colEnd(), sheet.cols);
    const parts: string[] = [];
    for (let c = this.colStart(); c < c1; c++) parts.push(`<span class="shs-ch c${c}">${colLabel(c)}</span>`);
    return this.#sanitizer.bypassSecurityTrustHtml(parts.join(''));
  });

  /** One paint box per selected range; the last is the active one. */
  readonly selectionRects = computed(() => {
    const raw = this.selection();
    const sheet = this.sheet();
    if (!raw?.ranges.length || sheet.rows === 0 || sheet.cols === 0) return [];
    this.#geometry();
    const rows = this.#rowWin.heights;
    const cols = this.#colWin.heights;
    return raw.ranges.map((range, i) => {
      const { r0, c0, r1, c1 } = normalizedRange(sheet, range);
      return {
        top: rows.prefixHeight(r0),
        left: this.headOffset() + cols.prefixHeight(c0),
        width: cols.prefixHeight(c1 + 1) - cols.prefixHeight(c0),
        height: rows.prefixHeight(r1 + 1) - rows.prefixHeight(r0),
        active: i === raw.ranges.length - 1,
      };
    });
  });

  constructor() {
    // Model → axis maps, column stylesheet, and a fresh window.
    effect(() => {
      const sheet = this.sheet();
      const colW = this.defaultColWidth();
      const rowH = this.defaultRowHeight();
      const headOffset = this.headOffset();
      untracked(() => {
        // Every track is measured — explicit size or the default — because a
        // partially measured map re-prices its unmeasured tracks from the
        // rolling average of the measured ones, which would drag default
        // columns toward whatever widths the explicit ones happen to have.
        // Bulk-measure on the raw map + one sync: measure() per track would
        // rebuild the O(n) prefix sums on every call (quadratic on big sheets).
        this.#rowWin.setCount(sheet.rows, rowH);
        for (let r = 0; r < sheet.rows; r++) this.#rowWin.heights.measure(r, sheet.rowHeights[r] ?? rowH);
        this.#rowWin.sync();
        this.#colWin.setCount(sheet.cols, colW);
        for (let c = 0; c < sheet.cols; c++) this.#colWin.heights.measure(c, sheet.colWidths[c] ?? colW);
        this.#colWin.sync();
        this.#syncColStyles(sheet, headOffset);
        this.#geometry.update((v) => v + 1);
        this.#updateWindow();
      });
    });

    afterNextRender(() => {
      const scroller = this.scroller().nativeElement;
      scroller.addEventListener('scroll', this.#onScroll, { passive: true });
      this.#destroyRef.onDestroy(() => scroller.removeEventListener('scroll', this.#onScroll));
      // The window depends on the scroller's laid-out size, which can arrive
      // late (panels animating open, virtualized block remounts).
      if (typeof ResizeObserver !== 'undefined') {
        const resize = new ResizeObserver(() => this.#updateWindow());
        resize.observe(scroller);
        this.#destroyRef.onDestroy(() => resize.disconnect());
      }
      this.#updateWindow();
    });
  }

  // -------------------------------------------------------------------------
  // Column geometry stylesheet: every column gets one short class with its
  // left/width, scoped to this instance — the DOM carries `c17` instead of
  // per-cell inline styles.
  // -------------------------------------------------------------------------

  #syncColStyles(sheet: SheetModel, headOffset: number) {
    if (typeof document === 'undefined') return;
    if (!this.#styleEl) {
      this.#styleEl = document.createElement('style');
      this.#styleEl.setAttribute('data-shs-style', this.uid);
      document.head.appendChild(this.#styleEl);
      this.#destroyRef.onDestroy(() => this.#styleEl?.remove());
    }
    const rules: string[] = [];
    let left = headOffset;
    for (let c = 0; c < sheet.cols; c++) {
      const width = this.#colWin.heights.heightOf(c);
      rules.push(`[data-shs="${this.uid}"] .c${c}{left:${left}px;width:${width}px}`);
      left += width;
    }
    this.#styleEl.textContent = rules.join('\n');
  }

  // -------------------------------------------------------------------------
  // Virtualized window, both axes
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
    const sheet = this.sheet();
    const scroller = this.scroller?.()?.nativeElement;
    if (!scroller || scroller.clientHeight === 0 || scroller.clientWidth === 0) {
      this.#rowWin.setRange(0, Math.min(sheet.rows, FALLBACK_ROWS));
      this.#colWin.setRange(0, Math.min(sheet.cols, FALLBACK_COLS));
      return;
    }
    const top = scroller.scrollTop;
    const left = Math.max(0, scroller.scrollLeft - this.headOffset());
    this.#rowWin.update(top, scroller.clientHeight);
    this.#colWin.update(left, scroller.clientWidth);
  }

  // -------------------------------------------------------------------------
  // Selection + copy-out
  // -------------------------------------------------------------------------

  onBodyMouseDown(event: MouseEvent) {
    if (!this.selectable() || event.button !== 0) return;
    event.preventDefault();
    this.frame().nativeElement.focus({ preventScroll: true });
    const cell = this.#cellFromMouse(event);
    if (!cell) return;
    this.#dragging = true;
    const current = this.selection();
    if (event.shiftKey && current?.ranges.length) {
      // Shift: the active range keeps its anchor corner, its head moves here.
      this.selection.set(withActiveHead(current, cell.row, cell.col));
    } else if ((event.metaKey || event.ctrlKey) && current?.ranges.length) {
      // Cmd/Ctrl: keep what's selected, open one more range at this cell.
      this.selection.set({ ranges: [...current.ranges, ...sheetCellSelection(cell.row, cell.col).ranges] });
    } else {
      this.selection.set(sheetCellSelection(cell.row, cell.col));
    }
  }

  onBodyMouseMove(event: MouseEvent) {
    if (!this.#dragging || event.buttons !== 1) return;
    const cell = this.#cellFromMouse(event);
    const current = this.selection();
    if (!cell || !current?.ranges.length) return;
    this.selection.set(withActiveHead(current, cell.row, cell.col));
  }

  onMouseUp() {
    if (this.#dragging) this.#announceSelection();
    this.#dragging = false;
  }

  /**
   * Voice the settled selection ("B2 to C3 selected, 2 ranges") — announced
   * on mouseup rather than per selection write, so a drag sweep produces one
   * announcement instead of a stream.
   */
  #announceSelection() {
    const raw = this.selection();
    const sheet = this.sheet();
    if (!raw?.ranges.length) return;
    const { r0, c0, r1, c1 } = normalizedRange(sheet, raw.ranges[raw.ranges.length - 1]);
    const from = `${colLabel(c0)}${r0 + 1}`;
    const to = `${colLabel(c1)}${r1 + 1}`;
    const range = from === to ? `${from} selected` : `${from} to ${to} selected`;
    this.#announcer.announce(raw.ranges.length > 1 ? `${range}, ${raw.ranges.length} ranges` : range);
  }

  /** Copies the active range — the multi-range union has no TSV shape. */
  onCopy(event: ClipboardEvent) {
    const range = primarySheetRange(this.selection());
    if (!range || !event.clipboardData) return;
    event.preventDefault();
    event.clipboardData.setData('text/plain', sheetRangeToTsv(this.sheet(), range));
    event.clipboardData.setData('text/html', sheetRangeToHtml(this.sheet(), range));
  }

  /** The active range as TSV, `null` when nothing is selected. */
  selectionTsv(): string | null {
    const range = primarySheetRange(this.selection());
    return range ? sheetRangeToTsv(this.sheet(), range) : null;
  }

  /** The value of the active range's anchor cell, for quick inspection. */
  selectionAnchorValue(): string | null {
    const range = primarySheetRange(this.selection());
    return range ? cellAt(this.sheet(), range.r0, range.c0) : null;
  }

  #cellFromMouse(event: MouseEvent): { row: number; col: number } | null {
    const body = (event.currentTarget as HTMLElement).closest('.shs-body') ?? (event.currentTarget as HTMLElement);
    const rect = body.getBoundingClientRect();
    const sheet = this.sheet();
    if (sheet.rows === 0 || sheet.cols === 0) return null;
    const x = event.clientX - rect.left - this.headOffset();
    const y = event.clientY - rect.top;
    return { row: this.#rowWin.heights.indexAt(y), col: this.#colWin.heights.indexAt(Math.max(0, x)) };
  }
}
