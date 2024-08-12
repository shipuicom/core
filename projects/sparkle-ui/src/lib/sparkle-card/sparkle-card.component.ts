import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'spk-card',
  standalone: true,
  imports: [],
  template: `
    <div class="card-content">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleCardComponent {}
