import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';

@Component({
  selector: 'app-basic-button-group',
  standalone: true,
  imports: [ShipButtonGroup],
  templateUrl: './basic-button-group.html',
  styleUrl: './basic-button-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicButtonGroup {
  selected = signal<string | null>('one');
}
