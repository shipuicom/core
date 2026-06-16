import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  output,
  Renderer2,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { observeChildren, ShipColor, shipComponentClasses, ShipTableVariant } from '@ship-ui/core';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipProgressBar } from '@ship-ui/core/ship-progress-bar';

export interface ShipTableColumn<T = any> {
  id: string;
  header: string;
  accessorKey?: keyof T | string;
  type?: 'string' | 'number' | 'date' | 'boolean' | 'badge' | (string & {});
  sortable?: boolean;
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
  size?: string;
  sticky?: 'start' | 'end' | null;
  cell?: (row: T) => any;
  cellTemplate?: TemplateRef<any> | null;
  format?: (value: any, row: T) => any;
  sortPredicate?: (a: T, b: T) => number;
  rowHeader?: boolean;
}

@Directive({
  selector: '[shResize]',
  standalone: true,
  host: {
    '[class.resizing]': 'resizingClass()',
  },
})
export class ShipResize {
  #el = inject(ElementRef) as ElementRef<HTMLTableCellElement>;
  #renderer = inject(Renderer2);
  #table = inject(ShipTable);

  resizable = input<boolean>(true);
  minWidth = input<number>(50);
  maxWidth = input<number | null>(null);

  resizingClass = signal(false);

  #startX!: number;
  #startWidth!: number;
  #resizing = false;
  #animationFrameRequest: number | null = null; // Store request ID

  ngOnInit() {
    if (!this.#table) {
      console.error('shTableResize directive must be used within a sh-table component.');
      return;
    }

    if (this.resizable()) {
      const resizer = this.#renderer.createElement('div');
      this.#renderer.addClass(resizer, 'sh-resizer');
      this.#renderer.appendChild(this.#el.nativeElement, resizer);
      this.#renderer.listen(resizer, 'mousedown', this.#onMouseDown.bind(this));
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.#resizing) return;

    this.#scheduleResize(event);
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (this.#resizing) {
      this.#resizing = false;
      this.resizingClass.set(false);

      if (this.#animationFrameRequest !== null) {
        cancelAnimationFrame(this.#animationFrameRequest);
        this.#animationFrameRequest = null;
      }

      // Delay resetting the table's resizing state to block sorting clicks immediately after resizing
      setTimeout(() => {
        this.#table.resizing.set(false);
      }, 50);
    }
  }

  @HostListener('document:click', ['$event']) onClick(event: MouseEvent) {
    if (this.#resizing) {
      event.stopPropagation();
    }
  }

  #onMouseDown(event: MouseEvent) {
    event.stopPropagation();

    if (!this.resizable()) return;

    this.#table.resizing.set(true);
    this.#resizing = true;
    this.resizingClass.set(true);
    this.#startX = event.pageX;
    this.#startWidth = this.#el.nativeElement.offsetWidth;
  }

  #scheduleResize(event: MouseEvent) {
    if (this.#animationFrameRequest !== null) {
      cancelAnimationFrame(this.#animationFrameRequest);
    }

    this.#animationFrameRequest = requestAnimationFrame(() => {
      this.#resizeColumn(event);
      this.#animationFrameRequest = null;
    });
  }

  #resizeColumn(event: MouseEvent) {
    const width = this.#startWidth + (event.pageX - this.#startX);
    const constrainedWidth = Math.max(
      this.minWidth(),
      this.maxWidth() ? Math.min(width, this.maxWidth() ?? width) : width
    );

    this.#renderer.setAttribute(this.#el.nativeElement, 'size', `${constrainedWidth}px`);
    this.#table.updateColumnSizes();
  }

  ngOnDestroy() {
    if (this.#animationFrameRequest !== null) {
      cancelAnimationFrame(this.#animationFrameRequest);
    }
  }
}

@Directive({
  selector: '[shSort]',
  standalone: true,
  host: {
    role: 'columnheader',
    '[class.sortable]': '!!shSort()',
    '[attr.tabindex]': 'shSort() ? "0" : null',
    '(click)': 'shSort() ? toggleSort() : null',
    '(keydown.enter)': 'shSort() ? toggleSort() : null',
    '(keydown.space)': 'shSort() ? toggleSort($event) : null',
    '[attr.aria-sort]': 'shSort() ? ariaSort() : null',
    '[class.sort-asc]': 'sortAsc()',
    '[class.sort-desc]': 'sortDesc()',
  },
})
export class ShipSort {
  #table = inject(ShipTable);
  shSort = input<string | undefined>();

  sortAsc = computed(() => {
    const currentSort = this.#table.sortByColumn();
    const thisColumn = this.shSort();

    if (!currentSort || !thisColumn) return false;

    return currentSort === thisColumn;
  });

  sortDesc = computed(() => {
    const currentSort = this.#table.sortByColumn();
    const thisColumn = this.shSort();

    if (!currentSort || !thisColumn) return false;

    return currentSort === `-${thisColumn}`;
  });

  ariaSort = computed(() => {
    if (this.sortAsc()) return 'ascending';
    if (this.sortDesc()) return 'descending';
    return 'none';
  });

  toggleSort(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    if (this.#table.resizing()) {
      return;
    }
    const sortCol = this.shSort();

    if (!sortCol) return;

    this.#table.toggleSort(sortCol);
  }
}

@Directive({
  selector: '[shStickyColumns]',

  host: {
    '[class.sticky]': 'shStickyColumns() === "start" || shStickyColumns() === ""',
    '[class.sticky-end]': 'shStickyColumns() === "end"',
  },
})
export class ShipStickyColumns {
  #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  #renderer = inject(Renderer2);

  shStickyColumns = input<'start' | 'end' | (string & {})>('start');

  ngAfterContentInit() {
    this.#applyGridColumnStyle();
  }

  #applyGridColumnStyle() {
    const nativeElement = this.#elementRef.nativeElement;
    const cellChildren = nativeElement.querySelectorAll<HTMLTableCellElement>(':scope > th, :scope > td');
    const columnSpanCount = cellChildren.length;

    if (columnSpanCount > 0) {
      const position = this.shStickyColumns();

      this.#renderer.setStyle(
        nativeElement,
        'grid-column',
        position === 'end' ? `-${columnSpanCount + 1} / -1` : `1 / ${columnSpanCount + 1}`
      );
    }
  }
}

const SCROLL_TOLERANCE = 1.5;
type ScrollState = -1 | 0 | 1;

@Component({
  selector: 'sh-table',
  styleUrl: './ship-table.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipProgressBar],
  template: `
    <div class="actionbar">
      <ng-content select="[actionbar]:not([align-right])" />
      <div class="actionbar-right">
        <ng-content select="[actionbar][align-right]" />
      </div>
    </div>

    @if (loading()) {
      <sh-progress-bar class="indeterminate primary" />
    }

    <ng-content select="sh-table-content" />

    @if (!content()) {
      <thead #theadLocal role="rowgroup">
        <ng-content select="th" />
        <ng-content select="[thead]" />
      </thead>

      <tbody #tbodyLocal role="rowgroup">
        <ng-content />
      </tbody>
    }

    @if (!loading()) {
      <div class="no-rows">
        <ng-content select="[table-no-rows]" />
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'table',
    '[attr.aria-busy]': 'loading()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledby()',
    '[class]': 'hostClasses()',
    '[style.grid-template-columns]': 'columnSizes()',
    '[class.resizing]': 'resizing()',
    '(scroll)': 'onScroll()',
    '[class.can-scroll-x]': 'canScrollX()',
    '[class.can-scroll-y]': 'canScrollY()',
    '[class.scrolled-x]': 'scrollXState() >= 0',
    '[class.scrolled-x-end]': 'scrollXState() === 1',
    '[class.scrolled-y]': 'scrollYState() >= 0',
    '[class.scrolled-y-end]': 'scrollYState() === 1',
  },
})
export class ShipTable {
  #el = inject(ElementRef);

  loading = input<boolean>(false);
  data = input<any>([]);
  dataChange = output<any>();
  sortByColumn = model<string | null>(null);

  color = input<ShipColor | null>(null);
  variant = input<ShipTableVariant | null>(null);

  ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });

  hostClasses = shipComponentClasses('table', {
    color: this.color,
    variant: this.variant,
  });

  content = contentChild(ShipTableContent);

  theadLocal = viewChild<ElementRef<HTMLTableSectionElement>>('theadLocal');
  tbodyLocal = viewChild<ElementRef<HTMLTableSectionElement>>('tbodyLocal');

  thead = computed(() => this.content()?.thead() || this.theadLocal());
  tbody = computed(() => this.content()?.tbody() || this.tbodyLocal());
  columns = observeChildren<HTMLTableColElement>(this.thead, ['tr:first-child th']);

  stickyHeaderHeight = signal<number>(0);

  #destroyRef = inject(DestroyRef);
  #resizeObserver: ResizeObserver | null = null;

  theadEffect = effect(() => {
    const head = this.thead()?.nativeElement;

    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }

    if (head && typeof ResizeObserver !== 'undefined') {
      this.#resizeObserver = new ResizeObserver((entries) => {
        const height = head.clientHeight;
        this.stickyHeaderHeight.set(height);
      });
      this.#resizeObserver.observe(head);
    }
  });

  #cleanup = this.#destroyRef.onDestroy(() => {
    this.#resizeObserver?.disconnect();
  });

  bodyEffect = effect(() => {
    const body = this.tbody()?.nativeElement;
    const head = this.thead()?.nativeElement;

    if (!body || !head) return;

    const stickyHeaderHeight = this.stickyHeaderHeight();

    queueMicrotask(() => {
      const hasStickyRowHeaderStartElement = head.querySelectorAll('tr.sticky').length > 0;
      const stickyBodyRows = body.querySelectorAll('tr.sticky');
      const hasStickyRowStartElement = stickyBodyRows.length > 0;

      if (hasStickyRowStartElement && hasStickyRowHeaderStartElement) {
        for (let index = 0; index < stickyBodyRows.length; index++) {
          (stickyBodyRows[index] as HTMLElement).style.top = `${stickyHeaderHeight}px`;
        }
      }
    });
  });

  resizing = signal(false);
  sizeTrigger = signal(true);
  #initialData: any | null = null;
  #initialDataSet = signal(false);
  scrollXState = signal<ScrollState>(-1);
  scrollYState = signal<ScrollState>(-1);
  canScrollX = signal(false);
  canScrollY = signal(false);

  columnSizes = computed(() => {
    this.sizeTrigger();
    const colSignal = this.columns.signal();

    return colSignal.reduce((acc: string, col: any, index: number) => {
      const colEl = col;
      const colSize = colEl.getAttribute('size');
      const last = index === colSignal.length - 1;

      if (colSize) {
        return `${acc} ${colSize}`;
      }

      if (colEl.classList.contains('sticky') || colEl.classList.contains('sticky-end')) {
        return `${acc} min-content`;
      }

      if (last) {
        return `${acc} 1fr`;
      }

      return `${acc} 1fr`;
    }, '');
  });

  updateColumnSizes() {
    this.sizeTrigger.set(!this.sizeTrigger());
  }

  onScroll(): void {
    this.#checkScroll();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.#checkScroll();
  }

  ngAfterViewInit() {
    queueMicrotask(() => this.#checkScroll());
  }

  e = effect(() => {
    const sortByColumn = this.sortByColumn();

    if (sortByColumn === null) {
      if (!this.#initialDataSet()) {
        this.#initialData = this.data();
        this.#initialDataSet.set(true);
      }

      return this.dataChange.emit(structuredClone(this.#initialData));
    }

    const column = sortByColumn.startsWith('-') ? sortByColumn.slice(1) : sortByColumn;
    const isDescending = sortByColumn.startsWith('-');

    const sortedData = this.data().sort((a: any, b: any) => {
      const colConfig = this.content()
        ?.columns()
        ?.find((c) => c.id === column);

      if (colConfig?.sortPredicate) {
        const predicateResult = colConfig.sortPredicate(a, b);
        return isDescending ? -predicateResult : predicateResult;
      }

      const valueA = a[column] as any;
      const valueB = b[column] as any;

      let comparison = 0;

      if (colConfig?.type === 'date') {
        const dateA = valueA ? new Date(valueA).getTime() : 0;
        const dateB = valueB ? new Date(valueB).getTime() : 0;
        comparison = dateA - dateB;
      } else if (colConfig?.type === 'number') {
        const numA = Number(valueA) || 0;
        const numB = Number(valueB) || 0;
        comparison = numA - numB;
      } else if (colConfig?.type === 'boolean') {
        const boolA = valueA ? 1 : 0;
        const boolB = valueB ? 1 : 0;
        comparison = boolA - boolB;
      } else if (colConfig?.type === 'string' || colConfig?.type === 'badge') {
        const strA = (valueA ?? '').toString();
        const strB = (valueB ?? '').toString();
        comparison = strA.localeCompare(strB, undefined, { sensitivity: 'base' });
      } else {
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          comparison = valueA - valueB;
        } else if (valueA instanceof Date && valueB instanceof Date) {
          comparison = valueA.getTime() - valueB.getTime();
        } else if (typeof valueA === 'string' && typeof valueB === 'string') {
          comparison = valueA.localeCompare(valueB, undefined, { sensitivity: 'base' });
        }
      }

      return isDescending ? -comparison : comparison;
    });

    this.dataChange.emit(sortedData);
  });

  toggleSort(column: string) {
    const currentSort = this.sortByColumn();
    const sortDir = currentSort === column ? `-${column}` : currentSort === `-${column}` ? null : column;

    this.sortByColumn.set(sortDir);
  }

  #checkScroll(): void {
    const element = this.#el.nativeElement as HTMLElement;
    let nextXState: ScrollState = -1;
    let nextYState: ScrollState = -1;

    const canScrollX = element.scrollWidth > element.clientWidth + SCROLL_TOLERANCE;

    if (canScrollX) {
      const isAtStartX = element.scrollLeft <= SCROLL_TOLERANCE;
      const isAtEndX = element.scrollWidth - (element.scrollLeft + element.clientWidth) < SCROLL_TOLERANCE;

      if (isAtEndX) {
        nextXState = 1;
      } else if (!isAtStartX) {
        nextXState = 0;
      }
    }

    this.scrollXState.set(nextXState);
    this.canScrollX.set(canScrollX);

    const canScrollY = element.scrollHeight > element.clientHeight + SCROLL_TOLERANCE;

    if (canScrollY) {
      const isAtStartY = element.scrollTop <= SCROLL_TOLERANCE;
      const isAtEndY = element.scrollHeight - (element.scrollTop + element.clientHeight) < SCROLL_TOLERANCE;

      if (isAtEndY) {
        nextYState = 1;
      } else if (!isAtStartY) {
        nextYState = 0;
      }
    }

    this.scrollYState.set(nextYState);
    this.canScrollY.set(canScrollY);
  }
}

@Component({
  selector: 'sh-table-content',
  standalone: true,
  imports: [NgTemplateOutlet, ShipSort, ShipResize, ShipIcon, ShipChip],
  host: {
    style: 'display: contents',
  },
  template: `
    <thead #thead role="rowgroup">
      <tr role="row">
        @for (col of columns(); track col.id) {
          @if (col.resizable) {
            <th
              role="columnheader"
              [id]="col.id"
              [attr.aria-label]="col.header"
              [shSort]="col.sortable ? col.id : undefined"
              shResize
              [minWidth]="col.minWidth ?? 50"
              [maxWidth]="col.maxWidth ?? null"
              [attr.size]="col.size || null"
              [class.sticky]="col.sticky === 'start'"
              [class.sticky-end]="col.sticky === 'end'">
              {{ col.header }}
              @if (col.sortable) {
                @if (sortByColumn() === col.id) {
                  <sh-icon>caret-up</sh-icon>
                } @else if (sortByColumn() === '-' + col.id) {
                  <sh-icon>caret-down</sh-icon>
                } @else {
                  <sh-icon>arrows-down-up</sh-icon>
                }
              }
            </th>
          } @else {
            <th
              role="columnheader"
              [id]="col.id"
              [attr.aria-label]="col.header"
              [shSort]="col.sortable ? col.id : undefined"
              [attr.size]="col.size || null"
              [class.sticky]="col.sticky === 'start'"
              [class.sticky-end]="col.sticky === 'end'">
              {{ col.header }}
              @if (col.sortable) {
                @if (sortByColumn() === col.id) {
                  <sh-icon>caret-up</sh-icon>
                } @else if (sortByColumn() === '-' + col.id) {
                  <sh-icon>caret-down</sh-icon>
                } @else {
                  <sh-icon>arrows-down-up</sh-icon>
                }
              }
            </th>
          }
        }
      </tr>
    </thead>

    <tbody #tbody role="rowgroup">
      @for (row of data(); track $index) {
        @let rowIndex = $index;
        <tr role="row">
          @for (col of columns(); track col.id) {
            <td
              [class.sticky]="col.sticky === 'start'"
              [class.sticky-end]="col.sticky === 'end'"
              [id]="col.id + '-' + rowIndex"
              [attr.aria-labelledby]="col.id + ' ' + col.id + '-' + rowIndex"
              [attr.role]="col.rowHeader ? 'rowheader' : 'cell'">
              @if (col.cellTemplate) {
                <ng-container
                  [ngTemplateOutlet]="col.cellTemplate"
                  [ngTemplateOutletContext]="{ $implicit: row, column: col }" />
              } @else if (col.cell) {
                {{ col.cell(row) }}
              } @else if (col.format) {
                {{ col.format(getValue(row, col), row) }}
              } @else {
                @switch (col.type) {
                  @case ('date') {
                    {{ formatDate(getValue(row, col)) }}
                  }
                  @case ('boolean') {
                    @if (getValue(row, col)) {
                      <sh-icon class="text-success">check</sh-icon>
                    } @else {
                      <sh-icon class="text-muted">x</sh-icon>
                    }
                  }
                  @case ('badge') {
                    <sh-chip>{{ getValue(row, col) }}</sh-chip>
                  }
                  @default {
                    {{ getValue(row, col) }}
                  }
                }
              }
            </td>
          }
        </tr>
      }
    </tbody>
  `,
})
export class ShipTableContent {
  #table = inject(ShipTable);

  columns = input<ShipTableColumn[]>([]);
  data = input<any[]>([]);

  sortByColumn = this.#table.sortByColumn;

  thead = viewChild<ElementRef<HTMLTableSectionElement>>('thead');
  tbody = viewChild<ElementRef<HTMLTableSectionElement>>('tbody');

  getValue(row: any, col: ShipTableColumn): any {
    if (!row) return '';
    const key = col.accessorKey || col.id;
    return row[key];
  }

  formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString();
  }
}
