import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipSpinner } from '@ship-ui/core/ship-spinner';

@Component({
  selector: 'app-basic-spinner',
  standalone: true,
  imports: [ShipSpinner],
  templateUrl: './basic-spinner.html',
  styleUrl: './basic-spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicSpinner {}
