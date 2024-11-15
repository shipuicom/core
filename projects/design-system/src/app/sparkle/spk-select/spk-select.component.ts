import { ChangeDetectionStrategy, Component, computed, model, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  SelectedOption,
  SparkleCheckboxComponent,
  SparkleDialogComponent,
  SparkleIconComponent,
  SparkleOptionComponent,
  SparkleSelectComponent,
} from '../../../../../sparkle-ui/src/public-api';

type Food = {
  value: string;
  label: string;
};

type FoodGroup = {
  label: string;
  foods: Food[];
};

@Component({
  selector: 'app-spk-select',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SparkleDialogComponent,
    SparkleSelectComponent,
    SparkleIconComponent,
    SparkleCheckboxComponent,
    SparkleOptionComponent,
  ],
  templateUrl: './spk-select.component.html',
  styleUrl: './spk-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkSelectComponent {
  inputCtrl = new FormControl<string | null>(null);
  inputCtrl2 = new FormControl<string>('');
  inputSearchCtrl = new FormControl<string>('');
  inputSearchCtrl2 = new FormControl<string>('pizza-1');
  inputSearchCtrl3 = new FormControl<string>('');
  inputSearchCtrlSignal = toSignal(this.inputSearchCtrl.valueChanges);
  inputSearchCtrl2Signal = toSignal(this.inputSearchCtrl2.valueChanges);
  inputSearchCtrl3Signal = toSignal(this.inputSearchCtrl3.valueChanges);
  search = model('');
  some = signal('');

  foodGroups = signal<FoodGroup[]>([
    {
      label: 'Meat',
      foods: [
        { value: 'steak-0', label: 'Steak' },
        { value: 'pizza-1', label: 'Pizza' },
      ],
    },
    {
      label: 'Vegetables',
      foods: [
        { value: 'tacos-2', label: 'Tacos' },
        { value: 'burger-3', label: 'Burger' },
      ],
    },
    {
      label: 'Fruits',
      foods: [
        { value: 'sushi-4', label: 'Sushi' },
        { value: 'pasta-5', label: 'Pasta' },
      ],
    },
    {
      label: 'Snacks',
      foods: [
        { value: 'salad-6', label: 'Salad' },
        { value: 'sandwich-7', label: 'Sandwich' },
      ],
    },
  ]);

  filteredFoodGroups = computed(() => {
    return this.inputSearchCtrl3Signal()
      ? this.foodGroups()
          .filter((x) => x.foods.some((y) => y.label.toLowerCase().includes(this.inputSearchCtrl3Signal()!)))
          .map((x) => ({
            ...x,
            foods: x.foods.filter((y) => y.label.toLowerCase().includes(this.inputSearchCtrl3Signal()!)),
          }))
      : this.foodGroups();
  });

  foods = signal<Food[]>([
    { value: 'steak-0', label: 'Steak' },
    { value: 'pizza-1', label: 'Pizza' },
    { value: 'tacos-2', label: 'Tacos' },
    { value: 'burger-3', label: 'Burger' },
    { value: 'sushi-4', label: 'Sushi' },
    { value: 'pasta-5', label: 'Pasta' },
    { value: 'salad-6', label: 'Salad' },
    { value: 'sandwich-7', label: 'Sandwich' },
    { value: 'soup-8', label: 'Soup' },
    { value: 'seafood-9', label: 'Seafood' },
    { value: 'chicken-10', label: 'Chicken' },
    { value: 'pancakes-11', label: 'Pancakes' },
    { value: 'waffles-12', label: 'Waffles' },
    { value: 'omelette-13', label: 'Omelette' },
    { value: 'curry-14', label: 'Curry' },
    { value: 'dumplings-15', label: 'Dumplings' },
    { value: 'noodles-16', label: 'Noodles' },
    { value: 'burrito-17', label: 'Burrito' },
    { value: 'quesadilla-18', label: 'Quesadilla' },
    { value: 'paella-19', label: 'Paella' },
    { value: 'risotto-20', label: 'Risotto' },
    { value: 'samosa-21', label: 'Samosa' },
    { value: 'springrolls-22', label: 'Spring Rolls' },
    { value: 'lasagna-23', label: 'Lasagna' },
    { value: 'shawarma-24', label: 'Shawarma' },
    { value: 'gyro-25', label: 'Gyro' },
    { value: 'falafel-26', label: 'Falafel' },
    { value: 'pizza-margherita-27', label: 'Pizza Margherita' },
    { value: 'fajitas-28', label: 'Fajitas' },
    { value: 'lobster-29', label: 'Lobster' },
    { value: 'goulash-30', label: 'Goulash' },
    { value: 'ravioli-31', label: 'Ravioli' },
    { value: 'doner-32', label: 'Doner' },
    { value: 'macncheese-33', label: 'Mac & Cheese' },
    { value: 'banhmi-34', label: 'Banh Mi' },
    { value: 'pho-35', label: 'Pho' },
    { value: 'ramen-36', label: 'Ramen' },
    { value: 'bibimbap-37', label: 'Bibimbap' },
    { value: 'bolognese-38', label: 'Bolognese' },
    { value: 'carbonara-39', label: 'Carbonara' },
    { value: 'calzone-40', label: 'Calzone' },
    { value: 'meatballs-41', label: 'Meatballs' },
    { value: 'gnocchi-42', label: 'Gnocchi' },
    { value: 'poutine-43', label: 'Poutine' },
    { value: 'cheesesteak-44', label: 'Cheesesteak' },
    { value: 'fishandchips-45', label: 'Fish & Chips' },
    { value: 'charcuterie-46', label: 'Charcuterie' },
    { value: 'tapas-47', label: 'Tapas' },
    { value: 'fondue-48', label: 'Fondue' },
    { value: 'pierogi-49', label: 'Pierogi' },
    { value: 'gazpacho-50', label: 'Gazpacho' },
  ]);

  filteredFoods = computed(() =>
    this.search() ? this.foods().filter((x) => x.label.toLowerCase().includes(this.search())) : this.foods()
  );

  localFilteredFoods = computed(() =>
    this.inputSearchCtrlSignal()
      ? this.foods().filter((x) => x.label.toLowerCase().includes(this.inputSearchCtrlSignal()!))
      : this.foods()
  );

  apiFilteredFoods = signal<Food[]>(this.foods());
  otherFilteredFoods = computed(() => {
    this.fakeApi(this.inputSearchCtrl2Signal() ?? '')
      .then((x) => this.apiFilteredFoods.set(x as Food[]))
      .catch((err) => console.error(err));
    return this.apiFilteredFoods();
  });

  ngOnInit() {
    const randomFood = this.foods()[Math.floor(Math.random() * this.foods().length)];

    setTimeout(() => {
      console.log('randomFood: ', randomFood);
      this.inputSearchCtrl.setValue(randomFood.value);
      this.inputSearchCtrl3.setValue(randomFood.value);
      this.inputCtrl2.setValue(randomFood.value);
    }, 500);
  }

  fakeApi(search: string) {
    return new Promise((resolve) =>
      setTimeout(() => {
        resolve(search ? this.foods().filter((x) => x.label.toLowerCase().includes(search)) : this.foods());
      }, 150)
    );
  }

  valueChange(val: string | null) {
    const option = this.foods().find((x) => x.value === val);
  }

  clicked(val: Food['value']) {
    console.log('clicked: ', val);
    this.search.set(val);
  }

  selectedChange(val: Food['value']) {
    console.log('selectedChange: ', val);
  }

  displayFn(foods: Food[]) {
    return (val: Food['value']) => {
      const food = foods.find((x) => x.value === val);

      if (!food) {
        return '';
      }
      return `${food.label} (${food.value})`;
    };
  }

  displayWith(option: SelectedOption) {
    return `${option.textContent}`;
  }
}
