import { Component } from '@angular/core';
import { ShipEditor } from '@ship-ui/core/ship-editor';
import { ShEditorCollabDirective } from '@ship-ui/core/ship-editor-collab';

/**
 * Minimum viable collaboration: one attribute. Every window running this
 * component shares the same document. Use a `ws://…/my-doc` URL instead of a
 * channel name to collaborate across machines through a relay.
 */
@Component({
  selector: 'minimal-collab-example',
  standalone: true,
  imports: [ShipEditor, ShEditorCollabDirective],
  templateUrl: './minimal-collab.html',
  styleUrl: './minimal-collab.scss',
})
export class MinimalCollab {}
