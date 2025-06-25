import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleSelectComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-option-template-select',
  standalone: true,
  imports: [FormsModule, SparkleSelectComponent],
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
