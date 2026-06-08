import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-outlined-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './outlined-chip.html',
  styleUrl: './outlined-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedChip {}
