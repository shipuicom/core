// ---------------------------------------------------------------------------
// ShipSpreadsheet — the `checkbox` cell, drawn as a real `sh-checkbox`
// ---------------------------------------------------------------------------

import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';

/**
 * The built-in checkbox type's renderer: one `sh-checkbox` instance per
 * visible cell, so the box is the library's own (its stylesheet arrives
 * with the instance — nothing to restate in a host). The grid owns the
 * interaction: the cell is inert, a click, Enter or Space toggles through
 * the extension's `activate`, so the checkbox is read-only and has no
 * input of its own.
 */
@Component({
  selector: 'sh-sheet-checkbox-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipCheckbox],
  template: `<sh-checkbox class="primary raised small" [class.active]="checked()" [checked]="checked()" [readonly]="true" [noInternalInput]="true" [label]="checked() ? 'Checked' : 'Unchecked'" />`,
  styleUrl: './sheet-checkbox-cell.scss',
})
export class ShipSheetCheckboxCell {
  readonly value = input('');
  readonly checked = computed(() => this.value() === 'true');
}
