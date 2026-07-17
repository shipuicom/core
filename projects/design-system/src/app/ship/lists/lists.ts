import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseListExample } from './examples/base-list-example/base-list-example';
import { BasicList } from './examples/basic-list/basic-list';

@Component({
  selector: 'app-lists',
  imports: [ShipTabs, ApiReference, ReactiveFormsModule, Previewer, BaseListExample, BasicList, PropertyViewer],
  templateUrl: './lists.html',
  styleUrl: './lists.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Lists {
  activeTab = signal('overview');
  active = signal(false);
  checkbox1 = new FormControl(false);
  checkbox2 = new FormControl(false);
}
