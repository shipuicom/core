import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-lists-service',
  imports: [ApiReference, Highlight, PropertyViewer],
  templateUrl: './lists-service.html',
  styleUrl: './lists-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListsService {
  codeCloseActive = `import { Component, inject } from '@angular/core';
import { ShipListItemSwipeService } from '@ship-ui/core/ship-list-item-swipe';

@Component({ /* ... */ })
export class InboxPage {
  #swipeService = inject(ShipListItemSwipeService);

  // e.g. close the open swipe item before navigating away or opening a dialog
  closeOpenSwipeItem() {
    this.#swipeService.activeSwipeItem?.close();
  }

  hasOpenSwipeItem() {
    return this.#swipeService.activeSwipeItem !== null;
  }
}`;
}
