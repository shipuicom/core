import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChipComponent, ShipIconComponent } from 'ship-ui';

@Component({
  selector: 'app-simple-chip',
  imports: [ShipIconComponent, ShipChipComponent],
  templateUrl: './simple-chip.component.html',
  styleUrl: './simple-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleChipComponent {}
