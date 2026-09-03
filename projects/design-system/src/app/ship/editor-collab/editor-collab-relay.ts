import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { HighlightFile } from '../../previewer/highlight-file/highlight-file';

@Component({
  selector: 'app-editor-collab-relay',
  imports: [Highlight, HighlightFile],
  templateUrl: './editor-collab-relay.html',
  styleUrl: './editor-collab-relay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorCollabRelay {
  WS_TRANSPORT = `<sh-editor shCollab="ws://localhost:8787/my-doc" [presence]="{ name: 'Ada', color: '#e0533d' }" />`;
  RELAY_CMD = `bun scripts/collab-relay.ts`;
}
