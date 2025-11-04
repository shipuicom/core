import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-flat-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './flat-chip.html',
  styleUrl: './flat-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatChip {}
