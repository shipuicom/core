import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipSelect } from '@ship-ui/core/ship-select';

@Component({
  selector: 'app-multiple-select-ellipsis',
  standalone: true,
  imports: [FormsModule, ShipSelect, JsonPipe],
  templateUrl: './multiple-select-ellipsis.html',
  styleUrl: './multiple-select-ellipsis.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultipleSelectEllipsis {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
    { value: 'tacos', label: 'Tacos' },
    { value: 'ramen', label: 'Ramen' },
    { value: 'pasta', label: 'Pasta' },
    { value: 'salad', label: 'Salad' },
  ]);
  selected = signal<string[]>(['pizza', 'burger', 'sushi', 'tacos', 'ramen', 'pasta']);
}
