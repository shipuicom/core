import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipLayoutStatRingVariant } from '@ship-ui/core';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipLayoutStatRing } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-stat-ring-sandbox',
  imports: [ShipLayoutStatRing, ShipChip, ShipIcon],
  templateUrl: './stat-ring-sandbox.html',
  styleUrl: '../sandbox.scss',
  host: { class: 'stats' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatRingSandbox {
  variant = input<ShipLayoutStatRingVariant>('');
}
