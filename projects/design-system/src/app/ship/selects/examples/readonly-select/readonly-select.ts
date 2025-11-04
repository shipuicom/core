import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipSelect } from 'ship-ui';

@Component({
  selector: 'app-readonly-select',
  standalone: true,
  imports: [FormsModule, ShipSelect],
  templateUrl: './readonly-select.html',
  styleUrl: './readonly-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadonlySelect {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);
  selected = signal('pizza');
}
