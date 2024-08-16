import { ChangeDetectionStrategy, Component, computed, model, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SparkleIconComponent, SparkleSelectComponent } from '../../../../../sparkle-ui/src/public-api';

type Food = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-spk-select',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, SparkleSelectComponent, SparkleIconComponent],
  templateUrl: './spk-select.component.html',
  styleUrl: './spk-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkSelectComponent {
  inputCtrl = new FormControl<string | null>(null);
  inputSearchCtrl = new FormControl<string>('');
  inputSearchCtrlSignal = toSignal(this.inputSearchCtrl.valueChanges);
  search = model('');

  foods = signal<Food[]>([
    { value: 'steak-0', label: 'Steak' },
    { value: 'pizza-1', label: 'Pizza' },
    { value: 'tacos-2', label: 'Tacos' },
  ]);

  filteredFoods = computed(() =>
    this.search() ? this.foods().filter((x) => x.label.toLowerCase().includes(this.search())) : this.foods()
  );

  otherFilteredFoods = computed(() =>
    this.inputSearchCtrlSignal()
      ? this.foods().filter((x) => x.label.toLowerCase().includes(this.inputSearchCtrlSignal()!))
      : this.foods()
  );

  clicked(val: Food['value']) {
    console.log('clicked: ', val);
    this.search.set(val);
  }

  displayFn(val: Food['value']) {
    const food = this.foods().find((x) => x.value === val);

    if (!food) {
      return '';
    }
    return `${food.label} (${food.value})`;
  }
}
