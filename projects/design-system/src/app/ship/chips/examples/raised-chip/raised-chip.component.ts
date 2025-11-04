import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-raised-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './raised-chip.component.html',
  styleUrl: './raised-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedChipComponent {}
