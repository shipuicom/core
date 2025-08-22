import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: '[shButton]',
  imports: [],
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sh-sheet-h',
  },
})
export class ShipButtonComponent {}
