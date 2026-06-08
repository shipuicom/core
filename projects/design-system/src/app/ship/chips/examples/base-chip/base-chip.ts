import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-base-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './base-chip.html',
  styleUrl: './base-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseChip {}
