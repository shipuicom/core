import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';

@Component({
  selector: 'app-select-list-example',
  standalone: true,
  imports: [ShipIcon, ShipList],
  templateUrl: './select-list-example.html',
  styleUrls: ['./select-list-example.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectListExample {
  environment = signal<string | null>('staging');
}
