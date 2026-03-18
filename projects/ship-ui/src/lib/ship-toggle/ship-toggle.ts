import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { contentProjectionSignal } from '../utilities/content-projection-signal';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipColor, ShipSheetVariant } from '../utilities/ship-types';

@Component({
  selector: 'sh-toggle',
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
  },
})
export class ShipToggle {
  private readonly _elementRef = inject(ElementRef);

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

  @HostListener('keydown.enter', ['$event'])
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
