import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { SandboxSidenavComponent } from './examples/sandbox-sidenav/sandbox-sidenav.component';

@Component({
  selector: 'app-sidenavs',
  imports: [SandboxSidenavComponent, PreviewerComponent, PropertyViewerComponent],
  templateUrl: './sidenavs.component.html',
  styleUrl: './sidenavs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SidenavsComponent {
  sidenavType = signal('overlay');
}
