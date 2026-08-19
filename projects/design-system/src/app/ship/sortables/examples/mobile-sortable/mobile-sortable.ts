import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createSortableManager, ShipSortable } from '@ship-ui/core/ship-sortable';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';

// The icon names below are bound dynamically, so register them for the font
// subset: 'shicon:coffee' 'shicon:buildings' 'shicon:package' 'shicon:fork-knife'
// 'shicon:barbell' 'shicon:shopping-cart' 'shicon:house'
const STOPS = [
  { icon: 'coffee', title: 'Morning coffee', subtitle: 'Brew & Co, 8:00' },
  { icon: 'buildings', title: 'Office check-in', subtitle: 'HQ, 9:00' },
  { icon: 'package', title: 'Pick up parcel', subtitle: 'Post office, 11:30' },
  { icon: 'fork-knife', title: 'Lunch with Alex', subtitle: 'Noodle bar, 12:30' },
  { icon: 'barbell', title: 'Gym session', subtitle: 'Iron Works, 17:00' },
  { icon: 'shopping-cart', title: 'Groceries', subtitle: 'Market, 18:15' },
  { icon: 'house', title: 'Home', subtitle: '19:00' },
];

@Component({
  selector: 'app-mobile-sortable',
  standalone: true,
  imports: [ShipList, ShipSortable, ShipIcon],
  templateUrl: './mobile-sortable.html',
  styleUrl: './mobile-sortable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileSortable {
  stops = signal(STOPS);
  manager = createSortableManager(this.stops);
}
