import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipProgressBar } from 'ship-ui';

@Component({
  selector: 'app-outlined-progress-bar',
  standalone: true,
  imports: [ShipProgressBar],
  templateUrl: './outlined-progress-bar.html',
  styleUrl: './outlined-progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedProgressBar {}
