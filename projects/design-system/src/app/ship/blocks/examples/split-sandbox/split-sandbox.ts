import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBlockSplitVariant, ShipColor } from '@ship-ui/core';
import { ShipBlockSplit } from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-split-sandbox',
  imports: [ShipBlockSplit, ShipButton, ShipIcon],
  templateUrl: './split-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplitSandbox {
  variant = input<ShipBlockSplitVariant>('');
  color = input<ShipColor>('primary');
}
