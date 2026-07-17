import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipProgressBar } from '@ship-ui/core/ship-progress-bar';

@Component({
  selector: 'app-basic-progress-bar',
  standalone: true,
  imports: [ShipProgressBar],
  templateUrl: './basic-progress-bar.html',
  styleUrl: './basic-progress-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicProgressBar {}
