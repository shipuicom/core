import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleSelectComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-disabled-select',
  standalone: true,
  imports: [FormsModule, SparkleSelectComponent],
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
