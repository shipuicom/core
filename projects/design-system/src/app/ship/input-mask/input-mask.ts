import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseInputMaskComponent } from './examples/base-input-mask/base-input-mask';

@Component({
  selector: 'app-input-mask',
  imports: [BaseInputMaskComponent, PropertyViewer, Previewer],
  templateUrl: './input-mask.html',
  styleUrl: './input-mask.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InputMask {}
