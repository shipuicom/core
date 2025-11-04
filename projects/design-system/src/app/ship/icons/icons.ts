import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButton, ShipIcon } from 'ship-ui';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { SandboxIcon } from './examples/sandbox-icon/sandbox-icon';

@Component({
  selector: 'app-icons',
  imports: [Previewer, PropertyViewer, SandboxIcon, ShipButton, ShipIcon],
  templateUrl: './icons.html',
  styleUrl: './icons.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Icons {
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
