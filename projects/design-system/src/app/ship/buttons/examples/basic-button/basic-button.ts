import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';

@Component({
  selector: 'app-basic-button',
  standalone: true,
  imports: [ShipButton],
  templateUrl: './basic-button.html',
  styleUrl: './basic-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicButton {}
