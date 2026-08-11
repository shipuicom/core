import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipBlueprint, TEST_NODES } from '@ship-ui/core/ship-blueprint';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-blueprints-overview',
  imports: [ShipBlueprint, Highlight, PropertyViewer],
  templateUrl: './blueprints-overview.html',
  styleUrl: './blueprints-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BlueprintsOverview {
  basicCode = `<sh-blueprint [autoLayout]="true" [(nodes)]="nodes" />`;

  nodes = signal(TEST_NODES);
}
