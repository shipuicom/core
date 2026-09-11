import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { BaseColorPicker } from './examples/base-color-picker/base-color-picker';
import { LiveUpdatesColorPicker } from './examples/live-updates-color-picker/live-updates-color-picker';
import { SignalFormColorPicker } from './examples/signal-form-color-picker/signal-form-color-picker';

@Component({
  selector: 'app-color-pickers-examples',
  imports: [Previewer, BaseColorPicker, LiveUpdatesColorPicker, SignalFormColorPicker],
  templateUrl: './color-pickers-examples.html',
  styleUrl: './color-pickers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ColorPickersExamples {}
