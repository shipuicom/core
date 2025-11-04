import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipProgressBar } from 'ship-ui';

@Component({
  selector: 'app-raised-progress-bar',
  standalone: true,
  imports: [ShipProgressBar],
  templateUrl: './raised-progress-bar.component.html',
  styleUrl: './raised-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedProgressBarComponent {}
