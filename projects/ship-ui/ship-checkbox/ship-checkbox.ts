import { ChangeDetectionStrategy, Component, effect, ElementRef, HostListener, inject, input, model, viewChild, ViewEncapsulation } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';
import { classMutationSignal, generateUniqueId } from '@ship-ui/core';
import { contentProjectionSignal } from '@ship-ui/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipSheetVariant } from '@ship-ui/core';

@Component({
  selector: 'sh-checkbox',
  styleUrl: './ship-checkbox.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  template: `
    <div class="box sh-sheet" [class]="currentClassList()">
      <sh-icon class="inherit default-indicator">check-bold</sh-icon>
      <sh-icon class="inherit indeterminate-indicator">minus-bold</sh-icon>
    </div>

    <div class="label">
      <ng-content />
    </div>

    @if (projectedInputs().length === 0 && !noInternalInput()) {
      <input
        #internalInput
        type="checkbox"
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
    '[attr.role]': 'noInternalInput() ? "checkbox" : null',
    '[attr.aria-checked]': 'noInternalInput() ? checked() : null',
    '[attr.tabindex]': 'noInternalInput() ? (disabled() ? "-1" : "0") : null',
  },
})
export class ShipCheckbox {
  #elementRef = inject(ElementRef);
  #keybindings = inject(ShipA11yKeybindingsService);

  // The internal input takes its accessible name from the host subtree
  // (projected label text; decorative icons are aria-hidden), the same way a
  // wrapping <label> would — otherwise screen readers announce a nameless
  // checkbox. Reuses the host's own id when the consumer set one.
  labelId = (() => {
    const host = this.#elementRef.nativeElement as HTMLElement;
    if (!host.id) host.id = `sh-checkbox-${generateUniqueId()}`;
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

  /** Two-way checked state of the checkbox. */
  checked = model<boolean>(false);
  /** Accessible name for label-less usage; projected text content is used otherwise. */
  label = input<string>('');
  currentClassList = classMutationSignal();
  /** Semantic color scale (`primary`, `accent`, `warn`, `error`, `success`). */
  color = input<ShipColor | null>(null);
  /** Visual variant of the checkbox sheet. */
  variant = input<ShipSheetVariant | null>(null);
  /** Render in a non-interactive read-only state. */
  readonly = input<boolean>(false);
  /** Disable interaction. */
  disabled = input<boolean>(false);
  /** Suppress the internal `<input>` and expose the host element itself as the ARIA checkbox. */
  noInternalInput = input<boolean>(false);

  onInternalInputChange(event: Event) {
    if (this.disabled()) return;

    const input = event.target as HTMLInputElement;
    this.checked.set(input.checked);
  }

  hostClasses = shipComponentClasses('checkbox', {
    color: this.color,
    variant: this.variant,
    readonly: this.readonly,
  });

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.#keybindings.matches(event, 'checkbox.toggle')) {
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
