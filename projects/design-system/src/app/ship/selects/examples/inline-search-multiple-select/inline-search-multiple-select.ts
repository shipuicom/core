import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipSelect } from 'ship-ui';

@Component({
  selector: 'app-inline-search-multiple-select',
  standalone: true,
  imports: [FormsModule, ShipSelect, JsonPipe],
  templateUrl: './inline-search-multiple-select.html',
  styleUrl: './inline-search-multiple-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineSearchMultipleSelect {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
    { value: 'pasta', label: 'Pasta' },
    { value: 'salad', label: 'Salad' },
    { value: 'sandwich', label: 'Sandwich' },
  ]);
  selected = signal<string[]>(['pizza']);
}
