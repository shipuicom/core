import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicKeybindingsComponent } from './examples/basic-keybindings/basic-keybindings';

@Component({
  selector: 'app-a11y-keybindings',
  imports: [ShipTabs, ApiReference, BasicKeybindingsComponent, PropertyViewer, Previewer],
  templateUrl: './a11y-keybindings.html',
  styleUrl: './a11y-keybindings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class A11yKeybindingsComponent {
  activeTab = signal('overview');
}
