import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject } from '@angular/core';

@Component({
  selector: 'sh-radio',
  imports: [],
  template: `
    <div class="radio"></div>

    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipRadioComponent {
  #selfRef = inject(ElementRef);

  @HostListener('click')
  onClick() {
    if (this.#selfRef.nativeElement.querySelector('input')) {
      this.#selfRef.nativeElement.querySelector('input').focus();
    }
  }
}
