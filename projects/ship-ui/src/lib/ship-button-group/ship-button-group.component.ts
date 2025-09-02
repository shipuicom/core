import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sh-button-group',
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipButtonGroupComponent {}
