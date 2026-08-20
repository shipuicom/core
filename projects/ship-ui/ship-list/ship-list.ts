import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { ShipSelectionGroup } from '@ship-ui/core';

export type ShipListRole = 'list' | 'listbox' | 'none';

@Component({
  selector: 'sh-list',
  styleUrl: './ship-list.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': "listRole() === 'none' ? null : listRole()",
    '[attr.aria-multiselectable]': "listRole() === 'listbox' ? 'false' : null",
    '[attr.aria-orientation]': "listRole() === 'listbox' ? 'vertical' : null",
  },
})
export class ShipList extends ShipSelectionGroup<string> {
  /**
   * Semantic role of the list. The default `list` keeps projected content
   * untouched (today's static behavior). Set `listbox` to opt in to the
   * selection-group behavior: `[(value)]` two-way binding, click/keyboard
   * selection, roving focus, and `option`/`aria-selected` stamping on items
   * carrying a `value` attribute.
   */
  listRole = input<ShipListRole>('list');

  constructor() {
    super(':scope > [value], :scope > a, :scope > button, :scope > label, :scope > [action], :scope > [item]', 'active', {
      itemRole: 'option',
      activeAttribute: 'aria-selected',
    });
  }

  protected override selectionEnabled(): boolean {
    return this.listRole() === 'listbox';
  }
}
