import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createSortableManager, ShipSortable } from 'ship-ui';

const ITEMS = [
  { id: 1, text: 'Small item', size: 'small' },
  { id: 2, text: 'This is a much larger item that spans multiple lines to show off the fact that the sortable handles differently sized elements cleanly.', size: 'large' },
  { id: 3, text: 'Medium item with a bit more content.', size: 'medium' },
  { id: 4, text: 'Another small item', size: 'small' },
  { id: 5, text: 'Massive item. Huge block of text here to make it really tall. '.repeat(3), size: 'extra-large' },
];

@Component({
  selector: 'app-mixed-size-sortable',
  standalone: true,
  imports: [ShipSortable],
  templateUrl: './mixed-size-sortable.html',
  styleUrl: './mixed-size-sortable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MixedSizeSortable {
  items = signal(ITEMS);
  manager = createSortableManager(this.items);
}
