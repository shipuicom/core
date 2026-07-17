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
  /** Progress percentage from `0` to `100`; `undefined` renders an indeterminate bar. */
  value = input<number | undefined>(undefined);
  /** Color theme of the progress bar (`ShipColor`). */
  color = input<ShipColor | null>(null);
  /** Visual sheet variant of the progress bar (`ShipSheetVariant`). */
  variant = input<ShipSheetVariant | null>(null);

  hostClasses = shipComponentClasses('progressBar', {
    color: this.color,
    variant: this.variant,
  });
}
