import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicInputMask } from './examples/basic-input-mask/basic-input-mask';

@Component({
  selector: 'app-input-mask-overview',
  imports: [Previewer, PropertyViewer, BasicInputMask],
  templateUrl: './input-mask-overview.html',
  styleUrl: './input-mask-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InputMaskOverview {}
