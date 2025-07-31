import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipSelectComponent } from '@ship-ui/core';

@Component({
  selector: 'app-disabled-select',
  standalone: true,
  imports: [FormsModule, ShipSelectComponent],
  templateUrl: './disabled-select.component.html',
  styleUrl: './disabled-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisabledSelectComponent {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);
  selected = signal('pizza');
}
