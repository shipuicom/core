import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAlert } from '@ship-ui/core/ship-alert';

@Component({
  selector: 'app-basic-alert',
  standalone: true,
  imports: [ShipAlert],
  templateUrl: './basic-alert.html',
  styleUrl: './basic-alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAlert {}
