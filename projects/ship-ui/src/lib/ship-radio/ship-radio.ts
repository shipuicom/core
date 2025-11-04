import { ChangeDetectionStrategy, Component } from '@angular/core';
import { classMutationSignal } from '../utilities/class-mutation-signal';

@Component({
  selector: 'sh-radio',
  imports: [],
  template: `
    <div class="radio sh-sheet" [class]="currentClassList()"></div>

    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipRadio {
  currentClassList = classMutationSignal();
}
