import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipIcon, ShipSelect, ShipTooltip } from 'ship-ui';

@Component({
  selector: 'app-multiple-select',
  standalone: true,
  imports: [FormsModule, ShipSelect, JsonPipe, ShipIcon, ShipTooltip],
  templateUrl: './multiple-select.html',
  styleUrl: './multiple-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultipleSelect {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);
  selected = signal<string[]>(['pizza,burger']);
}
