import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sh-stepper',
  imports: [],
  template: `
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipStepperComponent {}
