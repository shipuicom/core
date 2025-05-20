import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SparkleColorPickerComponent,
  SparkleMenuComponent,
  SparkleRadioComponent,
} from '../../../../sparkle-ui/src/public-api';
import SpkButtonsComponent from '../sparkle/spk-buttons/spk-buttons.component';

interface Hsl {
  h: number;
  s: number;
  l: number;
}

const DEFAULT_COLORS: { [key: string]: [number, number, number] } = {
  primary: [59, 130, 246],
  accent: [139, 92, 246],
  warn: [245, 158, 11],
  error: [239, 68, 68],
  success: [16, 185, 129],
  mono: [113, 113, 122],
};

const STARTING_COLOR = 'mono';

@Component({
  selector: 'app-spk-theme-editor',
  imports: [
    FormsModule,
    SparkleColorPickerComponent,
    SparkleMenuComponent,
    SparkleRadioComponent,
    SpkButtonsComponent,
    JsonPipe,
  ],
  templateUrl: './spk-theme-editor.component.html',
  styleUrl: './spk-theme-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style]': 'mixedScale()',
  },
})
export default class SpkThemeEditorComponent {
  countLight = signal(8);
  countDark = signal(4);
  selectedHue = signal(0);
  satHue = computed(() => {
    const hsl = this.hslSignal();
    return parseInt(hsl.substring(4, hsl.indexOf(',')));
  });
  currentSaturation = signal(100);
  inputName = signal<keyof typeof DEFAULT_COLORS>(STARTING_COLOR);
  rgbStartColor = signal<[number, number, number]>(DEFAULT_COLORS[STARTING_COLOR]);

  // rgbStartColor = signal<[number, number, number]>([59, 130, 246]); // Primary
  // rgbStartColor = signal<[number, number, number]>([139, 92, 246]); // Accent
  // rgbStartColor = signal<[number, number, number]>([245, 158, 11]); // Warn
  // rgbStartColor = signal<[number, number, number]>([239, 68, 68]); // Error
  // rgbStartColor = signal<[number, number, number]>([16, 185, 129]); // Success
  // rgbStartColor = signal<[number, number, number]>([113, 113, 122]); // Success
  hslSignal = signal<string>('hsl(217, 91%, 60%)');

  setInputName(name: keyof typeof DEFAULT_COLORS) {
    const colors = DEFAULT_COLORS[name];
    this.rgbStartColor.set(colors);
    this.inputName.set(name);
  }

  updateSaturation(saturation: number) {
    const hsl = this.hslSignal();
    const hue = parseInt(hsl.substring(4, hsl.indexOf(',')));
    const light = parseInt(hsl.split(', ')[2].split('%')[0]);
    this.currentSaturation.set(saturation);
    this.hslSignal.set(`hsl(${hue}, ${saturation}%, ${light}%)`);
  }

  updateHsl(hsl: string) {
    // const saturation = this.currentSaturation();
    const hue = parseInt(hsl.substring(4, hsl.indexOf(',')));
    const sat = parseInt(hsl.split(', ')[1].split('%')[0]);
    const light = parseInt(hsl.split(', ')[2].split('%')[0]);
    this.hslSignal.set(`hsl(${hue}, ${sat}%, ${light}%)`);
  }

  colorScale = computed(() => {
    const countLight = this.countLight();
    const countDark = this.countDark();
    const hsl = this.hslSignal();
    const inputName = this.inputName();

    const h = parseInt(hsl.substring(4, hsl.indexOf(',')));
    const s = parseInt(hsl.substring(hsl.indexOf(',') + 1, hsl.indexOf('%')));
    const lLight = parseInt(hsl.split(', ')[2].split('%')[0]);

    const colors: { [key: string]: string } = {};
    const range = lLight; // Range from 0 to lLight
    const clampedRange = range * 0.9; // 90% of the range
    const start = lLight - clampedRange; // Start value

    // Light shades (regular theme)
    for (let i = 1; i <= countLight; i++) {
      const light = 100 - ((100 - lLight) / countLight) * i;

      console.log('s', s);
      colors[`--${inputName}-${i}0`] = `hsl(${h.toFixed(2)}, ${s.toFixed(2)}%, ${light.toFixed(2)}%)`;
    }
    ('');
    // Dark shades (regular theme)
    for (let i = 1; i <= countDark; i++) {
      const dark = start + (clampedRange / countDark) * (countDark - i);
      colors[`--${inputName}-${i + countLight}0`] = `hsl(${h.toFixed(2)}, ${s.toFixed(2)}%, ${dark.toFixed(2)}%)`;
    }

    // Light shades (dark theme) (Reversed)
    for (let i = 1; i <= countLight; i++) {
      const darkLight = Math.max(0, Math.min(100, (lLight / countLight) * i));
      colors[`--${inputName}-${i}0-dark`] = `hsl(${h.toFixed(2)}, ${s.toFixed(2)}%, ${darkLight.toFixed(2)}%)`;
    }

    // Dark shades (dark theme) (Reversed)
    for (let i = 1; i <= countDark; i++) {
      const darkDark = Math.max(0, Math.min(100, 100 - ((100 - lLight) / countDark) * (countDark - i)));
      colors[`--${inputName}-${i + countLight}0-dark`] =
        `hsl(${h.toFixed(2)}, ${s.toFixed(2)}%, ${darkDark.toFixed(2)}%)`;
    }

    return colors;
  });

  mixedScale = computed(() => {
    const colorScale = this.colorScale();
    const inputName = this.inputName();
    const colors = new Array(12).fill(null).map((_, i) => {
      const _i = i + 1;
      return `light-dark(${colorScale[`--${inputName}-${_i}0`]}, ${colorScale[`--${inputName}-${_i}0-dark`]})`;
    });

    const newColorMap: { [key: string]: string } = {};

    colors.forEach((color, index) => {
      newColorMap[`--${inputName}-${index + 1}`] = color;
    });

    return newColorMap;
  });

  outputString = computed(() => {
    const mixedScale = this.mixedScale();

    return Object.entries(mixedScale).reduce((acc, [key, value]) => {
      return `${acc}\n  ${key}: ${value};`;
    }, '');
  });
}
