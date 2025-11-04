import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-raised-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './raised-chip.html',
  styleUrl: './raised-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedChip {}
