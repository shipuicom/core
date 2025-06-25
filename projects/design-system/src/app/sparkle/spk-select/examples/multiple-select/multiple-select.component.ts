import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleSelectComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-multiple-select',
  standalone: true,
  imports: [FormsModule, SparkleSelectComponent, JsonPipe],
  templateUrl: './multiple-select.component.html',
  styleUrl: './multiple-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultipleSelectComponent {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
  ]);
  selected = signal<string[]>(['pizza,burger']);
}
