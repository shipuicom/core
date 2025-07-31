import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sh-tabs',
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipTabsComponent {}
