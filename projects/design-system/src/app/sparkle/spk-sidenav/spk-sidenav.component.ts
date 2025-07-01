import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { SandboxSidenavComponent } from './examples/sandbox-sidenav/sandbox-sidenav.component';

@Component({
  selector: 'app-spk-sidenav',
  imports: [SandboxSidenavComponent, PreviewerComponent, PropertyViewerComponent],
  templateUrl: './spk-sidenav.component.html',
  styleUrl: './spk-sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkSidenavComponent {
  sidenavType = signal('overlay');
}
