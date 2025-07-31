import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipProgressBarComponent } from '@ship-ui/core';

@Component({
  selector: 'app-base-progress-bar',
  standalone: true,
  imports: [ShipProgressBarComponent],
  templateUrl: './base-progress-bar.component.html',
  styleUrl: './base-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseProgressBarComponent {}
