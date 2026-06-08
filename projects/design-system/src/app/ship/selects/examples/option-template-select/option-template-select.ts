import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipSelect } from '@ship-ui/core/ship-select';

@Component({
  selector: 'app-option-template-select',
  standalone: true,
  imports: [FormsModule, ShipSelect],
  templateUrl: './option-template-select.html',
  styleUrl: './option-template-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionTemplateSelect {
  options = signal([
    { value: 'pizza', label: 'Pizza', emoji: '🍕' },
    { value: 'burger', label: 'Burger', emoji: '🍔' },
    { value: 'sushi', label: 'Sushi', emoji: '🍣' },
  ]);
  selected = signal('pizza');
}
