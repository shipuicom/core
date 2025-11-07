import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sh-chip',
  imports: [],
  standalone: true,
  template: '<div><ng-content /></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sh-sheet',
  },
})
export class ShipChip {}
