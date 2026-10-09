import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBlockCtaVariant, ShipColor } from '@ship-ui/core';
import { ShipBlockCta } from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-cta-sandbox',
  imports: [ShipBlockCta, ShipButton, ShipIcon],
  templateUrl: './cta-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaSandbox {
  variant = input<ShipBlockCtaVariant>('');
  color = input<ShipColor>('primary');
}
