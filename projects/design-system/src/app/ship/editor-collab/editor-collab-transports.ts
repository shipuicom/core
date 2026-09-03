import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { HighlightFile } from '../../previewer/highlight-file/highlight-file';

@Component({
  selector: 'app-editor-collab-transports',
  imports: [Highlight, HighlightFile],
  templateUrl: './editor-collab-transports.html',
  styleUrl: './editor-collab-transports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorCollabTransports {
  WS_TRANSPORT = `<sh-editor shCollab="ws://localhost:8787/my-doc" [presence]="{ name: 'Ada', color: '#e0533d' }" />`;

  RELAY_CMD = `bun scripts/collab-relay.ts`;

  CUSTOM_TRANSPORT = `interface CollabTransport {
  send(message: CollabMessage): void;
  subscribe(cb: (m: CollabMessage) => void): () => void;
  readonly connected: Signal<boolean>;
  destroy?(): void;
}`;

  SWAP_TRANSPORT = `transport = new MyBrokerTransport('doc-42'); // yours to destroy

// <sh-editor [shCollab]="transport" />`;
}
