import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroup, ShipColorPicker, ShipColorPickerInput, ShipIcon, ShipToggle } from 'ship-ui';

@Component({
  selector: 'app-base-color-picker',
  imports: [FormsModule, ShipColorPicker, ShipButtonGroup, ShipIcon, ShipToggle, ShipColorPickerInput],
  templateUrl: './base-color-picker.html',
  styleUrl: './base-color-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseColorPicker {
  renderingType = signal<'hsl' | 'rgb' | 'grid' | 'hue' | 'saturation' | 'alpha'>('hsl');
  aColor = signal<[number, number, number, number?]>([255, 255, 255]);
  currentColor = signal<{
    rgb: string;
    rgba: string;
    hex: string;
    hex8: string;
    hsl: string;
    hsla: string;
    hue: number;
    saturation: number;
    alpha: number;
  } | null>(null);
  showDarkColors = signal(false);
  direction = signal(false);
  selectedHue = signal(0);
  inputValue = signal('rgba(255, 0, 0, 0.5)');

  inputRenderType = signal<'hsl' | 'rgb' | 'hex'>('rgb');
  showAlpha = signal(true);
  computedRenderType = computed(() => {
    const inputRenderType = this.inputRenderType();
    const showAlpha = this.showAlpha();
    if (inputRenderType === 'hsl') {
      return showAlpha ? 'hsla' : 'hsl';
    }
    if (inputRenderType === 'rgb') {
      return showAlpha ? 'rgba' : 'rgb';
    }
    if (inputRenderType === 'hex') {
      return showAlpha ? 'hex8' : 'hex';
    }

    return 'hsl';
  });
}
