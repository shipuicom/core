import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject } from '@angular/core';

@Component({
  selector: 'spk-form-field',
  standalone: true,
  imports: [],
  template: `
    <ng-content select="label"></ng-content>

    <div class="input-wrap">
      <div class="prefix">
        <ng-content select="[spkPrefix]"></ng-content>
        <ng-content select="[spkTextPrefix]"></ng-content>
      </div>

      <div class="prefix-spacer"></div>

      <ng-content select="input"></ng-content>
      <ng-content select="textarea"></ng-content>

      <ng-content select="[spkTextSuffix]"></ng-content>
      <div class="suffix-spacer"></div>
      <ng-content select="[spkSuffix]"></ng-content>
    </div>

    <div class="helpers">
      <div class="error">
        <ng-content select="[spkError]"></ng-content>
      </div>

      <div class="hint">
        <ng-content select="[spkHint]"></ng-content>
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
    const supportFieldSizing = CSS.supports('field-sizing', 'content');
    const text = this.#selfRef.nativeElement.querySelector('textarea');

    if (!supportFieldSizing && text !== null) {
      const text = this.#selfRef.nativeElement.querySelector('textarea');
      function resize() {
        text.style.height = 'auto';
        text.style.height = text.scrollHeight + 'px';
      }

      /* 0-timeout to get the already changed text */
      function delayedResize() {
        window.setTimeout(resize, 0);
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
