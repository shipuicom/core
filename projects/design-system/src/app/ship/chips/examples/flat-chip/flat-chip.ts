import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-flat-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './flat-chip.html',
  styleUrl: './flat-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatChip {}
