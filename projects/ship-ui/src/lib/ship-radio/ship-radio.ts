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
import { classMutationSignal } from '../utilities/class-mutation-signal';
import { contentProjectionSignal } from '../utilities/content-projection-signal';
import { shipComponentClasses } from '../utilities/ship-component';
import { ShipColor, ShipSheetVariant } from '../utilities/ship-types';

@Component({
  selector: 'sh-radio',
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

  hostClasses = shipComponentClasses('radio', {
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
