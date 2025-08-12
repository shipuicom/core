import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipSelectComponent } from 'ship-ui';

@Component({
  selector: 'app-option-template-select',
  standalone: true,
  imports: [FormsModule, ShipSelectComponent, JsonPipe],
  templateUrl: './option-template-select.component.html',
  styleUrl: './option-template-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionTemplateSelectComponent {
  options = signal([
    { value: 'pizza', label: 'Pizza', emoji: '🍕' },
    { value: 'burger', label: 'Burger', emoji: '🍔' },
    { value: 'sushi', label: 'Sushi', emoji: '🍣' },
  ]);
  selected = signal('pizza');
}
