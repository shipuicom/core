import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'spk-stepper',
  standalone: true,
  imports: [],
  template: `
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleStepperComponent {}
