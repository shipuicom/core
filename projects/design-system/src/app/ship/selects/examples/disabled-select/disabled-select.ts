import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipSelect } from 'ship-ui';

@Component({
  selector: 'app-disabled-select',
  standalone: true,
  imports: [FormsModule, ShipSelect],
  templateUrl: './disabled-select.html',
  styleUrl: './disabled-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisabledSelect {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);
  selected = signal('pizza');
}
