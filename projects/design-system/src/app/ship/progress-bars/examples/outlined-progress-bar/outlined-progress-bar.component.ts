import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipProgressBarComponent } from 'ship-ui';

@Component({
  selector: 'app-outlined-progress-bar',
  standalone: true,
  imports: [ShipProgressBarComponent],
  templateUrl: './outlined-progress-bar.component.html',
  styleUrl: './outlined-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedProgressBarComponent {}
