import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, model, viewChild, ViewEncapsulation } from '@angular/core';
import { classMutationSignal } from '@ship-ui/core';
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

  internalInput = viewChild<ElementRef<HTMLInputElement>>('internalInput');
  projectedInputs = contentProjectionSignal<HTMLInputElement>('input:not(.internal-input)', {
    childList: true,
    attributes: true,
  });

  checked = model<boolean>(false);
  currentClassList = classMutationSignal();
  color = input<ShipColor | null>(null);
  variant = input<ShipSheetVariant | null>(null);
  readonly = input<boolean>(false);
  disabled = input<boolean>(false);
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
