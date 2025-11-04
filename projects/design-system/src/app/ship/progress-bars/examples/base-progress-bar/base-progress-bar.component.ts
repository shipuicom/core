import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipProgressBar } from 'ship-ui';

@Component({
  selector: 'app-base-progress-bar',
  standalone: true,
  imports: [ShipProgressBar],
  templateUrl: './base-progress-bar.component.html',
  styleUrl: './base-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseProgressBarComponent {}
