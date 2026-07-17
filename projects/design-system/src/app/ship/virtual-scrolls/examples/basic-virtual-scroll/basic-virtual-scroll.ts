import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipVirtualScroll } from '@ship-ui/core/ship-virtual-scroll';

@Component({
  selector: 'app-basic-virtual-scroll',
  standalone: true,
  imports: [ShipVirtualScroll],
  templateUrl: './basic-virtual-scroll.html',
  styleUrl: './basic-virtual-scroll.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicVirtualScroll {
  items = signal<string[]>(Array.from({ length: 1000 }, (_, i) => 'Item ' + i));
}
