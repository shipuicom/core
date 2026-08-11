import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Previewer } from '../../previewer/previewer';
import { BaseButtonGroup } from './examples/base-button-group/base-button-group';

@Component({
  selector: 'app-button-groups-examples',
  imports: [Previewer, BaseButtonGroup, ShipToggle],
  templateUrl: './button-groups-examples.html',
  styleUrl: './button-groups-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonGroupsExamples {
  small = signal(false);
}
