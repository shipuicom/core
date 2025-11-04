import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChipComponent, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-raised-chip',
  imports: [ShipIcon, ShipChipComponent],
  templateUrl: './raised-chip.component.html',
  styleUrl: './raised-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedChipComponent {}
