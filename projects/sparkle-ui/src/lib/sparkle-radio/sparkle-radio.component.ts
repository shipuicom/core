import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject } from '@angular/core';

@Component({
  selector: 'spk-radio',
  standalone: true,
  imports: [],
  template: `
    <div class="radio"></div>

    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleRadioComponent {
  #selfRef = inject(ElementRef);

  @HostListener('click')
  onClick() {
    if (this.#selfRef.nativeElement.querySelector('input')) {
      this.#selfRef.nativeElement.querySelector('input').focus();
    }
  }
}
