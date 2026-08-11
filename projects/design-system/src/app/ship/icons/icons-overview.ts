import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicIcon } from './examples/basic-icon/basic-icon';

@Component({
  selector: 'app-icons-overview',
  imports: [Previewer, PropertyViewer, BasicIcon, ShipButton, ShipIcon],
  templateUrl: './icons-overview.html',
  styleUrl: './icons-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class IconsOverview {}
