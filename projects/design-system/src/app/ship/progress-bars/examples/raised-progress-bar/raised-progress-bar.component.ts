import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipProgressBarComponent } from 'ship-ui';

@Component({
  selector: 'app-raised-progress-bar',
  standalone: true,
  imports: [ShipProgressBarComponent],
  templateUrl: './raised-progress-bar.component.html',
  styleUrl: './raised-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedProgressBarComponent {}
