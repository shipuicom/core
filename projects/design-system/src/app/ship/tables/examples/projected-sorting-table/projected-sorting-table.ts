import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ShipTableVariant } from '@ship-ui/core';
import { parseSortByColumn, ShipSort, ShipSortChange, ShipTable } from '@ship-ui/core/ship-table';

const TASKS = [
  { key: 'HAR-1', title: 'Board columns dialog', priority: 2, due: '2026-10-02' },
  { key: 'HAR-2', title: 'Swimlanes by priority', priority: 1, due: '2026-09-28' },
  { key: 'HAR-3', title: 'Keyboard card moves', priority: 3, due: '2026-10-10' },
  { key: 'HAR-4', title: 'WIP limits', priority: 1, due: '2026-09-25' },
];

type Task = (typeof TASKS)[number];

/**
 * Rows are projected with @for and there is no [data]: the table only tracks the active sort and
 * draws the indicator, the component orders its own rows from (sortChange).
 */
@Component({
  selector: 'projected-sorting-table',
  standalone: true,
  imports: [ShipTable, ShipSort],
  templateUrl: './projected-sorting-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectedSortingTable {
  variant = input<ShipTableVariant | null>(null);
  sort = signal<ShipSortChange>({ key: null, direction: null });
  /** The model value the table keeps; `sortByColumn` is `-key` for descending. */
  sortByColumn = computed(() => (this.sort().key ? `${this.sort().direction === 'desc' ? '-' : ''}${this.sort().key}` : null));

  rows = computed(() => {
    const { key, direction } = this.sort();
    if (!key) return TASKS;

    const sorted = [...TASKS].sort((a, b) => {
      const va = a[key as keyof Task];
      const vb = b[key as keyof Task];
      return va < vb ? -1 : va > vb ? 1 : 0;
    });

    return direction === 'desc' ? sorted.reverse() : sorted;
  });

  onSort(change: ShipSortChange) {
    this.sort.set(change);
  }

  /** Restores a persisted sort (the same shape the table emits). */
  restore(value: string | null) {
    this.sort.set(parseSortByColumn(value));
  }
}
