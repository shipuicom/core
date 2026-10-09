import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipBlockBannerVariant, ShipColor } from '@ship-ui/core';
import { ShipBlockBanner } from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-banner-sandbox',
  imports: [ShipBlockBanner, ShipButton, ShipIcon],
  templateUrl: './banner-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerSandbox {
  variant = input<ShipBlockBannerVariant>('');
  color = input<ShipColor>('primary');

  open = signal(true);
}
