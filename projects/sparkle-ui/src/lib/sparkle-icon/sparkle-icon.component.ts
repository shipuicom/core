import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'spk-icon',
  standalone: true,
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleIconComponent {}
