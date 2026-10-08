import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBlockHeroVariant, ShipColor } from '@ship-ui/core';
import { ShipBlockHero } from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-hero-sandbox',
  imports: [ShipBlockHero, ShipButton, ShipChip, ShipIcon],
  templateUrl: './hero-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSandbox {
  variant = input<ShipBlockHeroVariant>('');
  color = input<ShipColor>('primary');
}
