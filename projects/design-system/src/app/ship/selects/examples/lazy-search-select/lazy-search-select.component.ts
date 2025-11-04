import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { delay, map, of } from 'rxjs';
import { ShipSelect } from 'ship-ui';

const DEFAULT_OPTIONS = [
  { value: 'pizza', label: 'Pizza' },
  { value: 'burger', label: 'Burger' },
  { value: 'sushi', label: 'Sushi' },
  { value: 'pasta', label: 'Pasta' },
  { value: 'salad', label: 'Salad' },
  { value: 'sandwich', label: 'Sandwich' },
];
@Component({
  selector: 'app-lazy-search-select',
  standalone: true,
  imports: [FormsModule, ShipSelect],
  templateUrl: './lazy-search-select.component.html',
  styleUrl: './lazy-search-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LazySearchSelectComponent {
  lazySearchOption = signal('pizza');

  options = computed(() => this.resource.value() ?? DEFAULT_OPTIONS);
  resource = rxResource({
    params: () => ({
      query: this.lazySearchOption(),
    }),
    stream: ({ params }) => {
      const search = params.query.toLowerCase();

      return of(DEFAULT_OPTIONS).pipe(
        delay(200),
        map((res) => res.filter((opt) => opt.label.toLowerCase().includes(search)))
      );
    },
  });
}
