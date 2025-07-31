import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { ShipIconComponent } from '../sparkle-icon/sparkle-icon.component';

@Component({
  selector: 'sh-checkbox',
  imports: [ShipIconComponent],
  template: `
    <div class="box">
      <sh-icon class="inherit default-indicator">check-bold</sh-icon>
      <sh-icon class="inherit indeterminate-indicator">minus-bold</sh-icon>
    </div>

    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipCheckboxComponent {
  #selfRef = inject(ElementRef);

  // @HostListener('click')
  // onClick() {
  //   if (this.#selfRef.nativeElement.querySelector('input')) {
  //     this.#selfRef.nativeElement.querySelector('input').focus();
  //   }
  // }
}
