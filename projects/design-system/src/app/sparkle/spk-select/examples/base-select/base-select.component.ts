import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleSelectComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-base-select',
  standalone: true,
  imports: [FormsModule, SparkleSelectComponent],
  templateUrl: './base-select.component.html',
  styleUrl: './base-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseSelectComponent {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);
  selected = signal('pizza');
}
