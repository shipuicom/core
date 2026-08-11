import { Component, inject, input } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipDialogService } from '@ship-ui/core/ship-dialog';

@Component({
  selector: 'bottom-sheet-dialog',
  standalone: true,
  imports: [ShipButton],
  templateUrl: './bottom-sheet-dialog.html',
  styleUrl: './bottom-sheet-dialog.scss',
})
export class BottomSheetDialog {
  #dialog = inject(ShipDialogService);

  openSheet() {
    this.#dialog.open(SheetContent, {
      type: 'bottom-sheet',
      maxWidth: '640px',
    });
  }
}

@Component({
  selector: 'bottom-sheet-content',
  standalone: true,
  template: `
    <div header>
      <h4 title>Share this ship</h4>
      <p description>Drag the handle down — or flick — to dismiss, like a native sheet.</p>
    </div>
    <div content>
      <p>
        The sheet is a regular dialog (<code>type: 'bottom-sheet'</code>): same typed
        <code>open()</code>, same <code>data</code>/<code>closed</code> contract, backdrop and Escape included. With
        the software keyboard open it rides on top of it, so bottom-pinned content stays reachable.
      </p>
      <input placeholder="Focus me on mobile — the sheet rides the keyboard" style="width: 100%" />
    </div>
  `,
})
class SheetContent {}
