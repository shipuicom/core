import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipSelect } from 'ship-ui';

@Component({
  selector: 'app-multiple-select-as-text',
  standalone: true,
  imports: [FormsModule, ShipSelect, JsonPipe],
  templateUrl: './multiple-select-as-text.component.html',
  styleUrl: './multiple-select-as-text.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultipleSelectAsTextComponent {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);
  selected = signal<string[]>(['pizza,burger']);
}
