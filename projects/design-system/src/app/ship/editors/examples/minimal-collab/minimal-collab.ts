import { afterNextRender, Component, inject, viewChild } from '@angular/core';
import { ShipEditor } from '@ship-ui/core/ship-editor';
import {
  BroadcastChannelTransport,
  ShEditorRemoteCursors,
  ShipEditorCollab,
} from '@ship-ui/core/ship-editor-collab';

/**
 * Minimum viable collaboration: one editor, one transport, one overlay.
 * Every window running this component shares the same document. Swap the
 * transport for `new WebSocketTransport('ws://…/my-doc')` to collaborate
 * across machines.
 */
@Component({
  selector: 'minimal-collab-example',
  standalone: true,
  imports: [ShipEditor, ShEditorRemoteCursors],
  providers: [ShipEditorCollab],
  templateUrl: './minimal-collab.html',
  styleUrl: './minimal-collab.scss',
})
export class MinimalCollab {
  collab = inject(ShipEditorCollab);
  editor = viewChild<ShipEditor>('ed');

  constructor() {
    afterNextRender(() => {
      this.collab.attach(this.editor()!.engine, {
        transport: new BroadcastChannelTransport('minimal-collab-doc'),
        presence: { name: 'Peer', color: '#2f6fed' },
      });
    });
  }
}
