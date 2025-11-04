import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from 'ship-ui';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseButtonGroup } from './examples/base-button-group/base-button-group';

@Component({
  selector: 'app-button-groups',
  imports: [Previewer, PropertyViewer, BaseButtonGroup, ShipButtonGroup],
  templateUrl: './button-groups.html',
  styleUrl: './button-groups.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ButtonGroupComponent {
  small = signal(false);
  type = signal<'' | 'type-b'>('');
}
