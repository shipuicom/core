import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SparkleProgressBarMode = 'determinate' | 'indeterminate';

@Component({
    selector: 'spk-progress-bar',
    imports: [],
    template: `
    <div class="progress-bar" [style.width.%]="value()"></div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SparkleProgressBarComponent {
  value = input<number | undefined>(undefined);
}
