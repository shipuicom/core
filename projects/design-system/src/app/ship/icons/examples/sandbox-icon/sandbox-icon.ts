import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipColor, ShipIconSize } from '@ship-ui/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-sandbox-icon',
  imports: [ShipIcon],
  templateUrl: './sandbox-icon.html',
  styleUrl: './sandbox-icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxIcon {
  size = input<ShipIconSize>('');
  sizeValue = input(10);
  color = input<ShipColor>('');
}
