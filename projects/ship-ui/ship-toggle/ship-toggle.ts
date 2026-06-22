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
  private readonly _elementRef = inject(ElementRef);
  #keybindings = inject(ShipA11yKeybindingsService);

  internalInput = viewChild<ElementRef<HTMLInputElement>>('internalInput');
  projectedInputs = contentProjectionSignal<HTMLInputElement>('input:not(.internal-input)', {
    childList: true,
    attributes: true,
  });

  checked = model<boolean>(false);
  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);
  readonly = input<boolean>(false);
  disabled = input<boolean>(false);
  noInternalInput = input<boolean>(false);

  protected onInternalInputChange(event: Event) {
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
  protected onKeyDown(event: KeyboardEvent) {
    if (this.#keybindings.matches(event, 'toggle.toggle')) {
      const inputEl = this.internalInput()?.nativeElement;
      if (inputEl && getComputedStyle(inputEl).display !== 'none') {
        inputEl.click();
      } else {
        this._elementRef.nativeElement.click();
      }
      event.preventDefault();
    }
  }
}
