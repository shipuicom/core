import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ShipProgressBarMode = 'determinate' | 'indeterminate';

@Component({
  selector: 'sh-progress-bar',
  imports: [],
  template: `
    <div class="progress-bar" [style.width.%]="value()"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipProgressBar {
  value = input<number | undefined>(undefined);
}
