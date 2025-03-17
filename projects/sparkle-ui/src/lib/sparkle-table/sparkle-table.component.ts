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
import { SparkleProgressBarComponent } from '../sparkle-progress-bar/sparkle-progress-bar.component';
import { observeChildren } from '../utilities/observe-elements';

@Directive({
  selector: '[spkResize]',
  standalone: true,
})
export class SparkleResizeDirective {
  #el = inject(ElementRef) as ElementRef<HTMLTableCellElement>;
  #renderer = inject(Renderer2);
  #table = inject(SparkleTableComponent);

  resizable = input<boolean>(true);
  minWidth = input<number>(50);
  maxWidth = input<number | null>(null);

  #startX!: number;
  #startWidth!: number;
  #resizing = false;
  #animationFrameRequest: number | null = null; // Store request ID

  ngOnInit() {
    if (!this.#table) {
      console.error('spkTableResize directive must be used within a spk-table component.');
      return;
    }

    if (this.resizable()) {
      const resizer = this.#renderer.createElement('div');
      this.#renderer.addClass(resizer, 'spk-resizer');
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

    this.#renderer.setAttribute(this.#el.nativeElement, 'data-size', `${constrainedWidth}px`);
    this.#table.updateColumnSizes();
  }

  ngOnDestroy() {
    if (this.#animationFrameRequest !== null) {
      cancelAnimationFrame(this.#animationFrameRequest);
    }
  }
}

@Directive({
  selector: '[spkSort]',
  standalone: true,
  host: {
    '(mousedown)': 'toggleSort()',
  },
})
export class SparkleSortDirective {
  #table = inject(SparkleTableComponent);
  spkSort = input<string>();

  toggleSort() {
    const sortCol = this.spkSort();

    if (!sortCol) return;

    this.#table.toggleSort(sortCol);
  }
}

@Component({
  selector: 'spk-table',
  imports: [SparkleProgressBarComponent],
  template: `
    <thead #thead>
      <ng-content select="[table-header]" />

      @if (loading()) {
        <spk-progress-bar class="indeterminate primary" />
      }
    </thead>

    <tbody>
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
    '[style.grid-template-columns]': 'columnSizes()',
    '[class.resizing]': 'resizing()',
  },
})
export class SparkleTableComponent {
  loading = input<boolean>(false);
  data = input<any>([]);
  dataChange = output<any>();
  sortByColumn = model<string | null>(null);

  thead = viewChild<ElementRef<HTMLTableSectionElement>>('thead');
  columns = observeChildren<HTMLTableColElement>(this.thead, ['TH']);

  resizing = signal(false);
  sizeTrigger = signal(true);
  #initialData: any | null = null;
  #initialDataSet = signal(false);

  columnSizes = computed(() => {
    this.sizeTrigger();
    const colSignal = this.columns.signal();

    return colSignal.reduce((acc, col, index) => {
      const colEl = col;
      const last = index === colSignal.length - 1;

      if (colEl.dataset['size']) {
        return `${acc} ${colEl.dataset['size']}`;
      }

      if (last) {
        return `${acc} max-content`;
      }

      return `${acc} 1fr`;
    }, '');
  });

  updateColumnSizes() {
    this.sizeTrigger.set(!this.sizeTrigger());
  }

  e = effect(() => {
    const sortByColumn = this.sortByColumn();

    if (sortByColumn === null) {
      if (!this.#initialDataSet()) {
        this.#initialData = this.data();
        this.#initialDataSet.set(true);
      }

      return this.dataChange.emit(JSON.parse(JSON.stringify(this.#initialData)));
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
}
