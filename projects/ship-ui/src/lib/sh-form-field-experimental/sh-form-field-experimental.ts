import { ChangeDetectionStrategy, Component, effect } from '@angular/core';
import { createFormInputSignal } from '../utilities/create-form-input-signal';

@Component({
  selector: 'sh-form-field-experimental',
  imports: [],
  template: `
    <ng-content></ng-content>

    <button (click)="myClick()">hello</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipFormFieldExperimental {
  firstInput = createFormInputSignal();

  hello = effect(() => {
    console.log('hello', this.firstInput());
  });

  myClick() {
    this.firstInput.update((x) => x + 'hello');
  }
}
