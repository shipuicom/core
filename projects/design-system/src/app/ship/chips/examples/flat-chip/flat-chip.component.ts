import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-flat-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './flat-chip.component.html',
  styleUrl: './flat-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatChipComponent {}
