import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipProgressBarComponent } from '@ship-ui/core';

@Component({
  selector: 'app-flat-progress-bar',
  standalone: true,
  imports: [ShipProgressBarComponent],
  templateUrl: './flat-progress-bar.component.html',
  styleUrl: './flat-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatProgressBarComponent {}
