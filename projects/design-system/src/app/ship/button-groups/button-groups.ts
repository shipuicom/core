import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseButtonGroup } from './examples/base-button-group/base-button-group';
import { BasicButtonGroup } from './examples/basic-button-group/basic-button-group';

@Component({
  selector: 'app-button-groups',
  imports: [ShipTabs, ApiReference, Previewer, PropertyViewer, BasicButtonGroup, BaseButtonGroup, ShipToggle],
  templateUrl: './button-groups.html',
  styleUrl: './button-groups.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonGroupComponent {
  activeTab = signal('overview');
  small = signal(false);
}
