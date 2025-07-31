import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChipComponent, ShipIconComponent } from '@ship-ui/core';

@Component({
  selector: 'app-outlined-chip',
  imports: [ShipIconComponent, ShipChipComponent],
  templateUrl: './outlined-chip.component.html',
  styleUrl: './outlined-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedChipComponent {}
