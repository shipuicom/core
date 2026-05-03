import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroup, ShipColor, ShipIcon, ShipIconSize, ShipRangeSlider } from 'ship-ui';

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
