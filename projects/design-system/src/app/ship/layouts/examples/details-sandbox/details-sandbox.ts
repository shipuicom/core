import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipLayoutDetailsVariant } from '@ship-ui/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipLayoutDetail, ShipLayoutDetails } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-details-sandbox',
  imports: [ShipLayoutDetails, ShipLayoutDetail, ShipCard, ShipButton, ShipChip],
  templateUrl: './details-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailsSandbox {
  variant = input<ShipLayoutDetailsVariant>('');
}
