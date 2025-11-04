import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-base-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './base-chip.component.html',
  styleUrl: './base-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseChipComponent {}
