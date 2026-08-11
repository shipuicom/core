import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-sortables-service',
  imports: [ApiReference, Highlight, PropertyViewer],
  templateUrl: './sortables-service.html',
  styleUrl: './sortables-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SortablesService {
  codeInspect = `import { Component, inject } from '@angular/core';
import { ShipSortableService } from '@ship-ui/core/ship-sortable';

@Component({ /* ... */ })
export class BoardPage {
  #sortableService = inject(ShipSortableService);

  isDragging() {
    // Set while a sortable drag is in flight, cleared on drop/cancel
    return this.#sortableService.activeSource !== null;
  }

  dropTargetGroup() {
    // The sortable container currently hovered as a drop target
    return this.#sortableService.activeTarget?.sortableGroup();
  }
}`;
}
