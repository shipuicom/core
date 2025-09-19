import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, model, output } from '@angular/core';
import { ShipPopoverComponent } from '../ship-popover/ship-popover.component';

@Component({
  selector: 'sh-form-field-popover',
  imports: [ShipPopoverComponent],
  template: `
    <ng-content select="label"></ng-content>

    <div class="input-wrap">
      <div class="prefix">
        <ng-content select="[prefix]"></ng-content>
        <ng-content select="[textPrefix]"></ng-content>
      </div>

      <div class="prefix-space"></div>

      <sh-popover
        [(isOpen)]="isOpen"
        (closed)="close()"
        [options]="{
          closeOnButton: false,
          closeOnEsc: true,
        }">
        <ng-content trigger select="input"></ng-content>

        <ng-content select="[popoverContent]"></ng-content>
      </sh-popover>

      <ng-content select="textarea"></ng-content>

      <ng-content select="[textSuffix]"></ng-content>
      <div class="suffix-space"></div>
      <ng-content select="[suffix]"></ng-content>
    </div>

    <div class="helpers">
      <div class="error-wrap">
        <ng-content select="[error]"></ng-content>
      </div>

      <div class="hint">
        <ng-content select="[hint]"></ng-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipFormFieldPopoverComponent {
  #selfRef = inject(ElementRef);

  isOpen = model<boolean>(false);
  closed = output<void>();

  @HostListener('click')
  onClick() {
    if (this.#selfRef.nativeElement.querySelector('input')) {
      this.#selfRef.nativeElement.querySelector('input').focus();
    }

    if (this.#selfRef.nativeElement.querySelector('textarea')) {
      this.#selfRef.nativeElement.querySelector('textarea').focus();
    }
  }

  close() {
    this.closed.emit();
  }

  ngOnInit() {
    const supportFieldSizing = typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content');
    const text = this.#selfRef.nativeElement.querySelector('textarea');

    if (!supportFieldSizing && text !== null) {
      const text = this.#selfRef.nativeElement.querySelector('textarea');

      function resize() {
        text.style.height = 'auto';
        text.style.height = text.scrollHeight + 'px';
      }

      /* 0-timeout to get the already changed text */
      function delayedResize() {
        setTimeout(resize, 0);
      }

      if (text) {
        text.addEventListener('change', resize);
        text.addEventListener('cut', delayedResize);
        text.addEventListener('paste', delayedResize);
        text.addEventListener('drop', delayedResize);
        text.addEventListener('keydown', delayedResize);

        text.focus();
        text.select();
        resize();
      }
    }
  }
}
