import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipSelect } from 'ship-ui';

@Component({
  selector: 'app-inline-search-select',
  standalone: true,
  imports: [FormsModule, ShipSelect],
  templateUrl: './inline-search-select.html',
  styleUrl: './inline-search-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineSearchSelect {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'sushi', label: 'Sushi' },
    { value: 'pasta', label: 'Pasta' },
    { value: 'salad', label: 'Salad' },
    { value: 'sandwich', label: 'Sandwich' },
  ]);
  selected = signal('pizza');

  ngOnInit(): void {
    setTimeout(() => {
      this.selected.set('burger');
    }, 1000);
  }
}
