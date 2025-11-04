import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChipComponent, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-base-chip',
  imports: [ShipIcon, ShipChipComponent],
  templateUrl: './base-chip.component.html',
  styleUrl: './base-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseChipComponent {}
