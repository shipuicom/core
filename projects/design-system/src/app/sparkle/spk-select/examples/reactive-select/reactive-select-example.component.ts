import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SparkleSelectComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-reactive-select',
  standalone: true,
  imports: [ReactiveFormsModule, SparkleSelectComponent],
  templateUrl: './reactive-select-example.component.html',
  styleUrl: './reactive-select-example.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactiveSelectComponent {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);
  control = new FormControl('pizza');
}
