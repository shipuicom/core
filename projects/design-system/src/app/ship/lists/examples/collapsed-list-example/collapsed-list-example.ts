import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';

@Component({
  selector: 'app-collapsed-list-example',
  standalone: true,
  imports: [ShipButton, ShipIcon, ShipList],
  templateUrl: './collapsed-list-example.html',
  styleUrls: ['./collapsed-list-example.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollapsedListExample {
  collapsed = signal(false);
  active = signal<string | null>('dashboard');
}
