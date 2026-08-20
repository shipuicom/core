import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, model, output, ViewEncapsulation } from '@angular/core';
import { ShipPopover } from '@ship-ui/core/ship-popover';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipFormFieldVariant, ShipSize } from '@ship-ui/core';

@Component({
  selector: 'sh-form-field-popover',
  styleUrl: './ship-form-field.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipPopover],
  template: `
    <ng-content select="label"></ng-content>

    <sh-popover
      [(isOpen)]="isOpen"
      (closed)="close()"
      [asSheetOnMobile]="true"
      [options]="{
        closeOnButton: false,
        closeOnEsc: true,
      }">
      <div trigger class="input-wrap" [class.is-open]="isOpen()">
        <div class="prefix">
          <ng-content select="[prefix]"></ng-content>
          <ng-content select="[textPrefix]"></ng-content>
        </div>

        <div class="prefix-space"></div>

        <ng-content select="input"></ng-content>

        <ng-content select="textarea"></ng-content>

        <ng-content select="[textSuffix]"></ng-content>
        <div class="suffix-space"></div>
        <ng-content select="[suffix]"></ng-content>
      </div>
      <ng-content select="[popoverContent]"></ng-content>
    </sh-popover>

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
export class ShipFormFieldPopover {
  #selfRef = inject(ElementRef);

  /** Whether the popover is open. Two-way bindable. */
  isOpen = model<boolean>(false);
  /** Emits when the popover closes. */
  closed = output<void>();

  /** Color theme applied to the field. */
  color = input<ShipColor | null>(null);
  /** Visual variant of the form field. */
  variant = input<ShipFormFieldVariant | null>(null);
  /** Size of the form field. */
  size = input<ShipSize | null>(null);
  /** Renders the field in a read-only state. */
  readonly = input<boolean>(false);

  constructor() {
    // Same label/error/hint wiring as ShipFormField: associate the projected
    // <label> with the projected input so it has an accessible name, and
    // error/hint content via aria-describedby.
    afterNextRender(() => {
      const el = this.#selfRef.nativeElement;
      const inputEl = el.querySelector('input') || el.querySelector('textarea');
      const labelEl = el.querySelector('label');
      const errorEl = el.querySelector('[error]');
      const hintEl = el.querySelector('[hint]');

      if (!inputEl) return;

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
    });
  }

  hostClasses = shipComponentClasses('formField', {
    color: this.color,
    variant: this.variant,
    size: this.size,
    readonly: this.readonly,
  });

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.input-wrap')) {
      if (this.#selfRef.nativeElement.querySelector('input')) {
        this.#selfRef.nativeElement.querySelector('input').focus();
      }
  
      if (this.#selfRef.nativeElement.querySelector('textarea')) {
        this.#selfRef.nativeElement.querySelector('textarea').focus();
      }
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
