import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseTable } from './examples/base-table/base-table';
import { FullFeaturedTable } from './examples/full-featured-table/full-featured-table';
import { MultiStickyTable } from './examples/multi-sticky-table/multi-sticky-table';
import { MultiTableHeader } from './examples/multi-table-header/multi-table-header';
import { ResizingTable } from './examples/resizing-table/resizing-table';
import { SortingTable } from './examples/sorting-table/sorting-table';
import { ToggleRowTable } from './examples/toggle-row-table/toggle-row-table';

@Component({
  selector: 'app-tables-markup',
  imports: [
    PropertyViewer,
    Previewer,
    ShipButtonGroup,
    FullFeaturedTable,
    BaseTable,
    ToggleRowTable,
    MultiStickyTable,
    ResizingTable,
    MultiTableHeader,
    SortingTable,
  ],
  templateUrl: './tables-markup.html',
  styleUrl: './tables-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TablesMarkup {
  type = signal<'type-a' | 'type-b'>('type-a');
}
