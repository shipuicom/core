import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChipComponent, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-outlined-chip',
  imports: [ShipIcon, ShipChipComponent],
  templateUrl: './outlined-chip.component.html',
  styleUrl: './outlined-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedChipComponent {}
