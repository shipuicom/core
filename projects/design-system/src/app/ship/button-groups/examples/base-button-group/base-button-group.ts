import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipButtonGroup, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-base-button-group',
  imports: [ShipButtonGroup, ShipIcon],
  templateUrl: './base-button-group.html',
  styleUrl: './base-button-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseButtonGroup {
  small = input<boolean>(false);
  type = input<'' | 'type-b'>('');
  activeIndex = signal<number | null>(null);

  items = signal(new Array(5).fill(0));

  updateActiveIndex(newIndex: number) {
    this.activeIndex.set(newIndex === this.activeIndex() ? null : newIndex);
  }
}
