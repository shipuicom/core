import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButtonComponent, ShipIconComponent } from '@ship-ui/core';

@Component({
  selector: 'app-base-button',
  imports: [ShipIconComponent, ShipButtonComponent],
  templateUrl: './base-button.component.html',
  styleUrl: './base-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseButtonComponent {}
