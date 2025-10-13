import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sh-tabs',
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--tabs-id]': 'id',
  },
})
export class ShipTabsComponent {
  id = '--' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 12);
}
