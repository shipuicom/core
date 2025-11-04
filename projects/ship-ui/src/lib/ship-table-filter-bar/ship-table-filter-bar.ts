import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sh-table-filter-bar',
  standalone: true,
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipTableFilterBar {}
