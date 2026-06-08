import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-simple-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './simple-chip.html',
  styleUrl: './simple-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleChip {}
