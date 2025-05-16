import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SPARKLE_CONFIG } from '../utilities/sparkle-config';

@Component({
  selector: 'spk-card',
  imports: [],
  template: `
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'class()',
  },
})
export class SparkleCardComponent {
  #spkConfig = inject(SPARKLE_CONFIG, { optional: true });
  class = signal<string>(this.#spkConfig?.cardType ?? 'default');
}
