import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-base-button-group',
  imports: [ShipButtonGroup, ShipIcon],
  templateUrl: './base-button-group.html',
  styleUrl: './base-button-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseButtonGroup {
  small = input<boolean>(false);
  activeIndex = signal<number | null>(0);
  selected = signal<string | null>('one');

  items = signal(new Array(5).fill(0));

  updateActiveIndex(newIndex: number) {
    this.activeIndex.set(newIndex === this.activeIndex() ? null : newIndex);
  }
}
