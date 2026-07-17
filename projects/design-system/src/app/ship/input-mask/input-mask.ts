import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseInputMaskComponent } from './examples/base-input-mask/base-input-mask';
import { BasicInputMask } from './examples/basic-input-mask/basic-input-mask';

@Component({
  selector: 'app-input-mask',
  imports: [ShipTabs, ApiReference, BasicInputMask, BaseInputMaskComponent, PropertyViewer, Previewer],
  templateUrl: './input-mask.html',
  styleUrl: './input-mask.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InputMask {
  activeTab = signal('overview');
}
