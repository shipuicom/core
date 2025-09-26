import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipBlueprintComponent, ShipToggleComponent } from 'ship-ui';

@Component({
  selector: 'app-blueprints',
  imports: [ShipBlueprintComponent, ShipToggleComponent],
  templateUrl: './blueprints.component.html',
  styleUrl: './blueprints.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BlueprintsComponent {
  showAsDots = signal(false);
}
