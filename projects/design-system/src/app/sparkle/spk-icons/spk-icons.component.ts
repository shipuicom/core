import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleButtonComponent } from '../../../../../sparkle-ui/src/public-api';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { SandboxIconComponent } from './examples/sandbox-icon/sandbox-icon.component';

@Component({
  selector: 'app-spk-icons',
  imports: [PreviewerComponent, PropertyViewerComponent, SandboxIconComponent, SparkleButtonComponent],
  templateUrl: './spk-icons.component.html',
  styleUrl: './spk-icons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkIconsComponent {
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
