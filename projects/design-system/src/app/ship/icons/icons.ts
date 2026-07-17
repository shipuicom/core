import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicIcon } from './examples/basic-icon/basic-icon';
import { SandboxIcon } from './examples/sandbox-icon/sandbox-icon';

@Component({
  selector: 'app-icons',
  imports: [ShipTabs, ApiReference, Previewer, PropertyViewer, BasicIcon, SandboxIcon, ShipButton, ShipIcon],
  templateUrl: './icons.html',
  styleUrl: './icons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Icons {
  activeTab = signal('overview');
  icons = signal([
    'acorn',
    'circle',
    'x',
    'minus',
    'upload-simple',
    'magnifying-glass',
    'x-circle',
    'caret-left',
    'caret-right',
    'caret-down',
    'caret-up',
    'backspace',
    'calendar',
    'info',
    'check',
    'check-circle',
    'warning-octagon',
    'warning',
    'question',
    'plus',
  ]);
}
