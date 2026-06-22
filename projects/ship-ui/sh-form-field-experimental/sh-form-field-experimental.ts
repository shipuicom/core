import { afterNextRender, ChangeDetectionStrategy, Component, effect, ElementRef, inject } from '@angular/core';
import { createFormInputSignal } from '@ship-ui/core';

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
  #selfRef = inject(ElementRef);
  firstInput = createFormInputSignal();

  hello = effect(() => {
    console.log('hello', this.firstInput());
  });

  constructor() {
    afterNextRender(() => {
      const el = this.#selfRef.nativeElement;
      const inputEl = el.querySelector('input') || el.querySelector('textarea');
      const labelEl = el.querySelector('label');

      if (inputEl) {
        if (!inputEl.id) {
          inputEl.id = `sh-input-${Math.random().toString(36).substring(2, 9)}`;
        }

        if (labelEl && !labelEl.getAttribute('for')) {
          labelEl.setAttribute('for', inputEl.id);
        }
      }
    });
  }

  myClick() {
    this.firstInput.update((x) => x + 'hello');
  }
}
