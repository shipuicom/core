import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipSelect } from '@ship-ui/core/ship-select';

@Component({
  selector: 'app-base-select',
  standalone: true,
  imports: [FormsModule, ShipSelect, ShipIcon],
  templateUrl: './base-select.html',
  styleUrl: './base-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseSelect {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);
  selected = signal('pizza');

  hello(val: any) {
    console.log('updated', val);
  }
}
