import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { ConfigTable } from './examples/config-table/config-table';

@Component({
  selector: 'app-tables-config',
  imports: [PropertyViewer, Previewer, Highlight, ShipButtonGroup, ConfigTable],
  templateUrl: './tables-config.html',
  styleUrl: './tables-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TablesConfig {
  type = signal<'type-a' | 'type-b'>('type-a');

  configTableHtml = `<sh-table [data]="data()">
  <sh-table-content [columns]="columns" [data]="data()" />
</sh-table>`;

  configTableTs = `import { ShipTable, ShipTableColumn, ShipTableContent } from '@ship-ui/core/ship-table';

// 1. Define column configurations
columns: ShipTableColumn[] = [
  { id: 'id', header: 'ID', type: 'number' },
  { id: 'name', header: 'Name', type: 'string' },
  { id: 'joined', header: 'Joined Date', type: 'date' }
];

// 2. Supply row data signal
data = signal([
  { id: 1, name: 'Alice', joined: '2026-01-10T10:00:00' },
  { id: 2, name: 'Bob', joined: '2026-05-15T14:30:00' }
]);`;
}
