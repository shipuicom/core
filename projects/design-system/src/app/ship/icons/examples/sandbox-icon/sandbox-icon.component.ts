import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButtonGroup, ShipIcon, ShipRangeSliderComponent } from 'ship-ui';

@Component({
  selector: 'app-sandbox-icon',
  imports: [FormsModule, ShipIcon, ShipButtonGroup, ShipRangeSliderComponent],
  templateUrl: './sandbox-icon.component.html',
  styleUrl: './sandbox-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxIconComponent {
  size = signal<string>('');
  sizeValue = signal<number>(10);
  colorClass = signal<string>('');
}
