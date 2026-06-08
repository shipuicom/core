import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-flat-button',
  imports: [ShipIcon, ShipButton],
  templateUrl: './flat-button.html',
  styleUrl: './flat-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlatButton {}
