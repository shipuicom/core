import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIconComponent } from '@ship-ui/core';

@Component({
  selector: 'app-raised-button',
  imports: [ShipIconComponent, ShipButtonComponent],
  templateUrl: './raised-button.component.html',
  styleUrl: './raised-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaisedButtonComponent {}
