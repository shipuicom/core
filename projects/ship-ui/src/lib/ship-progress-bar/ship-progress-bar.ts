import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipColor, ShipSheetVariant } from '../utilities/ship-types';

export type ShipProgressBarMode = 'determinate' | 'indeterminate';

@Component({
  selector: 'sh-progress-bar',
  imports: [],
  template: `
    <div class="progress-bar" [style.width.%]="value()"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipProgressBar {
  value = input<number | undefined>(undefined);
  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);

  hostClasses = shipComponentClasses('progressBar', {
    color: this.color,
    variant: this.variant,
  });
}
