import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { FuzzDemo } from './examples/fuzz-demo/fuzz-demo';
import { WindowDemo } from './examples/window-demo/window-demo';

@Component({
  selector: 'app-editor-collab-fuzz',
  imports: [Previewer, FuzzDemo, WindowDemo],
  templateUrl: './editor-collab-fuzz.html',
  styleUrl: './editor-collab-fuzz.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorCollabFuzz {}
