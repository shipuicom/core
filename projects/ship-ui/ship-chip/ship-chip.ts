import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { shipComponentClasses } from '@ship-ui/core';
import { ShipColor, ShipSheetVariant, ShipSize } from '@ship-ui/core';

@Component({
  selector: 'sh-chip',
  styleUrl: './ship-chip.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  template: '<div><ng-content /></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sh-sheet',
    '[class]': 'hostClasses()',
    '[class.no-bg]': 'noBg()',
    '[class.selected]': 'isSelected()',
    '[attr.role]': 'selectable() ? "button" : null',
    '[attr.tabindex]': 'selectable() ? 0 : null',
    '[attr.aria-pressed]': 'selectable() ? isSelected() : null',
    '(click)': 'selectable() ? toggle() : null',
    '(keydown.enter)': 'selectable() ? toggle($event) : null',
    '(keydown.space)': 'selectable() ? toggle($event) : null',
  },
})
export class ShipChip {
  /** Semantic color scale (`primary`, `accent`, `warn`, `error`, `success`). */
  color = input<ShipColor | null>(null);
  /** Visual variant of the chip sheet. */
  variant = input<ShipSheetVariant | null>(null);
  /** Size preset. */
  size = input<ShipSize | null>(null);

  /** Use sharp (non-rounded) corners. */
  sharp = input<boolean | undefined>(undefined);
  /** Enable the dynamic styling variant. */
  dynamic = input<boolean | undefined>(undefined);
  /** Render in a non-interactive read-only state. */
  readonly = input<boolean>(false);
  /** Render without a background fill. */
  noBg = input<boolean, boolean | string>(false, { transform: booleanAttribute });
  /** Highlights the chip with the variant's selected colours (`class="selected"` does the same). */
  selected = input<boolean, boolean | string>(false, { transform: booleanAttribute });
  /** Makes the chip a toggle (`role="button"`, `aria-pressed`): click, Enter and Space flip `selected`. */
  selectable = input<boolean, boolean | string>(false, { transform: booleanAttribute });
  /** Emits the new state when a selectable chip is toggled. */
  selectedChange = output<boolean>();

  /** The current state: follows the `selected` input and flips locally on toggle. */
  isSelected = linkedSignal(() => this.selected());

  /** Flips the selected state and emits `selectedChange`; only wired up when `selectable` is set. */
  toggle(event?: Event) {
    event?.preventDefault();
    const next = !this.isSelected();
    this.isSelected.set(next);
    this.selectedChange.emit(next);
  }

  hostClasses = shipComponentClasses('chip', {
    color: this.color,
    variant: this.variant,
    size: this.size,
    sharp: this.sharp,
    dynamic: this.dynamic,
    readonly: this.readonly,
  });
}
