import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipSelectComponent } from 'ship-ui';

@Component({
  selector: 'app-readonly-select',
  standalone: true,
  imports: [FormsModule, ShipSelectComponent],
  templateUrl: './readonly-select.component.html',
  styleUrl: './readonly-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadonlySelectComponent {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);
  selected = signal('pizza');
}
