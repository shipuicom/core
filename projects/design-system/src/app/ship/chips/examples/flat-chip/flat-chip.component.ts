import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChipComponent, ShipIconComponent } from 'ship-ui';

@Component({
  selector: 'app-flat-chip',
  imports: [ShipIconComponent, ShipChipComponent],
  templateUrl: './flat-chip.component.html',
  styleUrl: './flat-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatChipComponent {}
