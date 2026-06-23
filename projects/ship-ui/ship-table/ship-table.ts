import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  effect,
  ElementRef,
  HostListener,
  inject,
  Injector,
  input,
  model,
  output,
  Renderer2,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { observeChildren, ShipColor, shipComponentClasses, ShipTableVariant } from '@ship-ui/core';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';
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
  #keybindings = inject(ShipA11yKeybindingsService);
  #injector = inject(Injector);
  #sort = signal<ShipSort | null>(null);

  resizable = input<boolean>(true);
  minWidth = input<number>(50);
  maxWidth = input<number | null>(null);

  resizingClass = signal(false);

  #startX!: number;
  #startWidth!: number;
  #resizing = false;
  #animationFrameRequest: number | null = null; 

  constructor() {
    effect(() => {
      if (this.#sort()) return;

      const hostEl = this.#el.nativeElement;
      if (this.resizable()) {
        const parts: string[] = [];
        const decAction = 'table.column-resize-decrease';
        const decShortcut = this.#keybindings.getShortcut(decAction);
        if (decShortcut) {
          parts.push(this.#keybindings.getDisplayShortcut(decAction) || decShortcut);
        }
        const incAction = 'table.column-resize-increase';
        const incShortcut = this.#keybindings.getShortcut(incAction);
        if (incShortcut) {
          parts.push(this.#keybindings.getDisplayShortcut(incAction) || incShortcut);
        }

        if (parts.length > 0) {
          this.#renderer.setAttribute(hostEl, 'aria-keyshortcuts', parts.join(', '));
        } else {
          this.#renderer.removeAttribute(hostEl, 'aria-keyshortcuts');
        }
      } else {
        this.#renderer.removeAttribute(hostEl, 'aria-keyshortcuts');
      }
    });
  }

  ngOnInit() {
    if (!this.#table) {
      console.error('shTableResize directive must be used within a sh-table component.');
      return;
    }

    const hostEl = this.#el.nativeElement;

    
    this.#sort.set(this.#injector.get(ShipSort, null, { optional: true, self: true }));

    if (this.resizable()) {
      const resizer = this.#renderer.createElement('div');
      this.#renderer.addClass(resizer, 'sh-resizer');
      this.#renderer.appendChild(hostEl, resizer);
      this.#renderer.listen(resizer, 'mousedown', this.#onMouseDown.bind(this));

      if (!hostEl.hasAttribute('role')) {
        this.#renderer.setAttribute(hostEl, 'role', 'columnheader');
      }

      if (!this.#sort() && !hostEl.hasAttribute('tabindex')) {
        this.#renderer.setAttribute(hostEl, 'tabindex', '0');
      }
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.resizable()) return;

    const target = event.target as HTMLElement;
    const host = this.#el.nativeElement;
    if (
      target !== host &&
      (target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button, input, select, textarea, a') !== null ||
        target.closest('[role="button"], [role="checkbox"], [role="menuitem"]') !== null)
    ) {
      return;
    }

    if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && !event.shiftKey) {
      if (!this.#sort()) {
        const parentRow = host.parentElement;
        if (parentRow) {
          const headers = Array.from(parentRow.querySelectorAll<HTMLElement>('th')).filter(
            (el) => el.getAttribute('tabindex') === '0' || el.hasAttribute('shSort') || el.hasAttribute('shResize')
          );
          const currentIndex = headers.indexOf(host);
          if (currentIndex !== -1) {
            const nextIndex = event.key === 'ArrowRight' ? currentIndex + 1 : currentIndex - 1;
            if (nextIndex >= 0 && nextIndex < headers.length) {
              event.preventDefault();
              headers[nextIndex].focus();
              return;
            }
          }
        }
      }
    }

    const isDecrease = this.#keybindings.matches(event, 'table.column-resize-decrease');
    const isIncrease = this.#keybindings.matches(event, 'table.column-resize-increase');

    if (isDecrease || isIncrease) {
      event.preventDefault();
      event.stopPropagation();

      const currentWidth = this.#el.nativeElement.offsetWidth;
      const step = 10;
      const targetWidth = isDecrease ? currentWidth - step : currentWidth + step;

      const constrainedWidth = Math.max(
        this.minWidth(),
        this.maxWidth() ? Math.min(targetWidth, this.maxWidth() ?? targetWidth) : targetWidth
      );

      this.#renderer.setAttribute(this.#el.nativeElement, 'size', `${constrainedWidth}px`);
      this.#table.updateColumnSizes();
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
    '[attr.tabindex]': 'tabIndex()',
    '(click)': 'shSort() ? toggleSort($event) : null',
    '[attr.aria-sort]': 'shSort() ? ariaSort() : null',
    '[class.sort-asc]': 'sortAsc()',
    '[class.sort-desc]': 'sortDesc()',
    '[attr.aria-keyshortcuts]': 'ariaKeyshortcuts()',
  },
})
export class ShipSort {
  #table = inject(ShipTable);
  #keybindings = inject(ShipA11yKeybindingsService);
  #injector = inject(Injector);
  #el = inject(ElementRef) as ElementRef<HTMLTableCellElement>;
  #resize = signal<ShipResize | null>(null);
  shSort = input<string | undefined>();

  ngOnInit() {
    // Resolve ShipResize lazily to avoid circular DI instantiation issues
    this.#resize.set(this.#injector.get(ShipResize, null, { optional: true, self: true }));
  }

  tabIndex = computed(() => {
    const resize = this.#resize();
    return this.shSort() || (resize && resize.resizable()) ? '0' : null;
  });

  ariaKeyshortcuts = computed(() => {
    const parts: string[] = [];
    const resize = this.#resize();

    if (this.shSort()) {
      const action = 'table.sort';
      const shortcut = this.#keybindings.getShortcut(action);
      if (shortcut) {
        parts.push(this.#keybindings.getDisplayShortcut(action) || shortcut);
      }
    }

    if (resize && resize.resizable()) {
      const decAction = 'table.column-resize-decrease';
      const decShortcut = this.#keybindings.getShortcut(decAction);
      if (decShortcut) {
        parts.push(this.#keybindings.getDisplayShortcut(decAction) || decShortcut);
      }

      const incAction = 'table.column-resize-increase';
      const incShortcut = this.#keybindings.getShortcut(incAction);
      if (incShortcut) {
        parts.push(this.#keybindings.getDisplayShortcut(incAction) || incShortcut);
      }
    }

    return parts.length > 0 ? parts.join(', ') : null;
  });

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.shSort()) return;

    const target = event.target as HTMLElement;
    const host = this.#el.nativeElement;
    if (
      target !== host &&
      (target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button, input, select, textarea, a') !== null ||
        target.closest('[role="button"], [role="checkbox"], [role="menuitem"]') !== null)
    ) {
      return;
    }

    if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && !event.shiftKey) {
      const parentRow = host.parentElement;
      if (parentRow) {
        const headers = Array.from(parentRow.querySelectorAll<HTMLElement>('th')).filter(
          (el) => el.getAttribute('tabindex') === '0' || el.hasAttribute('shSort') || el.hasAttribute('shResize')
        );
        const currentIndex = headers.indexOf(host);
        if (currentIndex !== -1) {
          const nextIndex = event.key === 'ArrowRight' ? currentIndex + 1 : currentIndex - 1;
          if (nextIndex >= 0 && nextIndex < headers.length) {
            event.preventDefault();
            headers[nextIndex].focus();
            return;
          }
        }
      }
    }

    if (this.#keybindings.matches(event, 'table.sort')) {
      this.toggleSort(event);
    }
  }

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
      const target = event.target as HTMLElement;
      const host = this.#el.nativeElement;
      if (
        target !== host &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('button, input, select, textarea, a') !== null ||
          target.closest('[role="button"], [role="checkbox"], [role="menuitem"]') !== null)
      ) {
        return;
      }
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
    '[attr.role]': 'role()',
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
  #renderer = inject(Renderer2);
  #keybindings = inject(ShipA11yKeybindingsService);

  grid = input<boolean>(false);
  role = computed(() => (this.grid() ? 'grid' : 'table'));

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

  theadEffect = effect((onCleanup) => {
    const head = this.thead()?.nativeElement;

    if (head && typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        const height = head.clientHeight;
        this.stickyHeaderHeight.set(height);
      });
      observer.observe(head);
      onCleanup(() => observer.disconnect());
    }
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

  gridSetupEffect = effect(() => {
    const gridActive = this.grid();
    const dataVal = this.data();
    const colSignal = this.columns.signal();

    untracked(() => {
      const host = this.#el.nativeElement;
      const allCells = host.querySelectorAll('th, td');

      if (gridActive) {
        if (allCells.length === 0) return;

        let hasZero = false;
        allCells.forEach((cell: any) => {
          if (cell.getAttribute('tabindex') === '0') {
            hasZero = true;
          }
        });

        if (!hasZero) {
          this.#renderer.setAttribute(allCells[0], 'tabindex', '0');
        }

        allCells.forEach((cell: any) => {
          if (cell.getAttribute('tabindex') !== '0') {
            this.#renderer.setAttribute(cell, 'tabindex', '-1');
          }
          if (!cell.hasAttribute('role')) {
            this.#renderer.setAttribute(cell, 'role', cell.tagName === 'TD' ? 'gridcell' : 'columnheader');
          }
        });

        const allRows = host.querySelectorAll('tr');
        allRows.forEach((row: any) => {
          if (!row.hasAttribute('role')) {
            this.#renderer.setAttribute(row, 'role', 'row');
          }
        });
      } else {
        // Clean up
        allCells.forEach((cell: any) => {
          const isHeader = cell.tagName === 'TH';
          if (isHeader) {
            const isInteractiveHeader =
              cell.classList.contains('sortable') ||
              cell.querySelector('.sh-resizer') !== null ||
              cell.hasAttribute('aria-keyshortcuts');
            if (isInteractiveHeader) {
              this.#renderer.setAttribute(cell, 'tabindex', '0');
            } else {
              this.#renderer.removeAttribute(cell, 'tabindex');
            }
          } else {
            // Remove tabindex from td (data cells)
            this.#renderer.removeAttribute(cell, 'tabindex');
          }
        });
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

  @HostListener('focusin', ['$event'])
  onFocusIn(event: FocusEvent) {
    if (!this.grid()) return;

    const target = event.target as HTMLElement;
    if (!target) return;

    const cell =
      target.tagName === 'TH' || target.tagName === 'TD' ? target : (target.closest('th, td') as HTMLElement);
    if (cell) {
      // Set roles dynamically for cells and rows if not present
      if (!cell.hasAttribute('role')) {
        this.#renderer.setAttribute(cell, 'role', cell.tagName === 'TD' ? 'gridcell' : 'columnheader');
      }
      const parentRow = cell.parentElement;
      if (parentRow && !parentRow.hasAttribute('role')) {
        this.#renderer.setAttribute(parentRow, 'role', 'row');
      }

      // Set tabindex="0" on focused cell and tabindex="-1" on all other cells
      this.#renderer.setAttribute(cell, 'tabindex', '0');
      const allCells = this.#el.nativeElement.querySelectorAll('th, td');
      allCells.forEach((c: any) => {
        if (c !== cell) {
          this.#renderer.setAttribute(c, 'tabindex', '-1');
        }
      });
    }
  }

  @HostListener('keydown', ['$event'])
  onGridKeyDown(event: KeyboardEvent) {
    if (!this.grid()) return;

    if (event.key === 'Tab') {
      const target = event.target as HTMLElement;
      const cell =
        target.tagName === 'TH' || target.tagName === 'TD' ? target : (target.closest('th, td') as HTMLElement);
      if (!cell) return;

      const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusableChildren = Array.from(cell.querySelectorAll(focusableSelectors)) as HTMLElement[];

      const row = cell.parentElement as HTMLTableRowElement;
      if (!row || row.tagName !== 'TR') return;

      const cellsInRow = Array.from(row.querySelectorAll('th, td')) as HTMLElement[];
      const currentColIndex = cellsInRow.indexOf(cell);
      if (currentColIndex === -1) return;

      if (!event.shiftKey) {
        // Forward Tab
        const isLastChild =
          focusableChildren.length === 0 || target === focusableChildren[focusableChildren.length - 1];
        const isCellSelf = target === cell;

        if (isLastChild && !isCellSelf) {
          // Move to next cell in row
          if (currentColIndex < cellsInRow.length - 1) {
            event.preventDefault();
            this.#focusGridCell(cellsInRow[currentColIndex + 1]);
          }
        } else if (isCellSelf && focusableChildren.length === 0) {
          // Move to next cell in row
          if (currentColIndex < cellsInRow.length - 1) {
            event.preventDefault();
            this.#focusGridCell(cellsInRow[currentColIndex + 1]);
          }
        }
      } else {
        // Shift + Tab (Backward)
        const isFirstChild = focusableChildren.length > 0 && target === focusableChildren[0];
        const isCellSelf = target === cell;

        if (isFirstChild) {
          event.preventDefault();
          this.#focusGridCell(cell);
        } else if (isCellSelf) {
          if (currentColIndex > 0) {
            event.preventDefault();
            const prevCell = cellsInRow[currentColIndex - 1];
            const prevFocusableChildren = Array.from(prevCell.querySelectorAll(focusableSelectors)) as HTMLElement[];
            if (prevFocusableChildren.length > 0) {
              this.#focusGridCell(prevCell);
              prevFocusableChildren[prevFocusableChildren.length - 1].focus();
            } else {
              this.#focusGridCell(prevCell);
            }
          }
        }
      }
      return;
    }

    const isUp = this.#keybindings.matches(event, 'grid.focus-up');
    const isDown = this.#keybindings.matches(event, 'grid.focus-down');
    const isLeft = this.#keybindings.matches(event, 'grid.focus-left');
    const isRight = this.#keybindings.matches(event, 'grid.focus-right');
    const isFirst = this.#keybindings.matches(event, 'grid.focus-first');
    const isLast = this.#keybindings.matches(event, 'grid.focus-last');

    if (!isUp && !isDown && !isLeft && !isRight && !isFirst && !isLast) return;

    const target = event.target as HTMLElement;
    if (target.tagName !== 'TH' && target.tagName !== 'TD') {
      // Focus is inside a child control, let them operate normally
      return;
    }

    const row = target.parentElement as HTMLTableRowElement;
    if (!row || row.tagName !== 'TR') return;

    const allRows = Array.from(this.#el.nativeElement.querySelectorAll('tr')) as HTMLTableRowElement[];
    const currentRowIndex = allRows.indexOf(row);
    if (currentRowIndex === -1) return;

    const cellsInRow = Array.from(row.querySelectorAll('th, td')) as HTMLElement[];
    const currentColIndex = cellsInRow.indexOf(target);
    if (currentColIndex === -1) return;

    let targetRowIndex = currentRowIndex;
    let targetColIndex = currentColIndex;

    if (isUp) {
      targetRowIndex = currentRowIndex - 1;
    } else if (isDown) {
      targetRowIndex = currentRowIndex + 1;
    } else if (isLeft) {
      targetColIndex = currentColIndex - 1;
    } else if (isRight) {
      targetColIndex = currentColIndex + 1;
    } else if (isFirst) {
      targetColIndex = 0;
    } else if (isLast) {
      targetColIndex = cellsInRow.length - 1;
    }

    if (targetRowIndex !== currentRowIndex) {
      const targetRow = allRows[targetRowIndex];
      if (targetRow) {
        const targetCells = Array.from(targetRow.querySelectorAll('th, td')) as HTMLElement[];
        const targetCell = targetCells[Math.min(currentColIndex, targetCells.length - 1)];
        if (targetCell) {
          event.preventDefault();
          this.#focusGridCell(targetCell);
        }
      }
    } else if (targetColIndex !== currentColIndex) {
      const targetCell = cellsInRow[targetColIndex];
      if (targetCell) {
        event.preventDefault();
        this.#focusGridCell(targetCell);
      }
    }
  }

  #focusGridCell(cell: HTMLElement) {
    this.#renderer.setAttribute(cell, 'tabindex', '0');
    cell.focus();
    const allCells = this.#el.nativeElement.querySelectorAll('th, td');
    allCells.forEach((c: any) => {
      if (c !== cell) {
        this.#renderer.setAttribute(c, 'tabindex', '-1');
      }
    });
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

    const currentData = this.data();
    const sortedData = [...currentData].sort((a: any, b: any) => {
      const colConfig = this.content()
        ?.columns()
        ?.find((c) => c.id === column);

      if (colConfig?.sortPredicate) {
        const predicateResult = colConfig.sortPredicate(a, b);
        return isDescending ? -predicateResult : predicateResult;
      }

      const valueA = colConfig ? this.content()?.getValue(a, colConfig) : a[column];
      const valueB = colConfig ? this.content()?.getValue(b, colConfig) : b[column];

      const aNull = valueA === null || valueA === undefined;
      const bNull = valueB === null || valueB === undefined;

      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;

      let comparison = 0;

      if (colConfig?.type === 'date') {
        const dateA = new Date(valueA).getTime();
        const dateB = new Date(valueB).getTime();
        comparison = isNaN(dateA) || isNaN(dateB) ? 0 : dateA - dateB;
      } else if (colConfig?.type === 'number') {
        comparison = Number(valueA) - Number(valueB);
      } else if (colConfig?.type === 'boolean') {
        const boolA = valueA ? 1 : 0;
        const boolB = valueB ? 1 : 0;
        comparison = boolA - boolB;
      } else if (colConfig?.type === 'string' || colConfig?.type === 'badge') {
        comparison = valueA.toString().localeCompare(valueB.toString(), undefined, { sensitivity: 'base' });
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

    let changed = sortedData.length !== currentData.length;
    if (!changed) {
      for (let i = 0; i < sortedData.length; i++) {
        if (sortedData[i] !== currentData[i]) {
          changed = true;
          break;
        }
      }
    }

    if (changed) {
      this.dataChange.emit(sortedData);
    }
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
          <th
            role="columnheader"
            [id]="col.id"
            [attr.aria-label]="col.header"
            [shSort]="col.sortable ? col.id : undefined"
            shResize
            [resizable]="!!col.resizable"
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
              [attr.role]="col.rowHeader ? 'rowheader' : grid() ? 'gridcell' : 'cell'">
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
  grid = this.#table.grid;

  thead = viewChild<ElementRef<HTMLTableSectionElement>>('thead');
  tbody = viewChild<ElementRef<HTMLTableSectionElement>>('tbody');

  getValue(row: any, col: ShipTableColumn): any {
    if (!row) return '';
    const key = col.accessorKey || col.id;
    if (typeof key === 'string' && key.includes('.')) {
      return key.split('.').reduce((acc, part) => acc?.[part], row);
    }
    return row[key as any];
  }

  formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString();
  }
}
