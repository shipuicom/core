import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipProgressBar } from 'ship-ui';

@Component({
  selector: 'app-flat-progress-bar',
  standalone: true,
  imports: [ShipProgressBar],
  templateUrl: './flat-progress-bar.component.html',
  styleUrl: './flat-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatProgressBarComponent {}
