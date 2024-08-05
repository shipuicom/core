import { ChangeDetectionStrategy, Component, input } from '@angular/core';
type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;

type Range<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;

export type SparkleProgressBarMode = 'determinate' | 'indeterminate';
export type SparkleProgressBarValue = Range<0, 101>;

@Component({
  selector: 'spk-progress-bar',
  standalone: true,
  imports: [],
  template: `
    <div class="progress-bar" [style.width.%]="value()"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleProgressBarComponent {
  value = input<SparkleProgressBarValue | undefined>(undefined);
}
