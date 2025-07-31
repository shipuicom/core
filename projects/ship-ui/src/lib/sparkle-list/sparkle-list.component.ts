import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sh-list',
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipListComponent {}
