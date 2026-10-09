import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBlockHeaderVariant } from '@ship-ui/core';
import { ShipBlockHeader } from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-header-sandbox',
  imports: [ShipBlockHeader, ShipButton, ShipIcon],
  templateUrl: './header-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderSandbox {
  variant = input<ShipBlockHeaderVariant>('');
}
