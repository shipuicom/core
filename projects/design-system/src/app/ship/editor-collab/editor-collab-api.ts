import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';

@Component({
  selector: 'app-editor-collab-api',
  imports: [Highlight],
  templateUrl: './editor-collab-api.html',
  styleUrl: './editor-collab-api.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorCollabApi {
  EXPORT_AS = `<sh-editor shCollab="my-doc" #c="shCollab" />
<p>{{ c.collab.peers().size }} peers · {{ c.collab.connected() ? 'online' : 'offline' }}</p>`;

  MANUAL = `@Component({ providers: [ShipEditorCollab], imports: [ShipEditor, ShEditorRemoteCursors] })
export class DocPage {
  collab = inject(ShipEditorCollab);
  editor = viewChild.required<ShipEditor>('editor');

  constructor() {
    afterNextRender(() => {
      this.collab.attach(this.editor().engine, { transport: new WebSocketTransport('ws://…/my-doc') });
    });
  }
}
// <sh-editor #editor><sh-editor-remote-cursors [collab]="collab" /></sh-editor>`;

  COLLAB_MESSAGE = `// Plain JSON.
type CollabMessage =
  | { type: 'op'; clientId: string; seq: number;
      seen: Record<string, number>;       // per-peer high-water marks
      op: EditorOp; presence?: CollabPresence }
  | { type: 'presence'; presence: CollabPresence }
  | { type: 'join'; clientId: string }    // request a snapshot
  | { type: 'snapshot'; toClientId: string; clientId: string;
      doc: ASTDocument; seen: Record<string, number> }
  | { type: 'leave'; clientId: string };`;
}
