import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { MemoryTransport } from './examples/memory-transport/memory-transport';

@Component({
  selector: 'app-editor-collab-transports',
  imports: [Highlight, Previewer, MemoryTransport],
  templateUrl: './editor-collab-transports.html',
  styleUrl: './editor-collab-transports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorCollabTransports {
  CUSTOM_TRANSPORT = `interface CollabTransport {
  send(message: CollabMessage): void;
  subscribe(cb: (m: CollabMessage) => void): () => void;
  readonly connected: Signal<boolean>;
  destroy?(): void;
}`;

  SWAP_TRANSPORT = `transport = new MyBrokerTransport('doc-42'); // yours to destroy

// <sh-editor [shCollab]="transport" />`;
}
