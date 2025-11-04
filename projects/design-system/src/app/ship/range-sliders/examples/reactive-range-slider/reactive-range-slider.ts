import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ShipRangeSlider } from 'ship-ui';

@Component({
  selector: 'app-reactive-range-slider',
  standalone: true,
  imports: [ReactiveFormsModule, ShipRangeSlider],
  templateUrl: './reactive-range-slider.html',
  styleUrl: './reactive-range-slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactiveRangeSlider {
  control = new FormControl(25);
}
