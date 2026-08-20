import { ChangeDetectionStrategy, Component, effect, ElementRef, HostListener, inject, input, model, viewChild, ViewEncapsulation } from '@angular/core';
import { classMutationSignal, generateUniqueId } from '@ship-ui/core';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';
import { contentProjectionSignal } from '@ship-ui/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipSheetVariant } from '@ship-ui/core';

@Component({
  selector: 'sh-radio',
  styleUrl: './ship-radio.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  template: `
    <div class="radio sh-sheet" [class]="currentClassList()"></div>

    <ng-content />

    @if (projectedInputs().length === 0 && !noInternalInput()) {
      <input
        #internalInput
        type="radio"
        class="internal-input"
        [attr.disabled]="disabled() ? '' : null"
        [attr.aria-label]="label() || null"
        [attr.aria-labelledby]="label() ? null : labelId"
        [checked]="checked()"
        (change)="onInternalInputChange($event)" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.role]': 'noInternalInput() ? "radio" : null',
    '[attr.aria-checked]': 'noInternalInput() ? checked() : null',
    '[attr.tabindex]': 'noInternalInput() ? (disabled() ? "-1" : "0") : null',
  },
})
export class ShipRadio {
  #elementRef = inject(ElementRef);
  #keybindings = inject(ShipA11yKeybindingsService);

  // The internal input takes its accessible name from the host subtree
  // (projected label text), the same way a wrapping <label> would — otherwise
  // screen readers announce a nameless radio. Reuses a consumer-set host id.
  labelId = (() => {
    const host = this.#elementRef.nativeElement as HTMLElement;
    if (!host.id) host.id = `sh-radio-${generateUniqueId()}`;
    return host.id;
  })();

  internalInput = viewChild<ElementRef<HTMLInputElement>>('internalInput');
  projectedInputs = contentProjectionSignal<HTMLInputElement>('input:not(.internal-input)', {
    childList: true,
    attributes: true,
  });

  // Projected inputs (ngModel/forms usage) need the same labelling as the
  // internal one — stamp aria-labelledby unless the consumer labelled them.
  projectedLabelEffect = effect(() => {
    for (const input of this.projectedInputs()) {
      if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby') && !input.labels?.length) {
        if (this.label()) input.setAttribute('aria-label', this.label());
        else input.setAttribute('aria-labelledby', this.labelId);
      }
    }
  });

  /** Two-way bound checked state of the radio. */
  checked = model<boolean>(false);
  /** Accessible name for label-less usage; projected text content is used otherwise. */
  label = input<string>('');
  currentClassList = classMutationSignal();
  /** Color theme of the radio (`ShipColor`). */
  color = input<ShipColor | null>(null);
  /** Visual sheet variant of the radio (`ShipSheetVariant`). */
  variant = input<ShipSheetVariant | null>(null);
  /** When `true`, the radio is displayed but cannot be changed by the user. */
  readonly = input<boolean>(false);
  /** When `true`, the radio is disabled and non-interactive. */
  disabled = input<boolean>(false);
  /** When `true`, suppresses the built-in `<input type="radio">` and drives ARIA roles on the host instead. */
  noInternalInput = input<boolean>(false);

  onInternalInputChange(event: Event) {
    if (this.disabled()) return;

    const input = event.target as HTMLInputElement;
    this.checked.set(input.checked);
  }

  hostClasses = shipComponentClasses('radio', {
    color: this.color,
    variant: this.variant,
    readonly: this.readonly,
  });

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.#keybindings.matches(event, 'radio.select')) {
      const inputEl = this.internalInput()?.nativeElement;
      if (inputEl && getComputedStyle(inputEl).display !== 'none') {
        inputEl.click();
      } else {
        this.#elementRef.nativeElement.click();
      }
      event.preventDefault();
    }
  }
}
