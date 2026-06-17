import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { SandboxEditor } from './examples/sandbox-editor/sandbox-editor';

@Component({
  selector: 'app-editors',
  imports: [
    Previewer,
    PropertyViewer,
    SandboxEditor,
  ],
  templateUrl: './editors.html',
  styleUrl: './editors.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Editors {}
