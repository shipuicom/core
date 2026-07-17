import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicSpinner } from './examples/basic-spinner/basic-spinner';
import { SandboxSpinner } from './examples/sandbox-spinner/sandbox-spinner';

@Component({
  selector: 'app-spinners',
  imports: [ShipTabs, ApiReference, BasicSpinner, SandboxSpinner, PropertyViewer, Previewer],
  templateUrl: './spinners.html',
  styleUrl: './spinners.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpinnerComponent {
  activeTab = signal('overview');
}
