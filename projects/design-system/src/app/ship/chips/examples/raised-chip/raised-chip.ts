import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-raised-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './raised-chip.html',
  styleUrl: './raised-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedChip {}
