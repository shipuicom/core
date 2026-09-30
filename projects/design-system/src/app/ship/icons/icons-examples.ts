import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipColor, ShipIconSize } from '@ship-ui/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';
import { Previewer } from '../../previewer/previewer';
import { SandboxIcon } from './examples/sandbox-icon/sandbox-icon';

@Component({
  selector: 'app-icons-examples',
  imports: [FormsModule, Previewer, ShipButtonGroup, ShipRangeSlider, SandboxIcon],
  templateUrl: './icons-examples.html',
  styleUrl: './icons-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class IconsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  size = signal<ShipIconSize>('');
  sizeValue = signal(10);
  color = signal<ShipColor>('');
}
