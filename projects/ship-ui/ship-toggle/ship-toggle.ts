import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, model, viewChild, ViewEncapsulation } from '@angular/core';
import { contentProjectionSignal } from '@ship-ui/core';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipSheetVariant } from '@ship-ui/core';

@Component({
  selector: 'sh-toggle',
  styleUrl: './ship-toggle.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  template: `
    <div class="box">
      <div class="knob"></div>
    </div>

    <ng-content />

    @if (projectedInputs().length === 0 && !noInternalInput()) {
      <input
        #internalInput
        type="checkbox"
        class="internal-input"
        [attr.disabled]="disabled() ? '' : null"
        [checked]="checked()"
        (change)="onInternalInputChange($event)" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.role]': 'noInternalInput() ? "switch" : null',
    '[attr.aria-checked]': 'noInternalInput() ? checked() : null',
    '[attr.tabindex]': 'noInternalInput() ? (disabled() ? "-1" : "0") : null',
  },
})
export class ShipToggle {
  #elementRef = inject(ElementRef);
  #keybindings = inject(ShipA11yKeybindingsService);

  internalInput = viewChild<ElementRef<HTMLInputElement>>('internalInput');
  projectedInputs = contentProjectionSignal<HTMLInputElement>('input:not(.internal-input)', {
    childList: true,
    attributes: true,
  });

  /** Two-way bound checked state of the toggle. */
  checked = model<boolean>(false);
  /** Color theme applied to the toggle. */
  color = input<ShipColor | null>(null);
  /** Sheet variant styling applied to the toggle. */
  variant = input<ShipSheetVariant | null>(null);
  /** When `true`, the toggle displays its state but cannot be changed by the user. */
  readonly = input<boolean>(false);
  /** When `true`, the toggle is disabled and non-interactive. */
  disabled = input<boolean>(false);
  /** When `true`, no internal `<input>` is rendered and the host acts as an ARIA `switch`. */
  noInternalInput = input<boolean>(false);

  onInternalInputChange(event: Event) {
    if (this.disabled()) return;

    const input = event.target as HTMLInputElement;
    this.checked.set(input.checked);
  }

  hostClasses = shipComponentClasses('toggle', {
    color: this.color,
    variant: this.variant,
    readonly: this.readonly,
  });

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.#keybindings.matches(event, 'toggle.toggle')) {
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
