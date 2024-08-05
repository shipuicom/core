import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';

@Component({
  selector: 'spk-checkbox',
  standalone: true,
  imports: [SparkleIconComponent],
  template: `
    <div class="box">
      <spk-icon class="inherit">check</spk-icon>
    </div>

    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleCheckboxComponent {}
