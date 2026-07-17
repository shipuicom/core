import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicToggle } from './examples/basic-toggle/basic-toggle';
import { BaseToggle } from './examples/base-toggle/base-toggle';
import { FlatToggle } from './examples/flat-toggle/flat-toggle';
import { OutlinedToggle } from './examples/outlined-toggle/outlined-toggle';
import { RaisedToggle } from './examples/raised-toggle/raised-toggle';
import { SimpleToggle } from './examples/simple-toggle/simple-toggle';
import { ToggleSandbox } from './examples/toggle-sandbox';

@Component({
  selector: 'app-toggles',
  imports: [
    ShipTabs,
    ApiReference,
    Previewer,
    PropertyViewer,
    BasicToggle,
    BaseToggle,
    SimpleToggle,
    OutlinedToggle,
    FlatToggle,
    RaisedToggle,
    ToggleSandbox,
  ],
  templateUrl: './toggles.html',
  styleUrl: './toggles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Toggles {
  activeTab = signal('overview');
}
