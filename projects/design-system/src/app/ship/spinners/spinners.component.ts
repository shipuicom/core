import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { SandboxSpinnerComponent } from './examples/sandbox-spinner/sandbox-spinner.component';

@Component({
  selector: 'app-spinners',
  imports: [SandboxSpinnerComponent, PropertyViewerComponent, PreviewerComponent],
  templateUrl: './spinners.component.html',
  styleUrl: './spinners.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpinnerComponent {}
