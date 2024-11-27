import { ChangeDetectionStrategy, Component, computed, effect, input, model, output, signal } from '@angular/core';
import { SparkleProgressBarComponent } from '../sparkle-progress-bar/sparkle-progress-bar.component';

@Component({
  selector: 'spk-row',
  imports: [],
  template: `
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleRowComponent {}

@Component({
  selector: 'spk-column',
  imports: [],
  template: `
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleColumnComponent {}

@Component({
  selector: 'spk-table',
  imports: [SparkleProgressBarComponent],
  template: `
    <thead>
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
  },
})
export class SparkleTableComponent {
  tableColumns = input<string[]>([]);
  loading = input<boolean>(false);
  columnSizes = computed(() => {
    return this.tableColumns().reduce((acc, col, index) => {
      const last = index === this.tableColumns().length - 1;

      if (last) {
        return `${acc} max-content`;
      }

      return `${acc} 1fr`;
    }, '');
  });

  data = input<any>([]);
  dataChange = output<any>();

  #initialData: any | null = null;
  #initialDataSet = signal(false);

  sortByColumn = model<string | null>(null);

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
