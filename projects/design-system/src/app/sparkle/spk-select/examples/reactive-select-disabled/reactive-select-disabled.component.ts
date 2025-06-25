import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SparkleSelectComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-reactive-select-disabled',
  standalone: true,
  imports: [ReactiveFormsModule, SparkleSelectComponent],
  templateUrl: './reactive-select-disabled.component.html',
  styleUrl: './reactive-select-disabled.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactiveSelectDisabledComponent {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);
  control = new FormControl({
    value: 'pizza',
    disabled: true,
  });
}
