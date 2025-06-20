import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject } from '@angular/core';

@Component({
  selector: 'spk-form-field',
  imports: [],
  template: `
    <ng-content select="label"></ng-content>

    <div class="input-wrap">
      <div class="prefix">
        <ng-content select="[prefix]"></ng-content>
        <ng-content select="[textPrefix]"></ng-content>
      </div>

      <ng-content select="input"></ng-content>
      <ng-content select="textarea"></ng-content>

      <div class="suffix">
        <ng-content select="[textSuffix]"></ng-content>
        <ng-content select="[suffix]"></ng-content>
      </div>
    </div>

    <div class="helpers">
      <div class="error">
        <ng-content select="[error]"></ng-content>
      </div>

      <div class="hint">
        <ng-content select="[hint]"></ng-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleFormFieldComponent {
  #selfRef = inject(ElementRef);

  @HostListener('click')
  onClick() {
    if (this.#selfRef.nativeElement.querySelector('input')) {
      this.#selfRef.nativeElement.querySelector('input').focus();
    }

    if (this.#selfRef.nativeElement.querySelector('textarea')) {
      this.#selfRef.nativeElement.querySelector('textarea').focus();
    }
  }

  ngOnInit() {
    const supportFieldSizing = typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content');
    const text = this.#selfRef.nativeElement.querySelector('textarea');

    if (!supportFieldSizing && text !== null) {
      function resize() {
        text.style.height = 'auto';
        text.style.height = text.scrollHeight + 'px';
      }

      /* 0-timeout to get the already changed text */
      function delayedResize() {
        setTimeout(resize, 0);
      }

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
