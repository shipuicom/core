import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
  viewChild,
} from '@angular/core';
import { ShipProgressBar } from '../ship-progress-bar/ship-progress-bar';
import { observeChildren } from '../utilities/observe-elements';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipColor, ShipTableVariant } from '../utilities/ship-types';

@Directive({
  selector: '[shResize]',
  standalone: true,
})
export class ShipResize {
  #el = inject(ElementRef) as ElementRef<HTMLTableCellElement>;
  #renderer = inject(Renderer2);
  #table = inject(ShipTable);

  resizable = input<boolean>(true);
  minWidth = input<number>(50);
  maxWidth = input<number | null>(null);

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
      this.#table.resizing.set(false);

      if (this.#animationFrameRequest !== null) {
        cancelAnimationFrame(this.#animationFrameRequest);
        this.#animationFrameRequest = null;
      }
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
    class: 'sortable',
    '(mousedown)': 'toggleSort()',
    '[class.sort-asc]': 'sortAsc()',
    '[class.sort-desc]': 'sortDesc()',
  },
})
export class ShipSort {
  #table = inject(ShipTable);
  shSort = input<string>();

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

  toggleSort() {
    const sortCol = this.shSort();

    if (!sortCol) return;

    this.#table.toggleSort(sortCol);
  }
}

@Directive({
  selector: '[shStickyColumns]',

  host: {
    '[class.sticky]': 'shStickyColumns() === "start"',
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
  imports: [ShipProgressBar],
  template: `
    <div class="actionbar">
      <ng-content select="[actionbar]" />
    </div>

    @if (loading()) {
      <sh-progress-bar class="indeterminate primary" />
    }

    <thead #thead>
      <ng-content select="th" />
      <ng-content select="[thead]" />
    </thead>

    <tbody #tbody>
      <ng-content />
    </tbody>

    @if (!loading()) {
      <div class="no-rows">
        <ng-content select="[table-no-rows]" />
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
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

  hostClasses = shipComponentClasses('table', {
    color: this.color,
    variant: this.variant,
  });

  thead = viewChild<ElementRef<HTMLTableSectionElement>>('thead');
  tbody = viewChild<ElementRef<HTMLTableSectionElement>>('tbody');
  columns = observeChildren<HTMLTableColElement>(this.thead, ['tr:first-child th']);

  stickyHeaderHeight = computed(() => {
    const _ = this.hostClasses();
    const height = this.thead()?.nativeElement?.clientHeight;

    return height ?? 0;
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
      const valueA = a[column] as any;
      const valueB = b[column] as any;

      let comparison = 0;

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        comparison = valueA - valueB;
      }

      if (valueA instanceof Date && valueB instanceof Date) {
        comparison = valueA.getTime() - valueB.getTime();
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        comparison = valueA.localeCompare(valueB, undefined, { sensitivity: 'base' });
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
