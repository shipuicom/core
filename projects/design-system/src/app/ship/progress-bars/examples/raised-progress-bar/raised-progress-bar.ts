import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipProgressBar } from 'ship-ui';

@Component({
  selector: 'app-raised-progress-bar',
  standalone: true,
  imports: [ShipProgressBar],
  templateUrl: './raised-progress-bar.html',
  styleUrl: './raised-progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedProgressBar {}
