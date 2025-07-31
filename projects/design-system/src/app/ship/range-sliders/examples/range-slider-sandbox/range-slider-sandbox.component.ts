import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ShipButtonGroupComponent,
  ShipFormFieldComponent,
  ShipRangeSliderComponent,
  ShipToggleComponent,
} from 'ship-ui';

@Component({
  selector: 'app-range-slider-sandbox',
  standalone: true,
  imports: [
    FormsModule,
    ShipRangeSliderComponent,
    ShipButtonGroupComponent,
    ShipToggleComponent,
    ShipFormFieldComponent,
  ],
  templateUrl: './range-slider-sandbox.component.html',
  styleUrl: './range-slider-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeSliderSandboxComponent {
  value = signal(50);
  min = signal(0);
  max = signal(100);
  step = signal(1);
  disabled = signal(false);
  readonly = signal(false);
  alwaysShow = signal(false);
  sharp = signal(false);
  unit = signal('%');
  color = signal<'primary' | 'accent' | 'warn' | 'success' | 'error'>('primary');
  variation = signal<'base' | 'thick' | 'outlined' | 'flat' | 'raised'>('base');
}
