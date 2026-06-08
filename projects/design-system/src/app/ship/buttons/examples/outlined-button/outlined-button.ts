import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-outlined-button',
  imports: [ShipIcon, ShipButton],
  templateUrl: './outlined-button.html',
  styleUrl: './outlined-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutlinedButton {}
