import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipColor, ShipIconSize } from '@ship-ui/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';

@Component({
  selector: 'app-sandbox-icon',
  imports: [FormsModule, ShipIcon, ShipButtonGroup, ShipRangeSlider],
  templateUrl: './sandbox-icon.html',
  styleUrl: './sandbox-icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxIcon {
  size = signal<ShipIconSize>('');
  sizeValue = signal<number>(10);
  colorClass = signal<ShipColor>('');
}
