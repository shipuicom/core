import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipChip } from '@ship-ui/core/ship-chip';

@Component({
  selector: 'app-basic-chip',
  standalone: true,
  imports: [ShipChip],
  templateUrl: './basic-chip.html',
  styleUrl: './basic-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicChip {}
