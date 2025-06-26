import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleAlertComponent } from '../../../../../sparkle-ui/src/public-api';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { BaseColorPickerComponent } from './examples/base-color-picker/base-color-picker.component';

@Component({
  selector: 'app-spk-color-picker',
  imports: [SparkleAlertComponent, PreviewerComponent, BaseColorPickerComponent],
  templateUrl: './spk-color-picker.component.html',
  styleUrl: './spk-color-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkColorPickerComponent {}
