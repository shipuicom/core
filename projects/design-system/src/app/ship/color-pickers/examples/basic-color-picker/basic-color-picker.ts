import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipColorPicker } from '@ship-ui/core/ship-color-picker';

@Component({
  selector: 'app-basic-color-picker',
  standalone: true,
  imports: [ShipColorPicker],
  templateUrl: './basic-color-picker.html',
  styleUrl: './basic-color-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicColorPicker {}
