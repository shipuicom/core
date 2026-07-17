import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-basic-icon',
  standalone: true,
  imports: [ShipIcon],
  templateUrl: './basic-icon.html',
  styleUrl: './basic-icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicIcon {}
