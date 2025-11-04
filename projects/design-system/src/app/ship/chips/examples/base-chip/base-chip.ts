import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-base-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './base-chip.html',
  styleUrl: './base-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseChip {}
