import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipProgressBar } from 'ship-ui';

@Component({
  selector: 'app-flat-progress-bar',
  standalone: true,
  imports: [ShipProgressBar],
  templateUrl: './flat-progress-bar.html',
  styleUrl: './flat-progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatProgressBar {}
