import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseChip } from './examples/base-chip/base-chip';
import { BasicChip } from './examples/basic-chip/basic-chip';
import { ChipSandbox } from './examples/chip-sandbox/chip-sandbox';
import { FlatChip } from './examples/flat-chip/flat-chip';
import { OutlinedChip } from './examples/outlined-chip/outlined-chip';
import { RaisedChip } from './examples/raised-chip/raised-chip';
import { SimpleChip } from './examples/simple-chip/simple-chip';

@Component({
  selector: 'app-chips',
  imports: [
    ShipTabs,
    ApiReference,
    Previewer,
    PropertyViewer,
    ChipSandbox,
    BasicChip,
    BaseChip,
    OutlinedChip,
    SimpleChip,
    FlatChip,
    RaisedChip,
  ],
  templateUrl: './chips.html',
  styleUrl: './chips.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Chips {
  activeTab = signal('overview');
  view = signal<'example' | 'code'>('example');

  example1 = `<sh-chip>
  <sh-icon>circle</sh-icon>
  Default chip
  <sh-icon suffix>circle</sh-icon>
</sh-chip>`;
}
