import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sh-chip',
  imports: [],
  template: '<div><ng-content /></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sh-sheet',
  },
})
export class ShipChip {}
