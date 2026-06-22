import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipSheetVariant } from '@ship-ui/core';

export type ShipProgressBarMode = 'determinate' | 'indeterminate';

@Component({
  selector: 'sh-progress-bar',
  styleUrl: './ship-progress-bar.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  template: `
    <div class="progress-bar" [style.width.%]="value()"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    'role': 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-valuenow]': 'value() !== undefined ? value() : null',
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
