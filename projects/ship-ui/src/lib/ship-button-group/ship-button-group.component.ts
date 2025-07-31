import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sh-button-group',
  imports: [],
  template: `
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipButtonGroupComponent {}
