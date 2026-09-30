import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DestroyRef,
  ElementRef,
  Injector,
  TemplateRef,
  Type,
  ViewContainerRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  reflectComponentType,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ShipA11yAnnouncerService } from '@ship-ui/core/ship-a11y-announcer';
import { ShipMenu } from '@ship-ui/core/ship-menu';
import { ShipVirtualWindow } from '@ship-ui/core/ship-virtual-scroll';
import { parseTsv, sheetRangeToHtml, sheetRangeToTsv } from './core/sheet-clipboard';
import { escapeSheetHtml } from './core/sheet-html';
import {
  SheetCellContext,
  SheetCellEditor,
  SheetCellEditorApi,
  SheetCellExtension,
  SheetCellRegistry,
  SheetCellRendererContext,
  SheetCommitMove,
} from './core/sheet-extensions';
import {
  FormulaErrorCode,
  SheetEvaluator,
  SheetFunction,
  SheetFunctionRegistry,
  SheetWorkbook,
  isFormula,
} from './core/sheet-formulas';
import { sheetFillValues } from './core/sheet-fill';
import {
  SheetModel,
  SheetOp,
  SheetRange,
  SheetSelection,
  applySheetOps,
  cellAt,
  colTypeAt,
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

/**
 * The evaluated view of a sheet — what `sh-spreadsheet` shows for formula
 * cells. One object per model (see `ShipSpreadsheet.values`); the raw
 * string for every non-formula cell.
 */
export interface SheetValues {
  readonly model: SheetModel;
  valueAt(row: number, col: number): string;
  errorAt(row: number, col: number): FormulaErrorCode | null;
  /** The message behind an error, when a function threw or was called with the wrong number of arguments. */
  errorMessageAt(row: number, col: number): string | null;
  isFormulaAt(row: number, col: number): boolean;
}

/** The formula bar's autocomplete: the functions matching the word at the caret. */
export interface SheetBarHints {
  readonly items: readonly SheetFunction[];
  readonly active: number;
  /** The word being completed, as `[start, end)` in the bar's text. */
  readonly start: number;
  readonly end: number;
}

export type { SheetCommitMove };

/**
 * What a host's `rowKind` says about a row: `'group'` draws it as one
 * full-width heading (the first cell's text) and makes it read-only,
 * `'readonly'` keeps the cells but refuses edits, paste and clears.
 */
export type SheetRowKind = 'group' | 'readonly';

/**
 * A cell drawn by a component or a template (`SheetCellExtension.renderer`)
 * rather than by the row's HTML string: positioned by the same generated
 * column class, fed the cell's display value.
 */
export interface SheetHostedCell {
  readonly col: number;
  readonly cls: string;
  readonly title: string | null;
  readonly component: Type<unknown> | null;
  readonly template: TemplateRef<SheetCellRendererContext> | null;
  /** The declared inputs of `component` the cell sets: `value`, `ctx`, `extension`. */
  readonly inputs: Record<string, unknown>;
  readonly context: SheetCellRendererContext;
}

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
 * Cells stay raw strings: what the model holds is the source text, so ops,
 * clipboard, and the `<table>` form never see a computed value. A cell
 * whose text starts with `=` is a formula: a `SheetEvaluator` kept in step
 * with the model derives its value (`values`), the grid shows the value or
 * the error token, and the in-cell editor and the formula bar show the
 * source. How a column's strings look and edit is a `SheetCellExtension`
 * resolved from the column's type (`colTypes`) through the registry built
 * from `extensions` — text by default, checkbox and the formatted types
 * built in; a formula in a typed column formats its evaluated value.
 */
@Component({
  selector: 'sh-spreadsheet',
  exportAs: 'shSpreadsheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipMenu, NgComponentOutlet, NgTemplateOutlet],
  templateUrl: './sh-spreadsheet.html',
  styleUrl: './sh-spreadsheet.scss',
  host: {
    '[attr.data-shs]': 'uid',
    '[class.editable]': 'editable()',
    '[class.has-bar]': 'formulaBar()',
    '[style.--shs-row-h.px]': 'defaultRowHeight()',
    '[style.--shs-head-w.px]': 'headOffset()',
  },
})
export class ShipSpreadsheet {
  scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  private editorRef = viewChild<ElementRef<HTMLTextAreaElement | HTMLInputElement>>('cellEditor');
  private editorOutlet = viewChild('editorOutlet', { read: ViewContainerRef });
  private editorHost = viewChild<ElementRef<HTMLElement>>('editorHost');
  private barRef = viewChild<ElementRef<HTMLInputElement>>('barInput');
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
  /**
   * The header rails: `true` for A/B/C over the columns and 1/2/3 down the
   * rows, `false` for none, or the column labels themselves (`['Title',
   * 'Status', …]`, a column past the list falls back to its letter) for a
   * database view. Cell addresses stay A1-style whatever the labels.
   */
  headers = input<boolean | readonly string[]>(true);
  /**
   * With labelled `headers`, `false` drops the letter and row-number rails:
   * the label row is the only chrome. With `headers: true` it hides both.
   */
  letters = input(true);
  /** Extra classes for a row element (`.shs-row`), by row index — a group heading, a done record. */
  rowClass = input<((row: number) => string | null | undefined) | null>(null);
  /** What kind of row a row is (`SheetRowKind`), by index; `null`/`undefined` for an ordinary one. */
  rowKind = input<((row: number) => SheetRowKind | null | undefined) | null>(null);
  /** When `false`, mouse and keyboard selection is off — pure display surface. */
  selectable = input(true);
  /** Turns the renderer into the composer: cell editing, paste, structure, resize, history. */
  editable = input(false);
  /** Cell extensions beyond the built-in text and checkbox types, resolved by `colTypes`. */
  extensions = input<readonly SheetCellExtension[]>([]);
  /**
   * Show a formula bar above the grid: the active cell's address and its
   * source (the `=` text of a formula, the typed form of a value), editable
   * when the grid is — Enter commits, Escape reverts.
   */
  formulaBar = input(false);
  /**
   * Formula functions beyond the built-ins: a list merged over them (a
   * built-in's name overrides it), or a ready `SheetFunctionRegistry`.
   */
  functions = input<readonly SheetFunction[] | SheetFunctionRegistry>([]);
  /**
   * What functions see as `ctx.external` — app data a custom function
   * reads. A new value recomputes every formula; for data that changes
   * behind the same object, call `recalc()`.
   */
  functionContext = input<unknown>(undefined);
  /**
   * The other sheets of the workbook, for `Sheet2!A1` and `Tasks!Title` in
   * formulas. A new value recomputes every formula, so hand in a new
   * resolver whenever a referenced sheet changes; without one every
   * cross-sheet reference is `#REF!`.
   */
  workbook = input<SheetWorkbook | null>(null);
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
  /** Formula values, kept in step with the model by `values`; rebuilt when the registry changes. */
  #evaluator = new SheetEvaluator();
  /** Bumped by `recalc()` so `values` recomputes the formulas against the host's data. */
  readonly #recalcTick = signal(0);
  /** The ops that turned the evaluator's last model into the one just committed — the incremental path. */
  #pending: { readonly from: SheetModel | null; readonly to: SheetModel; readonly ops: readonly SheetOp[] } | null =
    null;
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  /** The in-cell editor, when open: the cell and the text it started with; `component` when the type edits through a component. */
  readonly editing = signal<{
    row: number;
    col: number;
    initial: string;
    inputType?: string;
    component?: Type<SheetCellEditor>;
  } | null>(null);
  /** The mounted component editor, while `editing().component` is set. */
  #editorCmp: ComponentRef<SheetCellEditor> | null = null;
  /** Context menu anchor (frame-relative px), `null` when closed. */
  readonly menuAt = signal<{ x: number; y: number } | null>(null);
  readonly menuOpen = signal(false);
  /** The header boundary under the pointer, for the resize cursor. */
  readonly resizeHover = signal<'row' | 'col' | null>(null);
  /** The resize drag in progress, painting a guide line. */
  readonly resizeDrag = signal<ResizeDrag | null>(null);
  /** The fill-handle drag in progress: the pattern range and the cells it will fill so far. */
  readonly fillDrag = signal<{ source: SheetRange; target: SheetRange | null } | null>(null);

  /** The column rail shows: letters (with `letters`) or the given labels. */
  readonly showColHead = computed(() => {
    const headers = this.headers();
    return headers === true ? this.letters() : Array.isArray(headers);
  });
  /** The row-number rail shows: any headers, unless `letters` is off. */
  readonly showRowRail = computed(() => this.headers() !== false && this.letters());
  readonly headOffset = computed(() => (this.showRowRail() ? 44 : 0));
  readonly registry = computed(() => new SheetCellRegistry(this.extensions()));
  /** The cell types the context menu offers for a column. */
  readonly registryTypes = computed(() => this.registry().types());

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
  /** What the formula bar and the editor show for the active cell: a formula's source, else the type's `format`. */
  readonly activeSource = computed(() => {
    const cell = this.activeCell();
    return cell ? this.#sourceAt(cell.row, cell.col) : '';
  });

  /**
   * The evaluated sheet: one `SheetValues` per model. The evaluator is
   * brought up to the current model on read — incrementally when the model
   * is the one this instance just committed (the ops are known), from
   * scratch for an adopted one — so a consumer never sees stale values.
   */
  readonly values = computed<SheetValues>(() => {
    const sheet = this.sheet();
    const registry = this.functionRegistry();
    const external = this.functionContext();
    const workbook = this.workbook();
    this.#recalcTick();
    let ev = this.#evaluator;
    if (ev.functions !== registry) ev = this.#evaluator = new SheetEvaluator(registry);
    const contextChanged = ev.external !== external || ev.workbook !== workbook;
    ev.external = external;
    ev.workbook = workbook;
    // A fresh evaluator computes everything in `update`; otherwise a new
    // context or a pending `recalc()` recomputes on top of the incremental step.
    const fresh = ev.model === null;
    if (ev.model !== sheet) {
      const pending = this.#pending;
      ev.update(sheet, pending && pending.to === sheet && pending.from === ev.model ? pending.ops : undefined);
    }
    if (!fresh && (contextChanged || this.#recalcPending)) ev.recalc();
    this.#recalcPending = false;
    return {
      model: sheet,
      valueAt: (row, col) => ev.valueAt(row, col),
      errorAt: (row, col) => ev.errorAt(row, col),
      errorMessageAt: (row, col) => ev.errorMessageAt(row, col),
      isFormulaAt: (row, col) => ev.isFormulaAt(row, col),
    };
  });

  /** The functions formulas resolve against: `functions` merged over the built-ins. */
  readonly functionRegistry = computed(() => {
    const functions = this.functions();
    return functions instanceof SheetFunctionRegistry ? functions : new SheetFunctionRegistry(functions);
  });

  #recalcPending = false;

  /**
   * Recompute every formula against the current `functionContext`: for a
   * host whose function data changed without a new context object.
   */
  recalc(): void {
    this.#recalcPending = true;
    this.#recalcTick.update((n) => n + 1);
  }

  /** The input names a renderer component declares, so only those are set. */
  readonly #inputNames = new Map<Type<unknown>, Set<string>>();

  #inputsOf(component: Type<unknown>): Set<string> {
    let names = this.#inputNames.get(component);
    if (!names) {
      names = new Set(reflectComponentType(component)?.inputs.map((i) => i.templateName) ?? []);
      this.#inputNames.set(component, names);
    }
    return names;
  }

  /**
   * The mounted rows: absolute index, resolved height, and the row's cells as
   * one built-from-escaped-strings HTML payload — bare spans carrying a short
   * generated per-column class (`c0…cn`), no template anchors, no per-cell
   * inline styles. The per-column geometry lives in one uid-scoped generated
   * stylesheet, the same approach as `sh-code`'s style buckets. A column
   * whose type has a `renderer` contributes `hosted` cells instead: one
   * component or template instance per visible cell, tracked by column so
   * the instances survive a re-render and are re-fed.
   */
  readonly visibleRows = computed(() => {
    const sheet = this.sheet();
    const from = this.rowStart();
    const to = Math.min(this.rowEnd(), sheet.rows);
    const c0 = this.colStart();
    const c1 = Math.min(this.colEnd(), sheet.cols);
    const registry = this.registry();
    const values = this.values();
    const rowClass = this.rowClass();
    const rowKind = this.rowKind();
    const groupLeft = this.headOffset();
    const groupWidth = this.#colWin.totalSize();
    // One extension lookup per mounted column, not per cell.
    const exts: SheetCellExtension[] = [];
    const types: string[] = [];
    for (let c = c0; c < c1; c++) {
      const type = colTypeAt(sheet, c);
      exts.push(registry.get(type));
      types.push(type ?? 'text');
    }
    const out: { index: number; height: number; cls: string; html: SafeHtml; hosted: SheetHostedCell[] }[] = [];
    for (let r = from; r < to; r++) {
      const parts: string[] = [];
      const hosted: SheetHostedCell[] = [];
      const kind = rowKind?.(r) ?? null;
      let cls = kind ? `shs-row-${kind}` : '';
      const extra = rowClass?.(r);
      if (extra) cls = cls ? `${cls} ${extra}` : extra;
      if (kind === 'group') {
        // A heading: the first cell's text across the whole row, no cell grid.
        parts.push(
          `<span class="shs-c shs-group" style="left:${groupLeft}px;width:${groupWidth}px">${escapeSheetHtml(sheet.cells[r * sheet.cols] ?? '')}</span>`
        );
        out.push({
          index: r,
          height: sheet.rowHeights[r] ?? this.defaultRowHeight(),
          cls,
          html: this.#sanitizer.bypassSecurityTrustHtml(parts.join('')),
          hosted,
        });
        continue;
      }
      for (let c = c0; c < c1; c++) {
        const raw = sheet.cells[r * sheet.cols + c];
        const ext = exts[c - c0];
        let cls = types[c - c0] === 'text' ? `shs-c c${c}` : `shs-c c${c} t-${types[c - c0]}`;
        if (!raw && ext.editor !== 'none' && !ext.renderer) {
          parts.push(`<span class="${cls}"></span>`);
          continue;
        }
        const ctx = { row: r, col: c, type: types[c - c0] };
        let value = raw;
        if (isFormula(raw)) {
          // A formula shows its value through the column's type; an error shows its token.
          const code = values.errorAt(r, c);
          if (code) {
            const message = values.errorMessageAt(r, c);
            const title = message ? `${raw}\n${message}` : raw;
            parts.push(
              `<span class="${cls} shs-formula shs-error" title="${escapeSheetHtml(title).replace(/"/g, '&quot;')}">${code}</span>`
            );
            continue;
          }
          value = values.valueAt(r, c);
          cls += ' shs-formula';
        }
        const error = ext.validate ? ext.validate(value, ctx) : null;
        if (error) cls += ' shs-invalid';
        if (ext.renderer) {
          const template = ext.renderer instanceof TemplateRef ? ext.renderer : null;
          const component = template ? null : (ext.renderer as Type<unknown>);
          const inputs: Record<string, unknown> = {};
          if (component) {
            const names = this.#inputsOf(component);
            if (names.has('value')) inputs['value'] = value;
            if (names.has('ctx')) inputs['ctx'] = ctx;
            if (names.has('extension')) inputs['extension'] = ext;
          }
          hosted.push({
            col: c,
            cls: `${cls} shs-hosted`,
            title: error,
            component,
            template,
            inputs,
            context: { $implicit: value, ctx, extension: ext },
          });
          continue;
        }
        parts.push(
          error
            ? `<span class="${cls}" title="${escapeSheetHtml(error).replace(/"/g, '&quot;')}">${ext.render(value, ctx)}</span>`
            : `<span class="${cls}">${ext.render(value, ctx)}</span>`
        );
      }
      out.push({
        index: r,
        height: sheet.rowHeights[r] ?? this.defaultRowHeight(),
        cls,
        html: this.#sanitizer.bypassSecurityTrustHtml(parts.join('')),
        hosted,
      });
    }
    return out;
  });

  /** The mounted column headers — the given labels or the letters — positioned by the same generated classes. */
  readonly colHeadHtml = computed<SafeHtml>(() => {
    const sheet = this.sheet();
    const c1 = Math.min(this.colEnd(), sheet.cols);
    const headers = this.headers();
    const labels = Array.isArray(headers) ? headers : null;
    const letters = this.letters();
    const parts: string[] = [];
    for (let c = this.colStart(); c < c1; c++) {
      const label = labels?.[c];
      if (label !== undefined) {
        const text = escapeSheetHtml(label);
        parts.push(`<span class="shs-ch shs-ch-label c${c}" title="${text.replace(/"/g, '&quot;')}">${text}</span>`);
      } else parts.push(`<span class="shs-ch c${c}">${letters ? sheetColLabel(c) : ''}</span>`);
    }
    return this.#sanitizer.bypassSecurityTrustHtml(parts.join(''));
  });

  /** The host's kind for a row, `null` for an ordinary one. */
  #kindOf(row: number): SheetRowKind | null {
    return this.rowKind()?.(row) ?? null;
  }

  /** Whether a row takes edits: not a group heading, not a read-only row. */
  #rowEditable(row: number): boolean {
    return this.#kindOf(row) === null;
  }

  /** One paint box per selected range; the last is the active one. */
  readonly selectionRects = computed(() => {
    const raw = this.selection();
    if (!raw?.ranges.length) return [];
    const boxes: { top: number; left: number; width: number; height: number; active: boolean }[] = [];
    raw.ranges.forEach((range, i) => {
      const box = this.rangeBox(range);
      if (box) boxes.push({ ...box, active: i === raw.ranges.length - 1 });
    });
    return boxes;
  });

  /**
   * The paint box of a range in body coordinates (px, past the row-header rail), clamped to the sheet —
   * what the selection boxes use, exposed so an overlay projected into the body (a peer's selection)
   * lands on the same cells. `null` on an empty sheet. Reactive: reads the model and the geometry.
   */
  rangeBox(range: SheetRange): { top: number; left: number; width: number; height: number } | null {
    const sheet = this.sheet();
    if (sheet.rows === 0 || sheet.cols === 0) return null;
    this.#geometry();
    const { r0, c0, r1, c1 } = normalizedRange(sheet, range);
    const rows = this.#rowWin.heights;
    const cols = this.#colWin.heights;
    return {
      top: rows.prefixHeight(r0),
      left: this.headOffset() + cols.prefixHeight(c0),
      width: cols.prefixHeight(c1 + 1) - cols.prefixHeight(c0),
      height: rows.prefixHeight(r1 + 1) - rows.prefixHeight(r0),
    };
  }

  /** The box of the active cell (or of the cell being edited), for the anchor outline and the editor. */
  readonly activeRect = computed(() => {
    const cell = this.editing() ?? this.activeCell();
    if (!cell) return null;
    this.#geometry();
    return this.#cellBox(cell.row, cell.col);
  });

  /** The fill handle: the bottom-right corner of the active range (body-relative px), while editable and not editing. */
  readonly fillHandle = computed(() => {
    if (!this.editable() || this.editing()) return null;
    const range = primarySheetRange(this.selection());
    const sheet = this.sheet();
    if (!range || sheet.rows === 0 || sheet.cols === 0) return null;
    const box = this.rangeBox(this.fillDrag()?.source ?? range);
    return box && { top: box.top + box.height, left: box.left + box.width };
  });

  /** The dashed outline of the cells a fill drag will write, `null` when none. */
  readonly fillPreview = computed(() => {
    const drag = this.fillDrag();
    return drag?.target ? this.rangeBox(drag.target) : null;
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
          if (this.editing()) this.#closeEditor();
        }
      });
    });

    // The formula bar's text follows the active cell and the model. An
    // explicit write, not a property binding: after the user typed into the
    // input, a move to a cell whose source equals the last bound value
    // would leave the typed text in place.
    effect(() => {
      const el = this.barRef()?.nativeElement;
      this.activeCell();
      this.sheet();
      if (!el) return;
      const text = untracked(() => this.activeSource());
      if (el.ownerDocument.activeElement !== el) el.value = text;
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
    else if (top + box.height > scroller.scrollTop + scroller.clientHeight)
      scroller.scrollTop = top + box.height - scroller.clientHeight;
    if (box.left < scroller.scrollLeft + headW) scroller.scrollLeft = box.left - headW;
    else if (box.left + box.width > scroller.scrollLeft + scroller.clientWidth)
      scroller.scrollLeft = box.left + box.width - scroller.clientWidth;
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
    this.#commit(model, ops);
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
    this.#commit(model, ops);
    this.#undo = this.#rebaseStack(this.#undo, ops);
    this.#redo = this.#rebaseStack(this.#redo, ops);
    this.#syncHistoryFlags();
    const editing = this.editing();
    if (editing) {
      // The cell under the editor may have moved; the current text is the
      // user's, so re-anchor by rebasing a probe op rather than guessing.
      const [probe] = transformSheetOps(
        [{ kind: 'set-cells', row: editing.row, col: editing.col, values: [['']] }],
        ops,
        'right'
      ).ops;
      if (probe?.kind === 'set-cells') this.editing.set({ ...editing, row: probe.row, col: probe.col });
      else this.#closeEditor();
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
    this.#commit(model, inverse);
    this.#redo.push(redo.slice());
    this.#syncHistoryFlags();
    this.ops.emit(inverse);
  }

  redo(): void {
    const ops = this.#redo.pop();
    if (!ops) return;
    const { model, inverse } = applySheetOps(this.sheet(), ops);
    this.#commit(model, ops);
    this.#undo.push(inverse.slice());
    this.#syncHistoryFlags();
    this.ops.emit(ops);
  }

  #commit(model: SheetModel, ops: readonly SheetOp[]) {
    this.#pending = { from: this.sheet(), to: model, ops };
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

  /** A cell's editable text: a formula's source, else the type's `format` of the raw string. */
  #sourceAt(row: number, col: number): string {
    const raw = cellAt(this.sheet(), row, col);
    if (isFormula(raw)) return raw;
    const { ext, ctx } = this.#cell(row, col);
    return ext.format ? ext.format(raw, ctx) : raw;
  }

  /** The extension and context for a cell. */
  #cell(row: number, col: number): { ext: SheetCellExtension; ctx: SheetCellContext } {
    const type = colTypeAt(this.sheet(), col);
    return { ext: this.registry().get(type), ctx: { row, col, type: type ?? 'text' } };
  }

  /**
   * Activate a cell the way its extension defines (a checkbox toggles);
   * returns whether the extension handled it.
   */
  activateCell(row: number, col: number): boolean {
    if (!this.editable() || !this.#rowEditable(row)) return false;
    const { ext, ctx } = this.#cell(row, col);
    if (!ext.activate) return false;
    const raw = cellAt(this.sheet(), row, col);
    const next = ext.activate(raw, ctx);
    if (next !== null && next !== raw) {
      this.apply([{ kind: 'set-cells', row, col, values: [[next]] }]);
      this.#announcer.announce(`${sheetCellLabel(row, col)} ${ext.toText?.(next, ctx) ?? next}`);
    }
    return true;
  }

  /** Set (or clear) a column's cell type; the strings stay, only their interpretation changes. */
  setColType(col: number, type: string | null): void {
    if (col < 0 || col >= this.sheet().cols) return;
    this.apply([{ kind: 'set-col-type', col, type: type === 'text' ? null : type }]);
  }

  /** Apply a cell type to every column the selection spans (the context menu's verb). */
  setSelectionColType(type: string | null): void {
    const range = this.activeRange();
    if (!range) return;
    const ops: SheetOp[] = [];
    for (let c = range.c0; c <= range.c1; c++)
      ops.push({ kind: 'set-col-type', col: c, type: type === 'text' ? null : type });
    this.apply(ops);
  }

  #pressCell: { row: number; col: number } | null = null;

  onBodyMouseDown(event: MouseEvent) {
    if (!this.selectable() || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('.shs-editor, .shs-menu')) return;
    event.preventDefault();
    if (this.editing()) this.commitEdit('none');
    this.focus();
    this.#pressCell = null;
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
    this.#pressCell = cell;
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

  /** A plain click (no sweep, no modifier) on an activatable cell activates it. */
  onBodyClick(event: MouseEvent) {
    const press = this.#pressCell;
    this.#pressCell = null;
    if (
      !press ||
      event.shiftKey ||
      event.metaKey ||
      event.ctrlKey ||
      (event.target as HTMLElement).closest('.shs-editor, .shs-rh')
    )
      return;
    const cell = this.#cellFromMouse(event);
    if (!cell || cell.row !== press.row || cell.col !== press.col) return;
    const range = this.activeRange();
    if (range && (range.r0 !== range.r1 || range.c0 !== range.c1)) return;
    this.activateCell(cell.row, cell.col);
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
  // Fill handle
  // -------------------------------------------------------------------------

  /**
   * Dragging the handle at the active range's corner extends it down, up,
   * right or left (whichever axis the pointer travelled further on); the
   * release writes one `set-cells` with the pattern continued
   * (`sheetFillValues`) and selects the source plus the filled cells.
   */
  onFillMouseDown(event: MouseEvent) {
    if (!this.editable() || event.button !== 0 || typeof document === 'undefined') return;
    event.preventDefault();
    event.stopPropagation();
    if (this.editing()) this.commitEdit('none');
    this.focus();
    const source = this.activeRange();
    if (!source) return;
    this.fillDrag.set({ source, target: null });
    const move = (e: MouseEvent) => {
      const cell = this.#cellFromMouse(e);
      this.fillDrag.set({ source, target: cell ? fillTargetOf(source, cell) : null });
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      const target = this.fillDrag()?.target ?? null;
      this.fillDrag.set(null);
      if (!target) return;
      this.fill(source, target);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  /** Fill `target` from the pattern in `source` as one transaction, then select both. */
  fill(source: SheetRange, target: SheetRange): void {
    const sheet = this.sheet();
    const from = normalizedRange(sheet, source);
    const to = normalizedRange(sheet, target);
    const values = sheetFillValues(sheet, from, to).map((row, r) =>
      row.map((value, c) => (this.#rowEditable(to.r0 + r) ? value : cellAt(sheet, to.r0 + r, to.c0 + c)))
    );
    this.apply([{ kind: 'set-cells', row: to.r0, col: to.c0, values }]);
    this.selectRange({
      r0: Math.min(from.r0, to.r0),
      c0: Math.min(from.c0, to.c0),
      r1: Math.max(from.r1, to.r1),
      c1: Math.max(from.c1, to.c1),
    });
    this.#announcer.announce(`Filled ${values.length * (values[0]?.length ?? 0)} cells`);
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
      this.apply([
        axis === 'col'
          ? { kind: 'set-col-width', col: index, width: drag.size }
          : { kind: 'set-row-height', row: index, height: drag.size },
      ]);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  // -------------------------------------------------------------------------
  // In-cell editing
  // -------------------------------------------------------------------------

  /**
   * Open the editor on the active cell, with `initial` (default: the cell's
   * text) as its content. A cell whose type edits by activation only
   * (`editor: 'none'`) is activated instead; typed text goes through the
   * type's `parse` and commits directly.
   */
  startEdit(initial?: string): void {
    const cell = this.activeCell();
    if (!this.editable() || !cell) return;
    if (!this.#rowEditable(cell.row)) {
      this.#announcer.announce(`${sheetCellLabel(cell.row, cell.col)} is read-only`);
      return;
    }
    const { ext, ctx } = this.#cell(cell.row, cell.col);
    if (ext.editor === 'none') {
      if (initial === undefined) this.activateCell(cell.row, cell.col);
      else this.#commitParsed(cell.row, cell.col, initial);
      return;
    }
    const raw = cellAt(this.sheet(), cell.row, cell.col);
    // A formula edits as its source, in the text editor whatever the column type.
    const formula = isFormula(initial ?? raw) || initial === '=';
    if (typeof ext.editor === 'function' && !formula) {
      this.#startComponentEdit(cell.row, cell.col, raw, ctx, ext, initial ?? null);
      return;
    }
    let text = initial ?? (formula || !ext.format ? raw : ext.format(raw, ctx));
    // A typed input (a date picker) only takes its own value shape: seed it
    // with what the typed character parses to, or the cell's own value.
    if (ext.inputType && !formula && initial !== undefined)
      text = (ext.parse ? ext.parse(initial, ctx) : initial) || raw;
    this.editing.set({ row: cell.row, col: cell.col, initial: text, inputType: formula ? undefined : ext.inputType });
    this.#revealCell(cell.row, cell.col);
    afterNextRender(
      () => {
        const el = this.editorRef()?.nativeElement;
        if (!el) return;
        el.value = text;
        el.focus({ preventScroll: true });
        if (el instanceof HTMLTextAreaElement || el.type === 'text') el.setSelectionRange(text.length, text.length);
      },
      { injector: this.#injector }
    );
  }

  /**
   * Create the type's editor component in the overlay over the cell and hand
   * it the inputs it declares: `value`, `ctx`, `typed`, `editor`.
   */
  #startComponentEdit(
    row: number,
    col: number,
    raw: string,
    ctx: SheetCellContext,
    ext: SheetCellExtension,
    typed: string | null
  ): void {
    const component = ext.editor as Type<SheetCellEditor>;
    this.editing.set({ row, col, initial: raw, component });
    this.#revealCell(row, col);
    const api: SheetCellEditorApi = {
      commit: (value, move = 'none') => this.commitRaw(value, move),
      cancel: () => this.cancelEdit(),
    };
    afterNextRender(
      () => {
        const outlet = this.editorOutlet();
        if (!outlet || this.editing()?.component !== component) return;
        outlet.clear();
        const ref = outlet.createComponent(component, { injector: this.#injector });
        const inputs = new Set(reflectComponentType(component)?.inputs.map((i) => i.templateName) ?? []);
        const set = (name: string, value: unknown) => inputs.has(name) && ref.setInput(name, value);
        set('value', raw);
        set('ctx', ctx);
        set('typed', typed);
        set('extension', ext);
        set('editor', api);
        ref.changeDetectorRef.detectChanges();
        this.#editorCmp = ref;
      },
      { injector: this.#injector }
    );
  }

  /**
   * Write the editor's text into its cell (when changed) and move the
   * selection on. A component editor is asked for its `readValue`; one
   * without it is cancelled instead.
   */
  commitEdit(move: SheetCommitMove = 'none'): void {
    const editing = this.editing();
    if (!editing) return;
    if (editing.component) {
      const read = this.#editorCmp?.instance.readValue;
      if (!read) return this.cancelEdit();
      return this.commitRaw(read.call(this.#editorCmp!.instance), move);
    }
    const value = this.editorRef()?.nativeElement.value ?? editing.initial;
    this.editing.set(null);
    this.#commitParsed(editing.row, editing.col, value);
    this.#moveFrom(editing.row, editing.col, move);
    this.focus();
  }

  /**
   * End the open edit by storing `raw` as is — the stored form, not typed
   * text — in the edited cell; what a component editor's `commit` does.
   */
  commitRaw(raw: string, move: SheetCommitMove = 'none'): void {
    const editing = this.editing();
    if (!editing) return;
    this.#closeEditor();
    this.#store(editing.row, editing.col, raw);
    this.#moveFrom(editing.row, editing.col, move);
    this.focus();
  }

  #closeEditor(): void {
    this.#editorCmp = null;
    this.editing.set(null);
  }

  /** Store `input` in a cell through its type's `parse` (a formula is stored as typed); a rejected input leaves the cell alone. */
  #commitParsed(row: number, col: number, input: string): void {
    const { ext, ctx } = this.#cell(row, col);
    const next = isFormula(input) ? input : ext.parse ? ext.parse(input, ctx) : input;
    if (next === null) {
      this.#announcer.announce(`${sheetCellLabel(row, col)} rejected ${input}`, 'assertive');
      return;
    }
    this.#store(row, col, next);
  }

  /** Store a raw string in a cell (when changed) as one `set-cells` op and voice it. */
  #store(row: number, col: number, next: string): void {
    if (next === cellAt(this.sheet(), row, col)) return;
    if (!this.#rowEditable(row)) {
      this.#announcer.announce(`${sheetCellLabel(row, col)} is read-only`, 'assertive');
      return;
    }
    const { ext, ctx } = this.#cell(row, col);
    this.apply([{ kind: 'set-cells', row, col, values: [[next]] }]);
    this.#announcer.announce(
      `${sheetCellLabel(row, col)} set to ${(ext.toText ? ext.toText(next, ctx) : next) || 'empty'}`
    );
  }

  cancelEdit(): void {
    if (!this.editing()) return;
    this.#closeEditor();
    this.focus();
  }

  /**
   * Keys inside a component editor are the component's; the grid's keymap
   * never sees them. Escape not consumed by the component cancels, Tab
   * commits (through `readValue`) and moves.
   */
  onEditorHostKeydown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.defaultPrevented) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      this.commitEdit(event.shiftKey ? 'left' : 'right');
    }
  }

  // -------------------------------------------------------------------------
  // Formula bar
  // -------------------------------------------------------------------------

  /** The cell the formula bar took focus on — what its text belongs to, whatever the selection does meanwhile. */
  #barCell: { row: number; col: number } | null = null;

  onBarFocus() {
    this.#barCell = this.activeCell();
  }

  /**
   * The autocomplete list: the registered functions whose name starts with
   * the word at the caret, while the bar holds a formula. `null` when
   * closed.
   */
  readonly barHints = signal<SheetBarHints | null>(null);

  /** Recompute the autocomplete from the bar's text and caret. */
  onBarInput() {
    const el = this.barRef()?.nativeElement;
    if (!el || !this.editable() || (!isFormula(el.value) && el.value !== '=')) {
      this.barHints.set(null);
      return;
    }
    const caret = el.selectionStart ?? el.value.length;
    const before = el.value.slice(0, caret);
    // Inside a string literal, or not on a word: nothing to complete.
    const inString = (before.match(/"/g)?.length ?? 0) % 2 === 1;
    const word = inString ? null : /(^|[^A-Za-z0-9_.$])([A-Za-z_][A-Za-z0-9_.]*)$/.exec(before);
    if (!word) {
      this.barHints.set(null);
      return;
    }
    const prefix = word[2].toUpperCase();
    const items = this.functionRegistry()
      .list()
      .filter((fn) => fn.name.toUpperCase().startsWith(prefix))
      .slice(0, 8);
    this.barHints.set(items.length ? { items, active: 0, start: caret - word[2].length, end: caret } : null);
  }

  /** Put the hint's name (with its opening parenthesis) in place of the word being completed. */
  completeHint(index = this.barHints()?.active ?? 0): void {
    const hints = this.barHints();
    const el = this.barRef()?.nativeElement;
    this.barHints.set(null);
    if (!hints || !el) return;
    const fn = hints.items[index];
    if (!fn) return;
    const after = el.value.slice(hints.end);
    const paren = after.startsWith('(') ? '' : '(';
    const name = fn.name.toUpperCase();
    el.value = el.value.slice(0, hints.start) + name + paren + after;
    const caret = hints.start + name.length + 1;
    el.setSelectionRange(caret, caret);
    el.focus();
  }

  /** Move the active hint by `delta`, wrapping. */
  moveHint(delta: number): void {
    this.barHints.update((hints) =>
      hints ? { ...hints, active: (hints.active + delta + hints.items.length) % hints.items.length } : null
    );
  }

  /** Write the formula bar's text into its cell (through `parse`, a formula as is) and return focus to the grid. */
  commitBar(): void {
    this.#commitBar();
    this.focus();
  }

  #commitBar(): void {
    const cell = this.#barCell ?? this.activeCell();
    const el = this.barRef()?.nativeElement;
    this.#barCell = null;
    this.barHints.set(null);
    if (!cell || !el) return;
    if (this.editing()) this.cancelEdit();
    if (el.value !== this.#sourceAt(cell.row, cell.col)) this.#commitParsed(cell.row, cell.col, el.value);
    el.value = this.activeSource();
  }

  /** Drop the formula bar's edit: the input shows the cell's source again. */
  cancelBar(): void {
    const el = this.barRef()?.nativeElement;
    this.#barCell = null;
    this.barHints.set(null);
    if (el) el.value = this.activeSource();
    this.focus();
  }

  onBarKeydown(event: KeyboardEvent) {
    event.stopPropagation();
    if (this.barHints()) {
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp':
          event.preventDefault();
          this.moveHint(event.key === 'ArrowDown' ? 1 : -1);
          return;
        case 'Tab':
        case 'Enter':
          event.preventDefault();
          this.completeHint();
          return;
        case 'Escape':
          event.preventDefault();
          this.barHints.set(null);
          return;
      }
    }
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        this.commitBar();
        return;
      case 'Escape':
        event.preventDefault();
        this.cancelBar();
        return;
    }
  }

  /** Focus leaving the bar (a click on a cell, a tab out) keeps a changed text — in the cell it was typed for. */
  onBarBlur() {
    this.#commitBar();
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
    const page = Math.max(
      1,
      Math.floor((this.scroller?.()?.nativeElement.clientHeight ?? 300) / this.defaultRowHeight()) - 1
    );
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
        this.#announcer.announce(
          extend
            ? `${sheetCellLabel(settled.row, settled.col)} to ${sheetCellLabel(headNow.row, headNow.col)}`
            : sheetCellLabel(settled.row, settled.col)
        );
      }
      return;
    }

    if (!editable || meta) return;
    if (key === 'Enter' || key === 'F2' || (key === ' ' && this.#cell(cell.row, cell.col).ext.activate)) {
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
    return {
      row: Math.max(0, Math.min(range.r1, sheet.rows - 1)),
      col: Math.max(0, Math.min(range.c1, sheet.cols - 1)),
    };
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
    // TSV stays raw (lossless between sheets); the HTML flavor shows each
    // type's display form for rich targets and carries the raw in data-raw.
    event.clipboardData.setData('text/plain', sheetRangeToTsv(this.sheet(), range));
    event.clipboardData.setData('text/html', sheetRangeToHtml(this.sheet(), range, this.registry()));
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
      if (model)
        values = Array.from({ length: model.rows }, (_, r) => model.cells.slice(r * model.cols, (r + 1) * model.cols));
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

  /**
   * Write a block of values at (row, col), inserting rows/columns so it
   * fits. Each value passes through its column type's `parse`; a rejected
   * value keeps the cell's current text.
   */
  pasteValues(row: number, col: number, values: readonly (readonly string[])[]): void {
    const sheet = this.sheet();
    const ops: SheetOp[] = [];
    const needRows = row + values.length - sheet.rows;
    const needCols = col + Math.max(0, ...values.map((line) => line.length)) - sheet.cols;
    if (needRows > 0) ops.push({ kind: 'insert-rows', at: sheet.rows, count: needRows });
    if (needCols > 0) ops.push({ kind: 'insert-cols', at: sheet.cols, count: needCols });
    const registry = this.registry();
    const parsed = values.map((line, r) =>
      line.map((input, c) => {
        // A read-only row keeps what it has (a new row past the end is ordinary).
        if (row + r < sheet.rows && !this.#rowEditable(row + r)) return cellAt(sheet, row + r, col + c);
        const type = colTypeAt(sheet, col + c);
        const ext = registry.get(type);
        if (!ext.parse || isFormula(input)) return input;
        return (
          ext.parse(input, { row: row + r, col: col + c, type: type ?? 'text' }) ?? cellAt(sheet, row + r, col + c)
        );
      })
    );
    ops.push({ kind: 'set-cells', row, col, values: parsed });
    this.apply(ops);
    const r1 = row + values.length - 1;
    const c1 = col + Math.max(1, ...values.map((line) => line.length)) - 1;
    this.selectRange({ r0: row, c0: col, r1, c1 });
    this.#announcer.announce(
      `Pasted ${values.length} row${values.length === 1 ? '' : 's'} at ${sheetCellLabel(row, col)}`
    );
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
      // A read-only row keeps its cells.
      const values = Array.from({ length: r1 - r0 + 1 }, (_, i) =>
        this.#rowEditable(r0 + i)
          ? new Array<string>(c1 - c0 + 1).fill('')
          : sheet.cells.slice((r0 + i) * sheet.cols + c0, (r0 + i) * sheet.cols + c1 + 1)
      );
      return { kind: 'set-cells', row: r0, col: c0, values };
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


/**
 * The cells a fill from `source` towards `cell` writes: the band past the
 * range's edge on the axis the pointer moved further along, the range's
 * full extent on the other; `null` while the pointer is inside the range.
 */
function fillTargetOf(source: SheetRange, cell: { row: number; col: number }): SheetRange | null {
  const dRow = cell.row > source.r1 ? cell.row - source.r1 : cell.row < source.r0 ? cell.row - source.r0 : 0;
  const dCol = cell.col > source.c1 ? cell.col - source.c1 : cell.col < source.c0 ? cell.col - source.c0 : 0;
  if (dRow === 0 && dCol === 0) return null;
  if (Math.abs(dRow) >= Math.abs(dCol)) {
    return dRow > 0
      ? { r0: source.r1 + 1, r1: cell.row, c0: source.c0, c1: source.c1 }
      : { r0: cell.row, r1: source.r0 - 1, c0: source.c0, c1: source.c1 };
  }
  return dCol > 0
    ? { r0: source.r0, r1: source.r1, c0: source.c1 + 1, c1: cell.col }
    : { r0: source.r0, r1: source.r1, c0: cell.col, c1: source.c0 - 1 };
}
