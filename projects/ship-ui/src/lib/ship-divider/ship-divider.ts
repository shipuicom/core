import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sh-divider',
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDivider {}
