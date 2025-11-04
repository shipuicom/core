import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-outlined-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './outlined-chip.html',
  styleUrl: './outlined-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedChip {}
