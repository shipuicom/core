import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sh-button-group',
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--btng-id]': 'id',
  },
})
export class ShipButtonGroup {
  id = '--' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 12);
}
