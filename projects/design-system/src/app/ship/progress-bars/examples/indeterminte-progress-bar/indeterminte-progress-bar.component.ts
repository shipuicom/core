import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipProgressBarComponent } from 'ship-ui';

@Component({
  selector: 'app-indeterminte-progress-bar',
  imports: [ShipProgressBarComponent],
  templateUrl: './indeterminte-progress-bar.component.html',
  styleUrl: './indeterminte-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndeterminteProgressBarComponent {}
