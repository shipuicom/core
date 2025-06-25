import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleSelectComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-inline-search-select',
  standalone: true,
  imports: [FormsModule, SparkleSelectComponent],
  templateUrl: './inline-search-select.component.html',
  styleUrl: './inline-search-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineSearchSelectComponent {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
    { value: 'pasta', label: 'Pasta' },
    { value: 'salad', label: 'Salad' },
    { value: 'sandwich', label: 'Sandwich' },
  ]);
  selected = signal('pizza');
}
