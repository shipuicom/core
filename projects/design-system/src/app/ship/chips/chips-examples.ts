import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipColorPicker } from '@ship-ui/core/ship-color-picker';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { Previewer } from '../../previewer/previewer';
import { BaseChip } from './examples/base-chip/base-chip';
import { ChipSandbox } from './examples/chip-sandbox/chip-sandbox';
import { FlatChip } from './examples/flat-chip/flat-chip';
import { OutlinedChip } from './examples/outlined-chip/outlined-chip';
import { RaisedChip } from './examples/raised-chip/raised-chip';
import { SelectedChip } from './examples/selected-chip/selected-chip';
import { SimpleChip } from './examples/simple-chip/simple-chip';

@Component({
  selector: 'app-chips-examples',
  imports: [
    Previewer,
    ShipButtonGroup,
    ShipToggle,
    ShipColorPicker,
    ChipSandbox,
    BaseChip,
    SimpleChip,
    OutlinedChip,
    FlatChip,
    RaisedChip,
    SelectedChip,
  ],
  templateUrl: './chips-examples.html',
  styleUrl: './chips-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChipsExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  small = signal<boolean>(false);
  sharp = signal<boolean>(false);
  dynamic = signal<boolean>(false);
  noBg = signal<boolean>(false);
  color = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
  variant = signal<'' | 'simple' | 'outlined' | 'flat' | 'raised'>('raised');

  // Color picker (only shown while "Dynamic coloring" is on)
  selectedColor = signal<[number, number, number]>([60, 131, 246]);
  currentColor = signal<{ rgb: string; hex: string; hsl: string; hue: number; saturation: number } | null>(null);

  constructor() {
    effect(() => {
      if (this.noBg()) {
        const variant = this.variant();
        if (variant === 'flat' || variant === 'raised') {
          this.variant.set('outlined');
        }
      }
    });
  }
}
