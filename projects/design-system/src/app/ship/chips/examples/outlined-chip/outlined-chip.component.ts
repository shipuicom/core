import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-outlined-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './outlined-chip.component.html',
  styleUrl: './outlined-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedChipComponent {}
