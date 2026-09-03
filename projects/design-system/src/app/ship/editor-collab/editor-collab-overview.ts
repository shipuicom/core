import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { MinimalCollab } from './examples/minimal-collab/minimal-collab';

@Component({
  selector: 'app-editor-collab-overview',
  imports: [Previewer, Highlight, MinimalCollab],
  templateUrl: './editor-collab-overview.html',
  styleUrl: './editor-collab-overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorCollabOverview {
  ONE_LINER = `<!-- Same-origin windows share the document. Nothing else to wire. -->
<sh-editor shCollab="my-doc" [presence]="{ name: 'Ada', color: '#e0533d' }" />`;
}
