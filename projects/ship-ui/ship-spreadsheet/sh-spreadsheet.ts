import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ShipA11yAnnouncerService } from '@ship-ui/core/ship-a11y-announcer';
import { ShipMenu } from '@ship-ui/core/ship-menu';
import { ShipVirtualWindow } from '@ship-ui/core/ship-virtual-scroll';
import { parseTsv, sheetRangeToHtml, sheetRangeToTsv } from './core/sheet-clipboard';
import {
  SheetModel,
  SheetOp,
  SheetRange,
  SheetSelection,
  applySheetOps,
  cellAt,
  normalizedRange,
  primarySheetRange,
  sheetCellSelection,
} from './core/sheet-model';
import { sheetFromTable } from './core/sheet-table';
import { transformSheetOps } from './core/sheet-transform';

/** Pixels of rows/columns kept mounted beyond each viewport edge. */
const OVERSCAN_PX = 200;
/** Window assumed before the scroller has laid out (SSR, first frame). */
const FALLBACK_ROWS = 40;
const FALLBACK_COLS = 20;
/** Undo depth kept per instance. */
const HISTORY_DEPTH = 200;
/** Half-width of the grab zone on a header boundary, px. */
const RESIZE_GRIP_PX = 5;
const MIN_COL_WIDTH = 24;
const MIN_ROW_HEIGHT = 16;

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
export function sheetColLabel(index: number): string {
  let label = '';
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

/** A1-style address of a cell. */
export function sheetCellLabel(row: number, col: number): string {
  return `${sheetColLabel(col)}${row + 1}`;
}

/** Where the caret goes after a commit. */
export type SheetCommitMove = 'none' | 'down' | 'up' | 'right' | 'left';

/** A live resize drag: the track and its provisional size. */
interface ResizeDrag {
  readonly axis: 'row' | 'col';
  readonly index: number;
  readonly size: number;
}

/**
 * `<sh-spreadsheet>` — the spreadsheet surface. An immutable `SheetModel`
 * in, display state (selection) alongside; two `ShipVirtualWindow`
 * instances — one per axis, the column one horizontal — drive the
 * virtualized window exactly as `sh-code` virtualizes lines.
 *
 * By default it is the lean read-only renderer: mouse and keyboard move a
 * rectangular selection, the native copy event writes TSV + `<table>`
 * clipboard flavors. With `editable`, the same surface becomes the
 * composer: typing, Enter, or F2 opens an in-cell editor floated over the
 * active cell from the same prefix sums the selection boxes use; Delete
 * clears; paste fills from TSV or a `<table>` (growing the grid to fit);
 * headers resize by drag and open a context menu for row/column
 * structure; Cmd/Ctrl+Z walks a history built from op inverses.
 *
 * Every change is a `SheetOp[]` transaction: it is applied to `sheet`
 * (a two-way model) and emitted through `ops`, so a host can persist,
 * log, or relay it. Concurrent changes from elsewhere arrive through
 * `applyRemote`, which rebases the history over them with
 * `transformSheetOps` instead of discarding it.
 *
 * Cells stay raw strings: what the model holds is the source text (a
 * future formula engine derives displayed values from it separately), so
 * ops, clipboard, and the `<table>` form never see a computed value.
 */
@Component({
  selector: 'sh-spreadsheet',
  standalone: true,
  exportAs: 'shSpreadsheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipMenu],
  templateUrl: './sh-spreadsheet.html',
  styleUrl: './sh-spreadsheet.scss',
  host: {
    '[attr.data-shs]': 'uid',
    '[class.editable]': 'editable()',
    '[style.--shs-row-h.px]': 'defaultRowHeight()',
    '[style.--shs-head-w.px]': 'headOffset()',
  },
})
export class ShipSpreadsheet {
  scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  private editorRef = viewChild<ElementRef<HTMLTextAreaElement>>('cellEditor');
  private menu = viewChild(ShipMenu);

  /**
   * The sheet snapshot. Two-way: the composer writes every transaction back
   * here. A model set from outside (a load, an editor undo) is adopted as
   * is and clears the local history; a model the composer produced itself
   * is recognized and leaves it intact.
   */
  sheet = model.required<SheetModel>();
  /**
   * Two-way bound selection, `null` when nothing is selected. Mouse gestures
   * follow the spreadsheet conventions: click selects, drag sweeps,
   * Shift+click moves the active range's far corner, Cmd/Ctrl+click starts
   * an additional range. Keyboard: arrows move, Shift+arrows extend.
   */
  selection = model<SheetSelection | null>(null);
  /** Width for columns without an explicit width. */
  defaultColWidth = input(96);
  /** Height for rows without an explicit height. */
  defaultRowHeight = input(28);
  /** Show the A/B/C column header and 1/2/3 row header rails. */
  headers = input(true);
  /** When `false`, mouse and keyboard selection is off — pure display surface. */
  selectable = input(true);
  /** Turns the renderer into the composer: cell editing, paste, structure, resize, history. */
  editable = input(false);
  /**
   * Every transaction the user makes, as the ops that were applied — one
   * emission per edit, paste, structural change, resize, undo, or redo.
   * Remote ops passed to `applyRemote` are not echoed.
   */
  ops = output<SheetOp[]>();

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
  #injector = inject(Injector);
  #sanitizer = inject(DomSanitizer);
  #announcer = inject(ShipA11yAnnouncerService);
  #styleEl: HTMLStyleElement | null = null;

  // History: each entry is the inverse transaction of one user transaction.
  #undo: SheetOp[][] = [];
  #redo: SheetOp[][] = [];
  /** The last model this instance wrote to `sheet`, to tell own writes from adopted ones. */
  #own: SheetModel | null = null;
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  /** The in-cell editor, when open: the cell and the text it started with. */
  readonly editing = signal<{ row: number; col: number; initial: string } | null>(null);
  /** Context menu anchor (frame-relative px), `null` when closed. */
  readonly menuAt = signal<{ x: number; y: number } | null>(null);
  readonly menuOpen = signal(false);
  /** The header boundary under the pointer, for the resize cursor. */
  readonly resizeHover = signal<'row' | 'col' | null>(null);
  /** The resize drag in progress, painting a guide line. */
  readonly resizeDrag = signal<ResizeDrag | null>(null);

  readonly headOffset = computed(() => (this.headers() ? 44 : 0));

  readonly contentWidth = computed(() => this.headOffset() + this.#colWin.totalSize());
  readonly padTop = this.#rowWin.padStart;
  readonly padBottom = this.#rowWin.padEnd;

  /** The active cell — the anchor corner of the primary range — or `null`. */
  readonly activeCell = computed(() => {
    const range = primarySheetRange(this.selection());
    const sheet = this.sheet();
    if (!range || sheet.rows === 0 || sheet.cols === 0) return null;
    return {
      row: Math.max(0, Math.min(range.r0, sheet.rows - 1)),
      col: Math.max(0, Math.min(range.c0, sheet.cols - 1)),
    };
  });
  /** The active cell's raw text, `''` when nothing is active. */
  readonly activeValue = computed(() => {
    const cell = this.activeCell();
    return cell ? cellAt(this.sheet(), cell.row, cell.col) : '';
  });
  /** The active cell's A1 address, `''` when nothing is active. */
  readonly activeLabel = computed(() => {
    const cell = this.activeCell();
    return cell ? sheetCellLabel(cell.row, cell.col) : '';
  });

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
    for (let c = this.colStart(); c < c1; c++) parts.push(`<span class="shs-ch c${c}">${sheetColLabel(c)}</span>`);
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

  /** The box of the active cell (or of the cell being edited), for the anchor outline and the editor. */
  readonly activeRect = computed(() => {
    const cell = this.editing() ?? this.activeCell();
    if (!cell) return null;
    this.#geometry();
    return this.#cellBox(cell.row, cell.col);
  });

  /** The resize guide line: `x` for a column drag, `y` for a row drag (body-relative px). */
  readonly resizeGuide = computed(() => {
    const drag = this.resizeDrag();
    if (!drag) return null;
    this.#geometry();
    return drag.axis === 'col'
      ? { x: this.headOffset() + this.#colWin.heights.prefixHeight(drag.index) + drag.size, y: null }
      : { x: null, y: this.#rowWin.heights.prefixHeight(drag.index) + drag.size };
  });

  /** Menu labels reflect how many rows/columns the selection spans. */
  readonly menuScope = computed(() => {
    const range = primarySheetRange(this.selection());
    if (!range) return { rows: 1, cols: 1 };
    const { r0, c0, r1, c1 } = normalizedRange(this.sheet(), range);
    return { rows: r1 - r0 + 1, cols: c1 - c0 + 1 };
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
        // A model that did not come from this instance is a new baseline:
        // the history's inverses no longer address it.
        if (sheet !== this.#own) {
          this.#own = null;
          this.#undo = [];
          this.#redo = [];
          this.canUndo.set(false);
          this.canRedo.set(false);
          if (this.editing()) this.editing.set(null);
        }
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

  #cellBox(row: number, col: number) {
    const rows = this.#rowWin.heights;
    const cols = this.#colWin.heights;
    return {
      top: rows.prefixHeight(row),
      left: this.headOffset() + cols.prefixHeight(col),
      width: cols.prefixHeight(col + 1) - cols.prefixHeight(col),
      height: rows.prefixHeight(row + 1) - rows.prefixHeight(row),
    };
  }

  /** Scroll the scroller just enough to reveal the cell past the sticky rails. */
  #revealCell(row: number, col: number) {
    const scroller = this.scroller?.()?.nativeElement;
    if (!scroller || typeof document === 'undefined') return;
    const box = this.#cellBox(row, col);
    const headH = (scroller.querySelector('.shs-colhead') as HTMLElement | null)?.offsetHeight ?? 0;
    const headW = this.headOffset();
    const top = headH + box.top;
    if (top < scroller.scrollTop + headH) scroller.scrollTop = box.top;
    else if (top + box.height > scroller.scrollTop + scroller.clientHeight) scroller.scrollTop = top + box.height - scroller.clientHeight;
    if (box.left < scroller.scrollLeft + headW) scroller.scrollLeft = box.left - headW;
    else if (box.left + box.width > scroller.scrollLeft + scroller.clientWidth) scroller.scrollLeft = box.left + box.width - scroller.clientWidth;
  }

  // -------------------------------------------------------------------------
  // Transactions and history
  // -------------------------------------------------------------------------

  /**
   * Apply a user transaction: the model advances, its inverse joins the undo
   * stack, redo clears, and the ops are emitted. Empty transactions and
   * no-op applications are ignored.
   */
  apply(ops: readonly SheetOp[]): void {
    if (ops.length === 0) return;
    const { model, inverse } = applySheetOps(this.sheet(), ops);
    if (inverse.length === 0) return;
    this.#commit(model);
    this.#undo.push(inverse.slice());
    if (this.#undo.length > HISTORY_DEPTH) this.#undo.shift();
    this.#redo = [];
    this.#syncHistoryFlags();
    this.ops.emit(ops.slice());
  }

  /**
   * Apply ops that originated elsewhere (another peer, a merged snapshot).
   * They are not emitted, and both history stacks are rebased over them
   * with `transformSheetOps` so undo keeps addressing the right cells.
   */
  applyRemote(ops: readonly SheetOp[]): void {
    if (ops.length === 0) return;
    const { model } = applySheetOps(this.sheet(), ops);
    this.#commit(model);
    this.#undo = this.#rebaseStack(this.#undo, ops);
    this.#redo = this.#rebaseStack(this.#redo, ops);
    this.#syncHistoryFlags();
    const editing = this.editing();
    if (editing) {
      // The cell under the editor may have moved; the current text is the
      // user's, so re-anchor by rebasing a probe op rather than guessing.
      const [probe] = transformSheetOps([{ kind: 'set-cells', row: editing.row, col: editing.col, values: [['']] }], ops, 'right').ops;
      if (probe?.kind === 'set-cells') this.editing.set({ ...editing, row: probe.row, col: probe.col });
      else this.editing.set(null);
    }
  }

  /**
   * Stack entries are inverses relative to the state *after* the entries
   * above them; walking from the top, each is transformed against the
   * remote op as it looks at that point, and the remote op is carried
   * through the entry in turn — the same ladder ship-editor's history runs.
   */
  #rebaseStack(stack: SheetOp[][], remote: readonly SheetOp[]): SheetOp[][] {
    const out: SheetOp[][] = [];
    let against: SheetOp[] = remote.slice();
    for (let k = stack.length - 1; k >= 0; k--) {
      if (against.length === 0) {
        out.push(stack[k]);
        continue;
      }
      const { ops, against: next } = transformSheetOps(stack[k], against, 'right');
      if (ops.length > 0) out.push(ops);
      against = next;
    }
    return out.reverse();
  }

  undo(): void {
    const inverse = this.#undo.pop();
    if (!inverse) return;
    const { model, inverse: redo } = applySheetOps(this.sheet(), inverse);
    this.#commit(model);
    this.#redo.push(redo.slice());
    this.#syncHistoryFlags();
    this.ops.emit(inverse);
  }

  redo(): void {
    const ops = this.#redo.pop();
    if (!ops) return;
    const { model, inverse } = applySheetOps(this.sheet(), ops);
    this.#commit(model);
    this.#undo.push(inverse.slice());
    this.#syncHistoryFlags();
    this.ops.emit(ops);
  }

  #commit(model: SheetModel) {
    this.#own = model;
    this.sheet.set(model);
    // Keep the selection inside the (possibly smaller) grid.
    const selection = this.selection();
    if (selection?.ranges.length && (model.rows === 0 || model.cols === 0)) this.selection.set(null);
  }

  #syncHistoryFlags() {
    this.canUndo.set(this.#undo.length > 0);
    this.canRedo.set(this.#redo.length > 0);
  }

  // -------------------------------------------------------------------------
  // Selection and focus
  // -------------------------------------------------------------------------

  /** Focus the grid surface (not the in-cell editor). */
  focus(): void {
    this.frame?.()?.nativeElement.focus({ preventScroll: true });
  }

  /** Select one cell, clamped to the grid, and reveal it. With `extend`, move the active range's head instead. */
  selectCell(row: number, col: number, extend = false): void {
    const sheet = this.sheet();
    if (sheet.rows === 0 || sheet.cols === 0) return;
    const r = Math.max(0, Math.min(row, sheet.rows - 1));
    const c = Math.max(0, Math.min(col, sheet.cols - 1));
    const current = this.selection();
    this.selection.set(extend && current?.ranges.length ? withActiveHead(current, r, c) : sheetCellSelection(r, c));
    this.#revealCell(r, c);
  }

  /** Select a rectangle (corners in any order). */
  selectRange(range: SheetRange): void {
    this.selection.set({ ranges: [range] });
  }

  selectAll(): void {
    const sheet = this.sheet();
    if (sheet.rows === 0 || sheet.cols === 0) return;
    this.selectRange({ r0: 0, c0: 0, r1: sheet.rows - 1, c1: sheet.cols - 1 });
  }

  /** The primary range, normalized, or `null`. */
  activeRange(): SheetRange | null {
    const range = primarySheetRange(this.selection());
    const sheet = this.sheet();
    return range && sheet.rows > 0 && sheet.cols > 0 ? normalizedRange(sheet, range) : null;
  }

  onBodyMouseDown(event: MouseEvent) {
    if (!this.selectable() || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('.shs-editor, .shs-menu')) return;
    event.preventDefault();
    if (this.editing()) this.commitEdit('none');
    this.focus();
    // Row header: a boundary grab resizes, a click selects the row.
    if (target.classList.contains('shs-rh')) {
      const hit = this.#rowBoundaryAt(event);
      if (hit !== null && this.editable()) {
        this.#startResize('row', hit, event.clientY);
        return;
      }
      const row = this.#cellFromMouse(event)?.row;
      if (row !== undefined) this.selectRange({ r0: row, c0: 0, r1: row, c1: this.sheet().cols - 1 });
      return;
    }
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
    if (this.#dragging && event.buttons === 1) {
      const cell = this.#cellFromMouse(event);
      const current = this.selection();
      if (!cell || !current?.ranges.length) return;
      this.selection.set(withActiveHead(current, cell.row, cell.col));
      return;
    }
    if (!this.editable() || this.resizeDrag()) return;
    const target = event.target as HTMLElement;
    const hover = target.classList.contains('shs-rh') && this.#rowBoundaryAt(event) !== null ? 'row' : null;
    if (hover !== this.resizeHover()) this.resizeHover.set(hover);
  }

  onBodyDoubleClick(event: MouseEvent) {
    if (!this.editable() || (event.target as HTMLElement).closest('.shs-editor, .shs-rh')) return;
    if (this.activeCell()) this.startEdit();
  }

  onMouseUp() {
    if (this.#dragging) this.#announceSelection();
    this.#dragging = false;
  }

  /** Column header: a boundary grab resizes, a click selects the column. */
  onHeadMouseDown(event: MouseEvent) {
    if (!this.selectable() || event.button !== 0) return;
    event.preventDefault();
    if (this.editing()) this.commitEdit('none');
    this.focus();
    const hit = this.#colBoundaryAt(event);
    if (hit !== null && this.editable()) {
      this.#startResize('col', hit, event.clientX);
      return;
    }
    const col = this.#colFromHead(event);
    if (col !== null) this.selectRange({ r0: 0, c0: col, r1: this.sheet().rows - 1, c1: col });
  }

  onHeadMouseMove(event: MouseEvent) {
    if (!this.editable() || this.resizeDrag()) return;
    const hover = this.#colBoundaryAt(event) !== null ? 'col' : null;
    if (hover !== this.resizeHover()) this.resizeHover.set(hover);
  }

  onHeadMouseLeave() {
    if (this.resizeHover() === 'col') this.resizeHover.set(null);
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
    const from = sheetCellLabel(r0, c0);
    const to = sheetCellLabel(r1, c1);
    const range = from === to ? `${from} selected` : `${from} to ${to} selected`;
    this.#announcer.announce(raw.ranges.length > 1 ? `${range}, ${raw.ranges.length} ranges` : range);
  }

  #cellFromMouse(event: MouseEvent): { row: number; col: number } | null {
    const body = this.#bodyEl();
    const sheet = this.sheet();
    if (!body || sheet.rows === 0 || sheet.cols === 0) return null;
    const rect = body.getBoundingClientRect();
    const x = event.clientX - rect.left - this.headOffset();
    const y = event.clientY - rect.top;
    return { row: this.#rowWin.heights.indexAt(y), col: this.#colWin.heights.indexAt(Math.max(0, x)) };
  }

  #bodyEl(): HTMLElement | null {
    return this.scroller?.()?.nativeElement.querySelector('.shs-body') ?? null;
  }

  #colFromHead(event: MouseEvent): number | null {
    const body = this.#bodyEl();
    const sheet = this.sheet();
    if (!body || sheet.cols === 0) return null;
    const x = event.clientX - body.getBoundingClientRect().left - this.headOffset();
    return x < 0 ? null : this.#colWin.heights.indexAt(x);
  }

  /** The column whose right edge is under the pointer, or `null`. */
  #colBoundaryAt(event: MouseEvent): number | null {
    const body = this.#bodyEl();
    const sheet = this.sheet();
    if (!body || sheet.cols === 0) return null;
    const x = event.clientX - body.getBoundingClientRect().left - this.headOffset();
    if (x < 0) return null;
    const cols = this.#colWin.heights;
    const c = cols.indexAt(x);
    if (Math.abs(x - cols.prefixHeight(c + 1)) <= RESIZE_GRIP_PX) return c;
    if (c > 0 && Math.abs(x - cols.prefixHeight(c)) <= RESIZE_GRIP_PX) return c - 1;
    return null;
  }

  /** The row whose bottom edge is under the pointer, or `null`. */
  #rowBoundaryAt(event: MouseEvent): number | null {
    const body = this.#bodyEl();
    const sheet = this.sheet();
    if (!body || sheet.rows === 0) return null;
    const y = event.clientY - body.getBoundingClientRect().top;
    const rows = this.#rowWin.heights;
    const r = rows.indexAt(y);
    if (Math.abs(y - rows.prefixHeight(r + 1)) <= RESIZE_GRIP_PX) return r;
    if (r > 0 && Math.abs(y - rows.prefixHeight(r)) <= RESIZE_GRIP_PX) return r - 1;
    return null;
  }

  // -------------------------------------------------------------------------
  // Resize by drag
  // -------------------------------------------------------------------------

  #startResize(axis: 'row' | 'col', index: number, origin: number) {
    if (typeof document === 'undefined') return;
    const map = axis === 'col' ? this.#colWin.heights : this.#rowWin.heights;
    const start = map.heightOf(index);
    const min = axis === 'col' ? MIN_COL_WIDTH : MIN_ROW_HEIGHT;
    this.resizeDrag.set({ axis, index, size: start });
    const move = (e: MouseEvent) => {
      const delta = (axis === 'col' ? e.clientX : e.clientY) - origin;
      this.resizeDrag.set({ axis, index, size: Math.max(min, Math.round(start + delta)) });
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      const drag = this.resizeDrag();
      this.resizeDrag.set(null);
      this.resizeHover.set(null);
      if (!drag || drag.size === start) return;
      this.apply([axis === 'col' ? { kind: 'set-col-width', col: index, width: drag.size } : { kind: 'set-row-height', row: index, height: drag.size }]);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  // -------------------------------------------------------------------------
  // In-cell editing
  // -------------------------------------------------------------------------

  /** Open the editor on the active cell, with `initial` (default: the cell's text) as its content. */
  startEdit(initial?: string): void {
    const cell = this.activeCell();
    if (!this.editable() || !cell) return;
    const text = initial ?? cellAt(this.sheet(), cell.row, cell.col);
    this.editing.set({ row: cell.row, col: cell.col, initial: text });
    this.#revealCell(cell.row, cell.col);
    afterNextRender(
      () => {
        const el = this.editorRef()?.nativeElement;
        if (!el) return;
        el.value = text;
        el.focus({ preventScroll: true });
        el.setSelectionRange(text.length, text.length);
      },
      { injector: this.#injector }
    );
  }

  /** Write the editor's text into its cell (when changed) and move the selection on. */
  commitEdit(move: SheetCommitMove = 'none'): void {
    const editing = this.editing();
    if (!editing) return;
    const value = this.editorRef()?.nativeElement.value ?? editing.initial;
    this.editing.set(null);
    if (value !== cellAt(this.sheet(), editing.row, editing.col)) {
      this.apply([{ kind: 'set-cells', row: editing.row, col: editing.col, values: [[value]] }]);
      this.#announcer.announce(`${sheetCellLabel(editing.row, editing.col)} set to ${value || 'empty'}`);
    }
    this.#moveFrom(editing.row, editing.col, move);
    this.focus();
  }

  cancelEdit(): void {
    if (!this.editing()) return;
    this.editing.set(null);
    this.focus();
  }

  #moveFrom(row: number, col: number, move: SheetCommitMove) {
    switch (move) {
      case 'down':
        return this.selectCell(row + 1, col);
      case 'up':
        return this.selectCell(row - 1, col);
      case 'right':
        return this.selectCell(row, col + 1);
      case 'left':
        return this.selectCell(row, col - 1);
      default:
        return;
    }
  }

  onEditorKeydown(event: KeyboardEvent) {
    // Keys the editor owns never reach the grid's keymap.
    event.stopPropagation();
    switch (event.key) {
      case 'Enter':
        if (event.altKey || event.shiftKey) return; // newline
        event.preventDefault();
        this.commitEdit(event.metaKey || event.ctrlKey ? 'none' : 'down');
        return;
      case 'Tab':
        event.preventDefault();
        this.commitEdit(event.shiftKey ? 'left' : 'right');
        return;
      case 'Escape':
        event.preventDefault();
        this.cancelEdit();
        return;
    }
  }

  onEditorBlur() {
    // Focus leaving the editor (a click elsewhere, a tab out) keeps the text.
    if (this.editing()) this.commitEdit('none');
  }

  // -------------------------------------------------------------------------
  // Keyboard on the grid
  // -------------------------------------------------------------------------

  onKeydown(event: KeyboardEvent) {
    if (!this.selectable() || this.editing() || this.menuOpen()) return;
    if ((event.target as HTMLElement).closest('.shs-menu')) return;
    const meta = event.metaKey || event.ctrlKey;
    const key = event.key;
    const editable = this.editable();

    if (meta && !event.altKey) {
      const lower = key.toLowerCase();
      if (lower === 'z' && editable) {
        event.preventDefault();
        event.stopPropagation();
        if (event.shiftKey) this.redo();
        else this.undo();
        return;
      }
      if (lower === 'y' && editable) {
        event.preventDefault();
        event.stopPropagation();
        this.redo();
        return;
      }
      if (lower === 'a') {
        event.preventDefault();
        event.stopPropagation();
        this.selectAll();
        return;
      }
    }

    const cell = this.activeCell();
    const sheet = this.sheet();
    if (!cell) {
      if (key.startsWith('Arrow') || key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        this.selectCell(0, 0);
      }
      return;
    }
    const head = this.#headCell();
    const from = event.shiftKey && key.startsWith('Arrow') ? head : cell;
    const page = Math.max(1, Math.floor((this.scroller?.()?.nativeElement.clientHeight ?? 300) / this.defaultRowHeight()) - 1);
    let to: { row: number; col: number } | null = null;
    switch (key) {
      case 'ArrowUp':
        to = { row: meta ? 0 : from.row - 1, col: from.col };
        break;
      case 'ArrowDown':
        to = { row: meta ? sheet.rows - 1 : from.row + 1, col: from.col };
        break;
      case 'ArrowLeft':
        to = { row: from.row, col: meta ? 0 : from.col - 1 };
        break;
      case 'ArrowRight':
        to = { row: from.row, col: meta ? sheet.cols - 1 : from.col + 1 };
        break;
      case 'Home':
        to = meta ? { row: 0, col: 0 } : { row: from.row, col: 0 };
        break;
      case 'End':
        to = meta ? { row: sheet.rows - 1, col: sheet.cols - 1 } : { row: from.row, col: sheet.cols - 1 };
        break;
      case 'PageUp':
        to = { row: from.row - page, col: from.col };
        break;
      case 'PageDown':
        to = { row: from.row + page, col: from.col };
        break;
      case 'Tab':
        to = { row: cell.row, col: cell.col + (event.shiftKey ? -1 : 1) };
        break;
    }
    if (to) {
      // Handled keys stop here: an outer keymap (a page hosting the grid)
      // must not move the selection a second time.
      event.preventDefault();
      event.stopPropagation();
      const extend = event.shiftKey && key !== 'Tab';
      this.selectCell(to.row, to.col, extend);
      const settled = this.activeCell();
      if (settled) {
        const headNow = this.#headCell();
        this.#announcer.announce(extend ? `${sheetCellLabel(settled.row, settled.col)} to ${sheetCellLabel(headNow.row, headNow.col)}` : sheetCellLabel(settled.row, settled.col));
      }
      return;
    }

    if (!editable || meta) return;
    if (key === 'Enter' || key === 'F2') {
      event.preventDefault();
      event.stopPropagation();
      this.startEdit();
    } else if (key === 'Delete' || key === 'Backspace') {
      event.preventDefault();
      event.stopPropagation();
      this.clearSelection();
    } else if (key.length === 1 && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      this.startEdit(key);
    }
  }

  /** The head (far) corner of the primary range, clamped. */
  #headCell(): { row: number; col: number } {
    const range = primarySheetRange(this.selection());
    const sheet = this.sheet();
    const cell = this.activeCell()!;
    if (!range) return cell;
    return { row: Math.max(0, Math.min(range.r1, sheet.rows - 1)), col: Math.max(0, Math.min(range.c1, sheet.cols - 1)) };
  }

  // -------------------------------------------------------------------------
  // Clipboard
  // -------------------------------------------------------------------------

  /** Copies the active range — the multi-range union has no TSV shape. */
  onCopy(event: ClipboardEvent) {
    if (this.editing()) return;
    const range = primarySheetRange(this.selection());
    if (!range || !event.clipboardData) return;
    event.preventDefault();
    event.clipboardData.setData('text/plain', sheetRangeToTsv(this.sheet(), range));
    event.clipboardData.setData('text/html', sheetRangeToHtml(this.sheet(), range));
    const { r0, c0, r1, c1 } = normalizedRange(this.sheet(), range);
    const from = sheetCellLabel(r0, c0);
    const to = sheetCellLabel(r1, c1);
    this.#announcer.announce(from === to ? `Copied ${from}` : `Copied ${from} to ${to}`);
  }

  onCut(event: ClipboardEvent) {
    if (this.editing() || !this.editable()) return;
    this.onCopy(event);
    if (event.defaultPrevented) this.clearSelection();
  }

  /**
   * Paste anchored at the active cell: a `<table>` flavor when the source
   * was a spreadsheet or a document, TSV otherwise; the grid grows to fit.
   */
  onPaste(event: ClipboardEvent) {
    if (this.editing() || !this.editable()) return;
    const cell = this.activeCell();
    const data = event.clipboardData;
    if (!cell || !data) return;
    let values: readonly (readonly string[])[] | null = null;
    const html = data.getData('text/html');
    if (html && typeof DOMParser !== 'undefined') {
      const table = new DOMParser().parseFromString(html, 'text/html').querySelector('table');
      const model = table ? sheetFromTable(table) : null;
      if (model) values = Array.from({ length: model.rows }, (_, r) => model.cells.slice(r * model.cols, (r + 1) * model.cols));
    }
    if (!values) {
      const text = data.getData('text/plain');
      if (!text) return;
      values = parseTsv(text);
    }
    if (values.length === 0) return;
    event.preventDefault();
    this.pasteValues(cell.row, cell.col, values);
  }

  /** Write a block of values at (row, col), inserting rows/columns so it fits. */
  pasteValues(row: number, col: number, values: readonly (readonly string[])[]): void {
    const sheet = this.sheet();
    const ops: SheetOp[] = [];
    const needRows = row + values.length - sheet.rows;
    const needCols = col + Math.max(0, ...values.map((line) => line.length)) - sheet.cols;
    if (needRows > 0) ops.push({ kind: 'insert-rows', at: sheet.rows, count: needRows });
    if (needCols > 0) ops.push({ kind: 'insert-cols', at: sheet.cols, count: needCols });
    ops.push({ kind: 'set-cells', row, col, values });
    this.apply(ops);
    const r1 = row + values.length - 1;
    const c1 = col + Math.max(1, ...values.map((line) => line.length)) - 1;
    this.selectRange({ r0: row, c0: col, r1, c1 });
    this.#announcer.announce(`Pasted ${values.length} row${values.length === 1 ? '' : 's'} at ${sheetCellLabel(row, col)}`);
  }

  // -------------------------------------------------------------------------
  // Structure: clear, insert, delete — the context menu's verbs
  // -------------------------------------------------------------------------

  /** Empty every cell of every selected range. */
  clearSelection(): void {
    const selection = this.selection();
    const sheet = this.sheet();
    if (!selection?.ranges.length || sheet.rows === 0 || sheet.cols === 0) return;
    const ops: SheetOp[] = selection.ranges.map((raw) => {
      const { r0, c0, r1, c1 } = normalizedRange(sheet, raw);
      return { kind: 'set-cells', row: r0, col: c0, values: Array.from({ length: r1 - r0 + 1 }, () => new Array<string>(c1 - c0 + 1).fill('')) };
    });
    this.apply(ops);
  }

  /** Insert as many rows as the selection spans, above or below it. */
  insertRows(where: 'above' | 'below'): void {
    const range = this.activeRange();
    if (!range) return;
    const count = range.r1 - range.r0 + 1;
    const at = where === 'above' ? range.r0 : range.r1 + 1;
    this.apply([{ kind: 'insert-rows', at, count }]);
    this.selectRange({ r0: at, c0: range.c0, r1: at + count - 1, c1: range.c1 });
  }

  /** Insert as many columns as the selection spans, left or right of it. */
  insertCols(where: 'left' | 'right'): void {
    const range = this.activeRange();
    if (!range) return;
    const count = range.c1 - range.c0 + 1;
    const at = where === 'left' ? range.c0 : range.c1 + 1;
    this.apply([{ kind: 'insert-cols', at, count }]);
    this.selectRange({ r0: range.r0, c0: at, r1: range.r1, c1: at + count - 1 });
  }

  /** Delete the selected rows; the last row of a sheet stays. */
  deleteRows(): void {
    const range = this.activeRange();
    const sheet = this.sheet();
    if (!range) return;
    const count = Math.min(range.r1 - range.r0 + 1, sheet.rows - 1);
    if (count <= 0) return;
    this.apply([{ kind: 'remove-rows', at: range.r0, count }]);
    this.selectCell(range.r0, range.c0);
  }

  /** Delete the selected columns; the last column of a sheet stays. */
  deleteCols(): void {
    const range = this.activeRange();
    const sheet = this.sheet();
    if (!range) return;
    const count = Math.min(range.c1 - range.c0 + 1, sheet.cols - 1);
    if (count <= 0) return;
    this.apply([{ kind: 'remove-cols', at: range.c0, count }]);
    this.selectCell(range.r0, range.c0);
  }

  onContextMenu(event: MouseEvent) {
    if (!this.editable()) return;
    event.preventDefault();
    if (this.editing()) this.commitEdit('none');
    // Right-clicking outside the selection moves it there first.
    const cell = (event.target as HTMLElement).closest('.shs-body') ? this.#cellFromMouse(event) : null;
    if (cell && !this.#selectionContains(cell.row, cell.col)) this.selectCell(cell.row, cell.col);
    const rect = this.frame().nativeElement.getBoundingClientRect();
    this.menuAt.set({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    // The popover positions off its anchor once that has been laid out at
    // the new point; opening in the same tick would read the old geometry.
    afterNextRender(() => this.menu()?.open(), { injector: this.#injector });
  }

  onMenuClosed() {
    this.menuAt.set(null);
    this.focus();
  }

  #selectionContains(row: number, col: number): boolean {
    const selection = this.selection();
    const sheet = this.sheet();
    return !!selection?.ranges.some((raw) => {
      const { r0, c0, r1, c1 } = normalizedRange(sheet, raw);
      return row >= r0 && row <= r1 && col >= c0 && col <= c1;
    });
  }

  // -------------------------------------------------------------------------
  // Inspection helpers
  // -------------------------------------------------------------------------

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
}
