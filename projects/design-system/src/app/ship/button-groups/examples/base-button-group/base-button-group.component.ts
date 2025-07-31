import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipButtonGroupComponent, ShipIconComponent } from '@ship-ui/core';

@Component({
  selector: 'app-base-button-group',
  imports: [ShipButtonGroupComponent, ShipIconComponent],
  templateUrl: './base-button-group.component.html',
  styleUrl: './base-button-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseButtonGroupComponent {
  small = input<boolean>(false);
  activeIndex = signal<number | null>(null);

  items = signal(new Array(5).fill(0));

  updateActiveIndex(newIndex: number) {
    this.activeIndex.set(newIndex === this.activeIndex() ? null : newIndex);
  }
}
