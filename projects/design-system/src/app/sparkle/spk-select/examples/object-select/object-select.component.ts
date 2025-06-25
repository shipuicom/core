import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleSelectComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-object-select',
  standalone: true,
  imports: [FormsModule, SparkleSelectComponent, JsonPipe],
  templateUrl: './object-select.component.html',
  styleUrl: './object-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObjectSelectComponent {
  options = signal([
    { id: '1', name: 'Pizza' },
    { id: '2', name: 'Burger' },
    { id: '3', name: 'Sushi' },
  ]);

  selected = signal<string>('1');
  selectedObject = computed(() => {
    return this.options().find((opt) => opt.id === this.selected());
  });
}
