import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChipComponent, ShipIconComponent } from 'ship-ui';

@Component({
  selector: 'app-raised-chip',
  imports: [ShipIconComponent, ShipChipComponent],
  templateUrl: './raised-chip.component.html',
  styleUrl: './raised-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedChipComponent {}
