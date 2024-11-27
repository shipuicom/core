import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'spk-stepper',
    imports: [],
    template: `
    <ng-content></ng-content>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SparkleStepperComponent {}
