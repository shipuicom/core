import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ShipSpinner } from '@ship-ui/core/ship-spinner';

@Component({
  selector: 'app-sandbox-spinner',
  imports: [ShipSpinner],
  templateUrl: './sandbox-spinner.html',
  styleUrl: './sandbox-spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxSpinner {
  size = input(40);
  sizeAsPixels = computed(() => `${this.size()}px`);

  thickness = input(5);
  thicknessAsPixels = computed(() => `${this.thickness()}px`);
}
