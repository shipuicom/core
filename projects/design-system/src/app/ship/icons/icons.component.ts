import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonComponent, ShipIcon } from 'ship-ui';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { SandboxIconComponent } from './examples/sandbox-icon/sandbox-icon.component';

@Component({
  selector: 'app-icons',
  imports: [PreviewerComponent, PropertyViewerComponent, SandboxIconComponent, ShipButtonComponent, ShipIcon],
  templateUrl: './icons.component.html',
  styleUrl: './icons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class IconsComponent {
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
