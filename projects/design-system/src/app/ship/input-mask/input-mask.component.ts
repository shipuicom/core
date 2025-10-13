import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseInputMaskComponent } from './examples/base-input-mask/base-input-mask.component';

@Component({
  selector: 'app-input-mask',
  imports: [BaseInputMaskComponent, PropertyViewerComponent, PreviewerComponent],
  templateUrl: './input-mask.component.html',
  styleUrl: './input-mask.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InputMaskComponent {}
