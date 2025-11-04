import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { SandboxSpinner } from './examples/sandbox-spinner/sandbox-spinner';

@Component({
  selector: 'app-spinners',
  imports: [SandboxSpinner, PropertyViewer, Previewer],
  templateUrl: './spinners.html',
  styleUrl: './spinners.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpinnerComponent {}
