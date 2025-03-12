import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SparkleColorPickerComponent } from '../../../../sparkle-ui/src/public-api';
import SpkButtonsComponent from '../sparkle/spk-buttons/spk-buttons.component';

interface Hsl {
  h: number;
  s: number;
  l: number;
}

@Component({
  selector: 'app-spk-theme-editor',
  imports: [FormsModule, SparkleColorPickerComponent, SpkButtonsComponent],
  templateUrl: './spk-theme-editor.component.html',
  styleUrl: './spk-theme-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style]': 'colorScale()',
  },
})
export default class SpkThemeEditorComponent {
  countLight = signal(8);
  countDark = signal(4);
  selectedHue = signal(0);
  rgbStartColor = signal<[number, number, number]>([59, 130, 246]);
  hslSignal = signal<string>('hsl(217, 91%, 60%)');

  colorScale = computed(() => {
    const countLight = this.countLight();
    const countDark = this.countDark();
    const hsl = this.hslSignal();

    const h = parseInt(hsl.substring(4, hsl.indexOf(',')));
    const s = parseInt(hsl.substring(hsl.indexOf(',') + 1, hsl.indexOf('%')));
    const lLight = parseInt(hsl.split(', ')[2].split('%')[0]);

    const colors: { [key: string]: string } = {};

    // Light shades (regular theme)
    for (let i = 1; i <= countLight; i++) {
      const light = 100 - ((100 - lLight) / countLight) * i;
      colors[`--primary-${i}0`] = `hsl(${h}, ${s}%, ${light}%)`;
    }

    // Dark shades (regular theme)
    const range = lLight; // Range from 0 to lLight
    const clampedRange = range * 0.9; // 90% of the range
    const start = lLight - clampedRange; // Start value
    for (let i = 1; i <= countDark; i++) {
      const dark = start + (clampedRange / countDark) * (countDark - i);
      colors[`--primary-${i + countLight}0`] = `hsl(${h}, ${s}%, ${dark}%)`;
    }

    // Light shades (dark theme) (Reversed)
    for (let i = 1; i <= countLight; i++) {
      const darkLight = Math.max(0, Math.min(100, (lLight / countLight) * i));
      colors[`--primary-${i}0-dark`] = `hsl(${h}, ${s}%, ${darkLight}%)`;
    }

    // Dark shades (dark theme) (Reversed)
    for (let i = 1; i <= countDark; i++) {
      const darkDark = Math.max(0, Math.min(100, 100 - ((100 - lLight) / countDark) * (countDark - i)));
      colors[`--primary-${i + countLight}0-dark`] = `hsl(${h}, ${s}%, ${darkDark}%)`;
    }

    return colors;
  });
}
