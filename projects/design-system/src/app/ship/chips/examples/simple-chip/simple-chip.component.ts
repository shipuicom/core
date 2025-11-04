import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-simple-chip',
  imports: [ShipIcon, ShipChip],
  templateUrl: './simple-chip.component.html',
  styleUrl: './simple-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleChipComponent {}
