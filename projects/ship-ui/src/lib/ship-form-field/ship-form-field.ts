import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
} from '@angular/core';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipColor, ShipFormFieldVariant, ShipSize } from '../utilities/ship-types';

@Component({
  selector: 'sh-form-field',
  imports: [],
  template: `
    <ng-content select="label"></ng-content>

    <div class="input-wrap">
      <div class="prefix">
        <ng-content select="[boxPrefix]"></ng-content>
        <ng-content select="[prefix]"></ng-content>
        <ng-content select="[textPrefix]"></ng-content>
      </div>

      <ng-content select="input"></ng-content>
      <ng-content select="textarea"></ng-content>

      <div class="suffix">
        <ng-content select="[textSuffix]"></ng-content>
        <ng-content select="[suffix]"></ng-content>
        <ng-content select="[boxSuffix]"></ng-content>
      </div>
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
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ShipFormField {
  #selfRef = inject(ElementRef);

  color = input<ShipColor | null>(null);
  variant = input<ShipFormFieldVariant | null>(null);
  size = input<ShipSize | null>(null);
  readonly = input<boolean>(false);

  hostClasses = shipComponentClasses('formField', {
    color: this.color,
    variant: this.variant,
    size: this.size,
    readonly: this.readonly,
  });

  @HostListener('click')
  onClick() {
    if (this.#selfRef.nativeElement.querySelector('input')) {
      this.#selfRef.nativeElement.querySelector('input').focus();
    }

    if (this.#selfRef.nativeElement.querySelector('textarea')) {
      this.#selfRef.nativeElement.querySelector('textarea').focus();
    }
  }

  constructor() {
    afterNextRender(() => {
      const el = this.#selfRef.nativeElement;
      const inputEl = el.querySelector('input') || el.querySelector('textarea');
      const labelEl = el.querySelector('label');
      const errorEl = el.querySelector('[error]');
      const hintEl = el.querySelector('[hint]');

      if (inputEl) {
        if (!inputEl.id) {
          inputEl.id = `sh-input-${Math.random().toString(36).substring(2, 9)}`;
        }

        if (labelEl && !labelEl.getAttribute('for')) {
          labelEl.setAttribute('for', inputEl.id);
        }

        const describedBy: string[] = [];
        if (errorEl) {
          if (!errorEl.id) errorEl.id = `sh-error-${Math.random().toString(36).substring(2, 9)}`;
          describedBy.push(errorEl.id);
        }
        if (hintEl) {
          if (!hintEl.id) hintEl.id = `sh-hint-${Math.random().toString(36).substring(2, 9)}`;
          describedBy.push(hintEl.id);
        }

        if (describedBy.length > 0 && !inputEl.hasAttribute('aria-describedby')) {
          inputEl.setAttribute('aria-describedby', describedBy.join(' '));
        }
      }

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
    });
  }
}
