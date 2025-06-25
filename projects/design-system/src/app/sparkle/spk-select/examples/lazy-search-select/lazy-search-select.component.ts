import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleSelectComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-lazy-search-select',
  standalone: true,
  imports: [FormsModule, SparkleSelectComponent],
  templateUrl: './lazy-search-select.component.html',
  styleUrl: './lazy-search-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LazySearchSelectComponent {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
    { value: 'pasta', label: 'Pasta' },
    { value: 'salad', label: 'Salad' },
    { value: 'sandwich', label: 'Sandwich' },
  ]);
  lazySearchOption = signal('pizza');
  loading = signal(false);

  constructor() {
    effect(() => {
      const q = this.lazySearchOption();
      this.loading.set(true);
      setTimeout(() => {
        this.options.set(
          [
            { value: 'pizza', label: 'Pizza' },
            { value: 'burger', label: 'Burger' },
            { value: 'sushi', label: 'Sushi' },
            { value: 'pasta', label: 'Pasta' },
            { value: 'salad', label: 'Salad' },
            { value: 'sandwich', label: 'Sandwich' },
          ].filter((opt) => opt.label.toLowerCase().includes(q.toLowerCase()))
        );
        this.loading.set(false);
      }, 500);
    });
  }

  // resource = resource({
  //   params: {
  //     search: this.search(),
  //   },
  //   stream: (params) => {
  //     const search = params.search ?? '';

  //     return of(this.options()).pipe(
  //       delay(500),
  //       map((res) => {
  //         return res.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()));
  //       })
  //     );
  //   },
  // });
}
