import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { CollabDemo } from './examples/collab-demo/collab-demo';

@Component({
  selector: 'app-editor-collab-overview',
  imports: [Previewer, Highlight, CollabDemo],
  templateUrl: './editor-collab-overview.html',
  styleUrl: './editor-collab-overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorCollabOverview {
  ONE_LINER = `<!-- Same-origin windows share the document. Nothing else to wire. -->
<sh-editor shCollab="my-doc" [presence]="{ name: 'Ada', color: '#e0533d' }" />`;
}
