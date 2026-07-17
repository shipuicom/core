import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseCheckbox } from './examples/base-checkbox/base-checkbox';
import { BasicCheckbox } from './examples/basic-checkbox/basic-checkbox';
import { CheckboxSandbox } from './examples/checkbox-sandbox';
import { FlatCheckbox } from './examples/flat-checkbox/flat-checkbox';
import { OutlinedCheckbox } from './examples/outlined-checkbox/outlined-checkbox';
import { RaisedCheckbox } from './examples/raised-checkbox/raised-checkbox';
import { SimpleCheckbox } from './examples/simple-checkbox/simple-checkbox';

@Component({
  selector: 'app-checkboxes',
  imports: [
    ShipTabs,
    ApiReference,
    Previewer,
    PropertyViewer,
    BasicCheckbox,
    BaseCheckbox,
    SimpleCheckbox,
    OutlinedCheckbox,
    FlatCheckbox,
    RaisedCheckbox,
    CheckboxSandbox,
  ],
  templateUrl: './checkboxes.html',
  styleUrl: './checkboxes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Checkboxes {
  activeTab = signal('overview');
}
