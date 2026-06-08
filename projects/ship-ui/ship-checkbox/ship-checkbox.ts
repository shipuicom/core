import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, model, viewChild, ViewEncapsulation } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { classMutationSignal } from '@ship-ui/core';
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
  private readonly _elementRef = inject(ElementRef);

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

  protected onInternalInputChange(event: Event) {
    if (this.disabled()) return;

    const input = event.target as HTMLInputElement;
    this.checked.set(input.checked);
  }

  hostClasses = shipComponentClasses('checkbox', {
    color: this.color,
    variant: this.variant,
    readonly: this.readonly,
  });

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  protected onEnter(event: Event) {
    const inputEl = this.internalInput()?.nativeElement;
    if (inputEl && getComputedStyle(inputEl).display !== 'none') {
      inputEl.click();
    } else {
      this._elementRef.nativeElement.click();
    }
    event.preventDefault();
  }
}
