import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChipComponent, ShipIconComponent } from '@ship-ui/core';

@Component({
  selector: 'app-base-chip',
  imports: [ShipIconComponent, ShipChipComponent],
  templateUrl: './base-chip.component.html',
  styleUrl: './base-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseChipComponent {}
