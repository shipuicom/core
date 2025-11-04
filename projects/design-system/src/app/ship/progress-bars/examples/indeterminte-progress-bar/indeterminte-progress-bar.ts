import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipProgressBar } from 'ship-ui';

@Component({
  selector: 'app-indeterminte-progress-bar',
  imports: [ShipProgressBar],
  templateUrl: './indeterminte-progress-bar.html',
  styleUrl: './indeterminte-progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndeterminteProgressBar {}
