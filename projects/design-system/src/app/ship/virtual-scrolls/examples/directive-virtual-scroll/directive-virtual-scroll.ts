import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipVirtualScrollDirective } from '@ship-ui/core/ship-virtual-scroll';

type Row = { id: number; label: string; detail: string | null };

@Component({
  selector: 'app-directive-virtual-scroll',
  standalone: true,
  imports: [ShipVirtualScrollDirective],
  templateUrl: './directive-virtual-scroll.html',
  styleUrl: './directive-virtual-scroll.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectiveVirtualScroll {
  // 50,000 rows with varying heights — every third row carries a detail line.
  rows = signal<Row[]>(
    Array.from({ length: 50_000 }, (_, i) => ({
      id: i,
      label: `Row ${i}`,
      detail: i % 3 === 0 ? 'Taller row with a second line of detail text.' : null,
    }))
  );
}
